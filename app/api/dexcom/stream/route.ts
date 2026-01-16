import { dexcomManager } from '@/lib/dexcom-manager'

export const dynamic = 'force-dynamic'

export async function GET() {
  const subscriberId = crypto.randomUUID()
  let unsubscribe: (() => void) | null = null
  let pingInterval: ReturnType<typeof setInterval> | null = null

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()

      const sendEvent = (data: object) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          )
        } catch {
          // Stream closed
        }
      }

      // Send initial status
      sendEvent({
        type: 'init',
        isConnected: dexcomManager.isConnected,
        currentGlucose: dexcomManager.currentGlucose,
        history: dexcomManager.history,
      })

      // Subscribe to updates
      unsubscribe = dexcomManager.subscribe(subscriberId, (data) => {
        sendEvent({ type: 'glucose', ...data })
      })

      // Periodic status updates (every 30 seconds for glucose)
      pingInterval = setInterval(() => {
        sendEvent({
          type: 'status',
          isConnected: dexcomManager.isConnected,
          currentGlucose: dexcomManager.currentGlucose,
        })
      }, 30000)
    },

    cancel() {
      console.log(`[Dexcom SSE] Client ${subscriberId} disconnected`)
      if (pingInterval) clearInterval(pingInterval)
      if (unsubscribe) unsubscribe()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Connection: 'keep-alive',
    },
  })
}
