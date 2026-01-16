import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import { useHeartRateStore } from '@/stores/heartrate'

// ============================================================================
// Zod Schemas for API Responses
// ============================================================================

const ConnectResponseSchema = z.object({
  success: z.boolean(),
})

const DisconnectResponseSchema = z.object({
  success: z.boolean(),
})

// ============================================================================
// URL Parsing
// ============================================================================

/**
 * Validate a Stromno widget URL and extract the UUID
 */
export function parseWidgetUrl(url: string): string | null {
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

// ============================================================================
// API Functions
// ============================================================================

async function connectStromnoApi(widgetUrl: string): Promise<void> {
  const response = await fetch('/api/stromno/connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ widgetUrl }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || 'Failed to connect')
  }

  const data = await response.json()
  const parsed = ConnectResponseSchema.safeParse(data)
  if (!parsed.success) {
    throw new Error('Invalid response from server')
  }
}

async function disconnectStromnoApi(): Promise<void> {
  const response = await fetch('/api/stromno/disconnect', {
    method: 'POST',
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || 'Failed to disconnect')
  }

  const data = await response.json()
  const parsed = DisconnectResponseSchema.safeParse(data)
  if (!parsed.success) {
    throw new Error('Invalid response from server')
  }
}

// ============================================================================
// React Query Hooks
// ============================================================================

export function useConnectStromno() {
  return useMutation({
    mutationFn: connectStromnoApi,
  })
}

export function useDisconnectStromno() {
  const store = useHeartRateStore.getState()

  return useMutation({
    mutationFn: disconnectStromnoApi,
    onSuccess: () => {
      store.setConnected(false)
    },
  })
}

// ============================================================================
// SSE Subscription
// ============================================================================

let eventSource: EventSource | null = null

/**
 * Subscribe to heart rate updates via SSE
 */
export function subscribeToHeartRate(): () => void {
  const store = useHeartRateStore.getState()

  // Close existing connection
  if (eventSource) {
    eventSource.close()
  }

  eventSource = new EventSource('/api/stromno/stream')

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)

      if (data.type === 'init') {
        store.setConnected(data.isConnected)
        if (data.history && data.history.length > 0) {
          store.clearHistory()
          for (const point of data.history) {
            store.addDataPoint(point.bpm)
          }
        }
      } else if (data.type === 'heartrate') {
        store.addDataPoint(data.bpm)
        store.setConnected(true)
      } else if (data.type === 'status') {
        store.setConnected(data.isConnected)
        if (data.currentBpm && data.currentBpm > 0) {
          store.setCurrentBpm(data.currentBpm)
        }
      }
    } catch (err) {
      console.error('[Stromno Client] Failed to parse SSE message:', err)
    }
  }

  eventSource.onerror = () => {
    console.error('[Stromno Client] SSE connection error')
    store.setConnected(false)

    setTimeout(() => {
      if (eventSource?.readyState === EventSource.CLOSED) {
        subscribeToHeartRate()
      }
    }, 3000)
  }

  return () => {
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }
  }
}
