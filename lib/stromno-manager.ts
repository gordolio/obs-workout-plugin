import WebSocket from 'ws'
import { z } from 'zod'

// ============================================================================
// Zod Schemas
// ============================================================================

export const HeartRateDataSchema = z.object({
  bpm: z.number(),
  timestamp: z.number(),
})

export type HeartRateData = z.infer<typeof HeartRateDataSchema>

const WidgetConfigResponseSchema = z.object({
  result: z.object({
    ramielUrl: z.string(),
  }),
})

const StromnoMessageSchema = z.object({
  timestamp: z.number().optional(),
  data: z.object({
    heartRate: z.number(),
  }),
})

// ============================================================================
// Subscriber Interface
// ============================================================================

interface Subscriber {
  id: string
  send: (data: HeartRateData) => void
}

// ============================================================================
// Stromno Manager Class
// ============================================================================

class StromnoManager {
  private websocket: WebSocket | null = null
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  private subscribers: Map<string, Subscriber> = new Map()
  private _currentBpm: number = 0
  private _isConnected: boolean = false
  private websocketUrl: string | null = null
  private _history: HeartRateData[] = []
  private readonly MAX_HISTORY = 360

  get currentBpm() {
    return this._currentBpm
  }
  get isConnected() {
    return this._isConnected
  }
  get history() {
    return [...this._history]
  }
  get subscriberCount() {
    return this.subscribers.size
  }

  async connect(widgetUrl: string): Promise<void> {
    const widgetId = this.parseWidgetUrl(widgetUrl)
    if (!widgetId) {
      throw new Error('Invalid widget URL')
    }

    const config = await this.fetchWidgetConfig(widgetId)
    if (!config.ramielUrl) {
      throw new Error('Widget config missing WebSocket URL')
    }

    this.websocketUrl = config.ramielUrl
    this.connectWebSocket()
  }

  private parseWidgetUrl(url: string): string | null {
    try {
      const urlObj = new URL(url)
      const pathParts = urlObj.pathname.split('/')
      const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      for (const part of pathParts) {
        if (uuidPattern.test(part)) {
          return part
        }
      }
      return null
    } catch {
      return null
    }
  }

  private async fetchWidgetConfig(
    widgetId: string
  ): Promise<{ ramielUrl: string }> {
    const response = await fetch('https://api.stromno.com/v1/api/public/rpc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'getWidget',
        jsonrpc: '2.0',
        params: { widgetId },
        id: crypto.randomUUID(),
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch widget config: ${response.status}`)
    }

    const data = await response.json()

    // Validate with Zod
    const parsed = WidgetConfigResponseSchema.safeParse(data)
    if (!parsed.success) {
      throw new Error(data.error?.message || 'Invalid widget config response')
    }

    return parsed.data.result
  }

  private connectWebSocket(): void {
    if (!this.websocketUrl) return

    this.disconnect(false)

    try {
      console.log('[Stromno Server] Connecting to:', this.websocketUrl)
      this.websocket = new WebSocket(this.websocketUrl)

      this.websocket.on('open', () => {
        console.log('[Stromno Server] Connected to WebSocket')
        this._isConnected = true
      })

      this.websocket.on('message', (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString())
          const parsed = StromnoMessageSchema.safeParse(message)

          if (parsed.success && parsed.data.data.heartRate) {
            this._currentBpm = parsed.data.data.heartRate
            const hrData: HeartRateData = {
              bpm: parsed.data.data.heartRate,
              timestamp: parsed.data.timestamp || Date.now(),
            }

            this._history.push(hrData)
            if (this._history.length > this.MAX_HISTORY) {
              this._history = this._history.slice(-this.MAX_HISTORY)
            }

            this.broadcast(hrData)
          }
        } catch (err) {
          console.error('[Stromno Server] Failed to parse message:', err)
        }
      })

      this.websocket.on('error', (error: Error) => {
        console.error('[Stromno Server] WebSocket error:', error.message)
        this._isConnected = false
      })

      this.websocket.on('close', () => {
        console.log('[Stromno Server] WebSocket closed')
        this._isConnected = false

        if (this.websocketUrl) {
          this.reconnectTimeout = setTimeout(() => {
            console.log('[Stromno Server] Attempting to reconnect...')
            this.connectWebSocket()
          }, 5000)
        }
      })
    } catch (err) {
      console.error('[Stromno Server] Failed to connect:', err)
      this._isConnected = false
    }
  }

  disconnect(clearUrl: boolean = true): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.websocket) {
      this.websocket.close()
      this.websocket = null
    }

    if (clearUrl) {
      this.websocketUrl = null
      this._history = []
      this._currentBpm = 0
    }

    this._isConnected = false
  }

  subscribe(id: string, send: (data: HeartRateData) => void): () => void {
    this.subscribers.set(id, { id, send })
    console.log(
      `[Stromno] Subscriber ${id} added. Total: ${this.subscribers.size}`
    )

    if (this._currentBpm > 0) {
      send({ bpm: this._currentBpm, timestamp: Date.now() })
    }

    return () => {
      this.subscribers.delete(id)
      console.log(
        `[Stromno] Subscriber ${id} removed. Total: ${this.subscribers.size}`
      )
    }
  }

  private broadcast(data: HeartRateData): void {
    for (const subscriber of this.subscribers.values()) {
      try {
        subscriber.send(data)
      } catch (err) {
        console.error(`[Stromno] Failed to send to ${subscriber.id}:`, err)
      }
    }
  }
}

// Global singleton
const globalForStromno = globalThis as unknown as {
  stromnoManager: StromnoManager
}
export const stromnoManager =
  globalForStromno.stromnoManager ?? new StromnoManager()
if (process.env.NODE_ENV !== 'production') {
  globalForStromno.stromnoManager = stromnoManager
}
