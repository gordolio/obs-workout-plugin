'use client'

import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { ColorStop } from '@/lib/color-config'

interface DataPoint {
  time: number
  value: number
}

interface MiniChartProps {
  data: DataPoint[]
  color: string
  gradientId: string
  minY?: number
  maxY?: number
  referenceLines?: { value: number; color: string }[]
  colorStops?: ColorStop[] // When provided, creates a value-based gradient
}

export function MiniChart({
  data,
  color,
  gradientId,
  minY,
  maxY,
  referenceLines = [],
  colorStops,
}: MiniChartProps) {
  // Derive time window from data (avoids impure Date.now() during render)
  const { filteredData, timeWindow } = useMemo(() => {
    if (data.length === 0) {
      return { filteredData: [], timeWindow: { start: 0, end: 0 } }
    }
    const latestTime = Math.max(...data.map((d) => d.time))
    const windowStart = latestTime - 30 * 60 * 1000
    return {
      filteredData: data.filter((d) => d.time >= windowStart),
      timeWindow: { start: windowStart, end: latestTime },
    }
  }, [data])

  // Calculate domain
  const values = filteredData.map((d) => d.value)
  const dataMin = values.length > 0 ? Math.min(...values) : 0
  const dataMax = values.length > 0 ? Math.max(...values) : 100
  const padding = (dataMax - dataMin) * 0.1 || 10

  const yMin = minY !== undefined ? minY : Math.floor(dataMin - padding)
  const yMax = maxY !== undefined ? maxY : Math.ceil(dataMax + padding)

  // Generate gradient stops from colorStops if provided
  const gradientStops = useMemo(() => {
    if (!colorStops || colorStops.length === 0) {
      // Default single-color gradient
      return [
        { offset: '0%', color, opacity: 0.4 },
        { offset: '100%', color, opacity: 0.05 },
      ]
    }

    // Sort stops by threshold (high to low for SVG gradient which goes top to bottom)
    const sorted = [...colorStops].sort((a, b) => b.threshold - a.threshold)

    return sorted.map((stop) => {
      // Map threshold to Y percentage (0% = top = maxY, 100% = bottom = minY)
      const percent = ((yMax - stop.threshold) / (yMax - yMin)) * 100
      const clampedPercent = Math.max(0, Math.min(100, percent))
      return {
        offset: `${clampedPercent}%`,
        color: stop.color,
        opacity: 0.4,
      }
    })
  }, [colorStops, color, yMin, yMax])

  // Determine stroke color - use the middle stop color if colorStops provided
  const strokeColor = useMemo(() => {
    if (!colorStops || colorStops.length === 0) {
      return color
    }
    // Use the color of the middle threshold for the stroke
    const sorted = [...colorStops].sort((a, b) => a.threshold - b.threshold)
    const middleIndex = Math.floor(sorted.length / 2)
    return sorted[middleIndex].color
  }, [colorStops, color])

  if (filteredData.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-lg bg-white/5">
        <span className="text-xs italic text-white/30">
          Waiting for data...
        </span>
      </div>
    )
  }

  return (
    <div className="h-full w-full min-h-[60px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={filteredData}
          margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              {gradientStops.map((stop, i) => (
                <stop
                  key={i}
                  offset={stop.offset}
                  stopColor={stop.color}
                  stopOpacity={stop.opacity}
                />
              ))}
            </linearGradient>
          </defs>

          <XAxis
            dataKey="time"
            type="number"
            domain={[timeWindow.start, timeWindow.end]}
            tick={false}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            domain={[yMin, yMax]}
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={28}
            tickCount={3}
          />

          {referenceLines.map((line, i) => (
            <ReferenceLine
              key={i}
              y={line.value}
              stroke={line.color}
              strokeDasharray="3 3"
              strokeOpacity={0.5}
            />
          ))}

          <Area
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
