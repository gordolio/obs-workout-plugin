import { z } from 'zod'
import { GlucoseTrend } from '@/stores/glucose'

// ============================================================================
// Constants
// ============================================================================

const DEXCOM_APPLICATION_ID = 'd8665ade-9673-4e27-9ff6-92db4ce13d13'

const DEXCOM_BASE_URLS = {
  us: 'https://share2.dexcom.com/ShareWebServices/Services',
  ous: 'https://shareous1.dexcom.com/ShareWebServices/Services',
} as const

// ============================================================================
// Zod Schemas
// ============================================================================

export const GlucoseDataSchema = z.object({
  mgdl: z.number(),
  trend: z.string(),
  timestamp: z.number(),
})

export type GlucoseData = z.infer<typeof GlucoseDataSchema>

export const DexcomCredentialsSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  region: z.enum(['us', 'ous']),
})

export type DexcomCredentials = z.infer<typeof DexcomCredentialsSchema>

// Dexcom API response schema
const DexcomGlucoseReadingSchema = z.object({
  WT: z.string(), // Timestamp like "Date(1640907228000)"
  ST: z.string(), // System time
  DT: z.string(), // Display time
  Value: z.number(), // mg/dL value
  Trend: z.string(), // Trend direction
})

// ============================================================================
// Trend Mapping
// ============================================================================

// Map Dexcom API trend strings to our GlucoseTrend type
function mapDexcomTrend(trend: string): GlucoseTrend {
  const trendMap: Record<string, GlucoseTrend> = {
    None: 'unknown',
    DoubleUp: 'rising_fast',
    SingleUp: 'rising',
    FortyFiveUp: 'rising',
    Flat: 'stable',
    FortyFiveDown: 'falling',
    SingleDown: 'falling',
    DoubleDown: 'falling_fast',
    NotComputable: 'unknown',
    RateOutOfRange: 'unknown',
  }
  return trendMap[trend] || 'unknown'
}

// Parse Dexcom timestamp format: "Date(1640907228000)"
function parseDexcomTimestamp(wt: string): number {
  const match = wt.match(/Date\((\d+)\)/)
  return match ? parseInt(match[1], 10) : Date.now()
}

// ============================================================================
// Subscriber Interface
// ============================================================================

interface Subscriber {
  id: string
  send: (data: GlucoseData & { mappedTrend: GlucoseTrend }) => void
}

// ============================================================================
// Dexcom Manager Class
// ============================================================================

class DexcomManager {
  private sessionId: string | null = null
  private credentials: DexcomCredentials | null = null
  private pollInterval: ReturnType<typeof setInterval> | null = null
  private subscribers: Map<string, Subscriber> = new Map()
  private _currentGlucose: GlucoseData | null = null
  private _isConnected: boolean = false
  private _history: GlucoseData[] = []
  private readonly MAX_HISTORY = 72 // 6 hours at 5-min intervals
  private readonly POLL_INTERVAL_MS = 60 * 1000 // Check every minute

