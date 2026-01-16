import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import { useGlucoseStore, GlucoseTrend } from '@/stores/glucose'

// ============================================================================
// Zod Schemas for API Responses
// ============================================================================

const ConnectResponseSchema = z.object({
  success: z.boolean(),
})

const DisconnectResponseSchema = z.object({
  success: z.boolean(),
})

export const DexcomCredentialsSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  region: z.enum(['us', 'ous']),
})

export type DexcomCredentials = z.infer<typeof DexcomCredentialsSchema>

// ============================================================================
// API Functions
// ============================================================================

async function connectDexcomApi(credentials: DexcomCredentials): Promise<void> {
  const response = await fetch('/api/dexcom/connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to connect')
  }

  const data = await response.json()
  const parsed = ConnectResponseSchema.safeParse(data)
  if (!parsed.success) {
    throw new Error('Invalid response from server')
  }
}

async function disconnectDexcomApi(): Promise<void> {
  const response = await fetch('/api/dexcom/disconnect', {
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

export function useConnectDexcom() {
  return useMutation({
    mutationFn: connectDexcomApi,
  })
}

export function useDisconnectDexcom() {
  const store = useGlucoseStore.getState()

  return useMutation({
    mutationFn: disconnectDexcomApi,
    onSuccess: () => {
      store.setConnected(false)
      store.clearHistory()
    },
  })
}

// ============================================================================
// SSE Subscription
// ============================================================================

let eventSource: EventSource | null = null

/**
 * Subscribe to glucose updates via SSE
 */
export function subscribeToGlucose(): () => void {
  const store = useGlucoseStore.getState()

  // Close existing connection
  if (eventSource) {
    eventSource.close()
  }

  eventSource = new EventSource('/api/dexcom/stream')

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)

      if (data.type === 'init') {
        store.setConnected(data.isConnected)
        if (data.history && data.history.length > 0) {
          store.clearHistory()
          for (const point of data.history) {
            store.addDataPoint(point.mgdl, point.mappedTrend as GlucoseTrend)
          }
        }
        if (data.currentGlucose) {
          store.setCurrentGlucose(
            data.currentGlucose.mgdl,
            data.currentGlucose.mappedTrend as GlucoseTrend
          )
        }
      } else if (data.type === 'glucose') {
        store.addDataPoint(data.mgdl, data.mappedTrend as GlucoseTrend)
        store.setConnected(true)
      } else if (data.type === 'status') {
        store.setConnected(data.isConnected)
        if (data.currentGlucose) {
          store.setCurrentGlucose(
            data.currentGlucose.mgdl,
            data.currentGlucose.mappedTrend as GlucoseTrend
          )
        }
      }
    } catch (err) {
      console.error('[Dexcom Client] Failed to parse SSE message:', err)
    }
  }

  eventSource.onerror = () => {
    console.error('[Dexcom Client] SSE connection error')
    store.setConnected(false)

    setTimeout(() => {
      if (eventSource?.readyState === EventSource.CLOSED) {
        subscribeToGlucose()
      }
    }, 5000)
  }

  return () => {
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }
  }
}
