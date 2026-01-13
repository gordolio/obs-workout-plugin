import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

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
  showGrid?: boolean
}

export function MiniChart({
  data,
  color,
  gradientId,
  minY,
  maxY,
  referenceLines = [],
  showGrid = false,
}: MiniChartProps) {
  // Filter to last 30 minutes
  const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000
  const filteredData = data.filter((d) => d.time >= thirtyMinutesAgo)

  // Calculate domain
  const values = filteredData.map((d) => d.value)
  const dataMin = Math.min(...values)
  const dataMax = Math.max(...values)
  const padding = (dataMax - dataMin) * 0.1 || 10

  const yMin = minY !== undefined ? minY : Math.floor(dataMin - padding)
  const yMax = maxY !== undefined ? maxY : Math.ceil(dataMax + padding)

  if (filteredData.length === 0) {
    return (
      <div style={styles.empty}>
        <span style={styles.emptyText}>Waiting for data...</span>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={filteredData}
          margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0.05} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="time"
            type="number"
            domain={[thirtyMinutesAgo, Date.now()]}
            tick={false}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            domain={[yMin, yMax]}
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={30}
            tickCount={4}
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
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    minHeight: '60px',
  },
  empty: {
    width: '100%',
    height: '100%',
    minHeight: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '8px',
  },
  emptyText: {
    fontSize: '0.75rem',
    color: 'rgba(255,255,255,0.3)',
    fontStyle: 'italic',
  },
}