  get currentGlucose() {
    return this._currentGlucose
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

  private getBaseUrl(): string {
    return DEXCOM_BASE_URLS[this.credentials?.region || 'us']
  }

  async connect(credentials: DexcomCredentials): Promise<void> {
    const validated = DexcomCredentialsSchema.parse(credentials)
    this.credentials = validated

    this.disconnect()

    try {
      // Step 1: Get account ID
      const accountId = await this.authenticate()

      // Step 2: Get session ID
      this.sessionId = await this.login(accountId)

      // Test the connection by fetching initial data
      await this.fetchGlucose()
      this._isConnected = true
      console.log('[Dexcom Server] Connected successfully')

      // Start polling
      this.startPolling()
    } catch (error) {
      this._isConnected = false
      this.sessionId = null
      throw error
    }
  }

  private async authenticate(): Promise<string> {
    const response = await fetch(
      `${this.getBaseUrl()}/General/AuthenticatePublisherAccount`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          accountName: this.credentials!.username,
          applicationId: DEXCOM_APPLICATION_ID,
          password: this.credentials!.password,
        }),
      }
    )

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Authentication failed: ${text}`)
    }

    const accountId = await response.json()
    if (typeof accountId !== 'string') {
      throw new Error('Invalid account ID response')
    }

    return accountId
  }

  private async login(accountId: string): Promise<string> {
    const response = await fetch(
      `${this.getBaseUrl()}/General/LoginPublisherAccountById`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          accountId,
          applicationId: DEXCOM_APPLICATION_ID,
          password: this.credentials!.password,
        }),
      }
    )

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Login failed: ${text}`)
    }

    const sessionId = await response.json()
    if (typeof sessionId !== 'string') {
      throw new Error('Invalid session ID response')
    }

    return sessionId
  }

  private async fetchGlucose(): Promise<void> {
    if (!this.sessionId) return

    try {
      const url = new URL(
        `${this.getBaseUrl()}/Publisher/ReadPublisherLatestGlucoseValues`
      )
      url.searchParams.set('sessionId', this.sessionId)
      url.searchParams.set('minutes', '60')
      url.searchParams.set('maxCount', '12')

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        // Session might have expired, try to re-authenticate
        if (response.status === 500) {
          console.log('[Dexcom Server] Session expired, re-authenticating...')
          const accountId = await this.authenticate()
          this.sessionId = await this.login(accountId)
          return this.fetchGlucose()
        }
        throw new Error(`Failed to fetch glucose: ${response.status}`)
      }

      const readings = await response.json()

      if (!Array.isArray(readings) || readings.length === 0) {
        return
      }

      // Validate and process readings
      const validReadings: GlucoseData[] = []
      for (const reading of readings) {
        const parsed = DexcomGlucoseReadingSchema.safeParse(reading)
        if (parsed.success) {
          validReadings.push({
            mgdl: parsed.data.Value,
            trend: parsed.data.Trend,
            timestamp: parseDexcomTimestamp(parsed.data.WT),
          })
        }
      }

      if (validReadings.length === 0) return

      // Sort by timestamp (oldest first)
      validReadings.sort((a, b) => a.timestamp - b.timestamp)

      // Add to history
      for (const reading of validReadings) {
        const exists = this._history.some(
          (h) => h.timestamp === reading.timestamp
        )
        if (!exists) {
          this._history.push(reading)
          if (this._history.length > this.MAX_HISTORY) {
            this._history = this._history.slice(-this.MAX_HISTORY)
          }
        }
      }

      // Set current glucose to the most recent
      const latest = validReadings[validReadings.length - 1]
      this._currentGlucose = latest

      this.broadcast(latest)
    } catch (error) {
      console.error('[Dexcom Server] Failed to fetch glucose:', error)
    }
  }

  private startPolling(): void {
    this.stopPolling()
    this.pollInterval = setInterval(() => {
      this.fetchGlucose()
    }, this.POLL_INTERVAL_MS)
  }

  private stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }
  }

  disconnect(): void {
    this.stopPolling()
    this.sessionId = null
    this._isConnected = false
    this._currentGlucose = null
    this._history = []
    console.log('[Dexcom Server] Disconnected')
  }

  subscribe(
    id: string,
    send: (data: GlucoseData & { mappedTrend: GlucoseTrend }) => void
  ): () => void {
    this.subscribers.set(id, { id, send })
    console.log(
      `[Dexcom] Subscriber ${id} added. Total: ${this.subscribers.size}`
    )

    // Send current data if available
    if (this._currentGlucose) {
      send({
        ...this._currentGlucose,
        mappedTrend: mapDexcomTrend(this._currentGlucose.trend),
      })
    }

    return () => {
      this.subscribers.delete(id)
      console.log(
        `[Dexcom] Subscriber ${id} removed. Total: ${this.subscribers.size}`
      )
    }
  }

  private broadcast(data: GlucoseData): void {
    const enrichedData = {
      ...data,
      mappedTrend: mapDexcomTrend(data.trend),
    }

    for (const subscriber of this.subscribers.values()) {
      try {
        subscriber.send(enrichedData)
      } catch (err) {
        console.error(`[Dexcom] Failed to send to ${subscriber.id}:`, err)
      }
    }
  }
}

// Global singleton
const globalForDexcom = globalThis as unknown as {
  dexcomManager: DexcomManager
}
export const dexcomManager =
  globalForDexcom.dexcomManager ?? new DexcomManager()
if (process.env.NODE_ENV !== 'production') {
  globalForDexcom.dexcomManager = dexcomManager
}
