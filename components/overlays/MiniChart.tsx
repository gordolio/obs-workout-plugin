'use client'

import { useMemo } from 'react'
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
  colorStops?: ColorStop[]
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
  const chartData = useMemo(() => {
    if (data.length === 0) {
      return null
    }

    const latestTime = Math.max(...data.map((d) => d.time))
    const windowStart = latestTime - 30 * 60 * 1000
    const filtered = data.filter((d) => d.time >= windowStart)

    if (filtered.length === 0) return null

    const values = filtered.map((d) => d.value)
    const dataMin = Math.min(...values)
    const dataMax = Math.max(...values)
    const range = dataMax - dataMin

    const yMinVal =
      minY !== undefined ? minY : range === 0 ? dataMin - 1 : dataMin
    const yMaxVal =
      maxY !== undefined ? maxY : range === 0 ? dataMax + 1 : dataMax
    const yRange = yMaxVal - yMinVal

    const timeRange = latestTime - windowStart

    return {
      points: filtered,
      yMin: yMinVal,
      yMax: yMaxVal,
      yRange,
      timeStart: windowStart,
      timeEnd: latestTime,
      timeRange,
    }
  }, [data, minY, maxY])

  // Generate gradient stops
  const gradientStops = useMemo(() => {
    if (!colorStops || colorStops.length === 0 || !chartData) {
      return [
        { offset: '0%', color, opacity: 0.4 },
        { offset: '100%', color, opacity: 0.05 },
      ]
    }

    const sorted = [...colorStops].sort((a, b) => b.threshold - a.threshold)
    return sorted.map((stop) => {
      const percent =
        ((chartData.yMax - stop.threshold) / chartData.yRange) * 100
      const clampedPercent = Math.max(0, Math.min(100, percent))
      return {
        offset: `${clampedPercent}%`,
        color: stop.color,
        opacity: 0.4,
      }
    })
  }, [colorStops, color, chartData])

  const strokeColor = useMemo(() => {
    if (!colorStops || colorStops.length === 0) {
      return color
    }
    const sorted = [...colorStops].sort((a, b) => a.threshold - b.threshold)
    const middleIndex = Math.floor(sorted.length / 2)
    return sorted[middleIndex].color
  }, [colorStops, color])

  if (!chartData) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-lg bg-white/5">
        <span className="text-xs italic text-white/30">
          Waiting for data...
        </span>
      </div>
    )
  }

  const {
    points,
    yMin: yMinVal,
    yMax: yMaxVal,
    yRange,
    timeStart,
    timeRange,
  } = chartData

  // SVG viewBox dimensions
  const width = 100
  const height = 100
  const padding = { top: 2, right: 2, bottom: 2, left: 2 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Convert data point to SVG coordinates
  const toX = (time: number) =>
    padding.left + ((time - timeStart) / timeRange) * chartWidth
  const toY = (value: number) =>
    padding.top + (1 - (value - yMinVal) / yRange) * chartHeight

  // Build path for the line
  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(p.time)} ${toY(p.value)}`)
    .join(' ')

  // Build path for the filled area
  const areaPath =
    linePath +
    ` L ${toX(points[points.length - 1].time)} ${padding.top + chartHeight}` +
    ` L ${toX(points[0].time)} ${padding.top + chartHeight} Z`

  return (
    <div className="relative h-full w-full min-h-[60px] flex">
      {/* Y-axis labels */}
      <div className="flex flex-col justify-between text-right pr-1 py-0.5">
        <span className="text-[10px] text-white/50 font-medium">
          {Math.round(yMaxVal)}
        </span>
        <span className="text-[10px] text-white/50 font-medium">
          {Math.round(yMinVal)}
        </span>
      </div>

      {/* Chart */}
      <div className="flex-1 h-full">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="h-full w-full"
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

          {/* Reference lines */}
          {referenceLines.map((line, i) => {
            const y = toY(line.value)
            if (y < padding.top || y > padding.top + chartHeight) return null
            return (
              <line
                key={i}
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke={line.color}
                strokeWidth={0.5}
                strokeDasharray="2 2"
                strokeOpacity={0.5}
              />
            )
          })}

          {/* Filled area */}
          <path d={areaPath} fill={`url(#${gradientId})`} />

          {/* Line stroke */}
          <path
            d={linePath}
            fill="none"
            stroke={strokeColor}
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    </div>
  )
}
