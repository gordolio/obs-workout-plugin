'use client'

import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import { useHeartRateStore } from '@/stores/heartrate'
import { MiniChart } from '@/components/overlays/MiniChart'
import { cn } from '@/lib/utils'
import { subscribeToHeartRate } from '@/services/stromno'
import { useColorConfig } from '@/services/colors'
import { getColorForValue, DEFAULT_HEARTRATE_CONFIG } from '@/lib/color-config'

export default function HeartRateOverlay() {
  const { currentBpm, history, isConnected } = useHeartRateStore()
  const [pulse, setPulse] = useState(false)
  const { data: colorConfig } = useColorConfig('heartrate')

  // Use fetched config or defaults
  const config = colorConfig ?? DEFAULT_HEARTRATE_CONFIG

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

  // Get icon color based on config
  const iconColor = config.icon.useGradient
    ? getColorForValue(currentBpm, config)
    : currentBpm === 0
      ? config.waitingColor
      : config.icon.staticColor

  // Get text/number color based on config
  const textColor = config.text.useGradient
    ? getColorForValue(currentBpm, config)
    : currentBpm === 0
      ? config.waitingColor
      : config.text.staticColor

  // Get graph color/stops based on config
  const graphColor = config.graph.useGradient
    ? (config.colorStops[Math.floor(config.colorStops.length / 2)]?.color ??
      config.graph.staticColor)
    : config.graph.staticColor
  const graphColorStops = config.graph.useGradient
    ? config.colorStops
    : undefined

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
              color: iconColor,
              filter: pulse
                ? `drop-shadow(0 0 12px ${iconColor})`
                : `drop-shadow(0 0 6px ${iconColor})`,
            }}
            fill={iconColor}
          />
          <div className="flex flex-col">
            <span
              className="font-mono text-4xl font-bold leading-none"
              style={{
                color: textColor,
                textShadow: `0 0 20px ${textColor}40`,
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
            color={graphColor}
            gradientId="heartGradient"
            minY={50}
            maxY={200}
            colorStops={graphColorStops}
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
