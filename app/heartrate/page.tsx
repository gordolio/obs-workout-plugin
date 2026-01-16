'use client'

import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import { useHeartRateStore } from '@/stores/heartrate'
import { MiniChart } from '@/components/overlays/MiniChart'
import { cn } from '@/lib/utils'
import { subscribeToHeartRate } from '@/services/stromno'

export default function HeartRateOverlay() {
  const { currentBpm, history, isConnected } = useHeartRateStore()
  const [pulse, setPulse] = useState(false)

  // Subscribe to SSE stream on mount
  useEffect(() => {
    const unsubscribe = subscribeToHeartRate()
    return unsubscribe
  }, [])

  // Pulse animation tied to heart rate
  useEffect(() => {
    if (currentBpm <= 0) return

    const interval = 60000 / currentBpm
    const timer = setInterval(() => {
      setPulse(true)
      setTimeout(() => setPulse(false), 150)
    }, interval)

    return () => clearInterval(timer)
  }, [currentBpm])

  const bpmColor = getBpmColor(currentBpm)

  return (
    <div className="flex h-screen w-full items-center justify-center bg-transparent p-4">
      <div
        className={cn(
          'flex items-center gap-4 rounded-2xl border border-red-500/20 px-4 py-3',
          'bg-zinc-900/90 backdrop-blur-xl shadow-2xl shadow-black/50',
          'min-w-[300px] relative'
        )}
      >
        <div className="flex shrink-0 items-center gap-2">
          <Heart
            className={cn(
              'h-8 w-8 transition-transform duration-150',
              pulse ? 'scale-125' : 'scale-100'
            )}
            style={{
              color: bpmColor,
              filter: pulse
                ? `drop-shadow(0 0 12px ${bpmColor})`
                : `drop-shadow(0 0 6px ${bpmColor})`,
            }}
            fill={bpmColor}
          />
          <div className="flex flex-col">
            <span
              className="font-mono text-4xl font-bold leading-none"
              style={{
                color: bpmColor,
                textShadow: `0 0 20px ${bpmColor}40`,
              }}
            >
              {currentBpm || '--'}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-white/50">
              BPM
            </span>
          </div>
        </div>

        <div className="h-[60px] min-w-[140px] flex-1">
          <MiniChart
            data={history}
            color="#ef4444"
            gradientId="heartGradient"
            minY={50}
            maxY={200}
          />
        </div>

        {!isConnected && (
          <div className="absolute right-2 top-1 flex items-center gap-1 text-[10px] text-white/40">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Waiting
          </div>
        )}
      </div>
    </div>
  )
}

function getBpmColor(bpm: number): string {
  if (bpm === 0) return '#888'
  if (bpm < 60) return '#3b82f6'
  if (bpm < 100) return '#22c55e'
  if (bpm < 140) return '#f59e0b'
  return '#ef4444'
}
