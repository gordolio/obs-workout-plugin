'use client'

import { useEffect } from 'react'
import { Droplet } from 'lucide-react'
import { useGlucoseStore, getTrendArrow } from '@/stores/glucose'
import { MiniChart } from '@/components/overlays/MiniChart'
import { cn } from '@/lib/utils'
import { subscribeToGlucose } from '@/services/dexcom'
import { useColorConfig } from '@/services/colors'
import { getColorForValue, DEFAULT_GLUCOSE_CONFIG } from '@/lib/color-config'

export default function GlucoseOverlay() {
  const { currentMgDl, trend, history, isConnected } = useGlucoseStore()
  const { data: colorConfig } = useColorConfig('glucose')

  // Use fetched config or defaults
  const config = colorConfig ?? DEFAULT_GLUCOSE_CONFIG

  // Subscribe to glucose updates via SSE
  useEffect(() => {
    const unsubscribe = subscribeToGlucose()
    return unsubscribe
  }, [])

  // Get icon color based on config
  const iconColor = config.icon.useGradient
    ? getColorForValue(currentMgDl, config)
    : currentMgDl === 0
      ? config.waitingColor
      : config.icon.staticColor

  // Get text/number color based on config
  const textColor = config.text.useGradient
    ? getColorForValue(currentMgDl, config)
    : currentMgDl === 0
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

  const trendArrow = getTrendArrow(trend)

  return (
    <div className="flex h-screen w-full items-center justify-center bg-transparent p-4">
      <div
        className={cn(
          'flex items-center gap-4 rounded-2xl border border-blue-500/20 px-4 py-3',
          'bg-zinc-900/90 backdrop-blur-xl shadow-2xl shadow-black/50',
          'min-w-[300px]'
        )}
      >
        <div className="flex shrink-0 items-center gap-2">
          <Droplet
            className="h-8 w-8"
            style={{
              color: iconColor,
              filter: `drop-shadow(0 0 6px ${iconColor})`,
            }}
            fill={iconColor}
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span
                className="font-mono text-4xl font-bold leading-none"
                style={{
                  color: textColor,
                  textShadow: `0 0 20px ${textColor}40`,
                }}
              >
                {currentMgDl || '--'}
              </span>
              {trendArrow && (
                <span className="text-2xl text-white/70">{trendArrow}</span>
              )}
            </div>
            <span className="text-[10px] uppercase tracking-widest text-white/50">
              mg/dL
            </span>
          </div>
        </div>

        <div className="h-[60px] min-w-[140px] flex-1">
          <MiniChart
            data={history}
            color={graphColor}
            gradientId="glucoseGradient"
            minY={40}
            maxY={250}
            referenceLines={[
              { value: 70, color: '#f59e0b' },
              { value: 180, color: '#f59e0b' },
            ]}
            colorStops={graphColorStops}
          />
        </div>

        {!isConnected && (
          <div className="absolute right-2 top-1 flex items-center gap-1 text-[10px] text-white/40">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            Disconnected
          </div>
        )}
      </div>
    </div>
  )
}
