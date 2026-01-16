import { stromnoManager } from '@/lib/stromno-manager'

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
        isConnected: stromnoManager.isConnected,
        currentBpm: stromnoManager.currentBpm,
        history: stromnoManager.history,
      })

      // Subscribe to updates
      unsubscribe = stromnoManager.subscribe(subscriberId, (data) => {
        sendEvent({ type: 'heartrate', ...data })
      })

      // Periodic status updates
      pingInterval = setInterval(() => {
        sendEvent({
          type: 'status',
          isConnected: stromnoManager.isConnected,
          currentBpm: stromnoManager.currentBpm,
        })
      }, 5000)
    },

    cancel() {
      console.log(`[SSE] Client ${subscriberId} disconnected`)
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
