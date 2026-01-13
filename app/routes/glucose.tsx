import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useGlucoseStore, getTrendArrow } from '../stores/glucose'
import { MiniChart } from '../components/MiniChart'

export const Route = createFileRoute('/glucose')({
  component: GlucoseOverlay,
})

function GlucoseOverlay() {
  const { currentMgDl, trend, history, isConnected } = useGlucoseStore()

  // Demo data simulation (remove in production with real Dexcom)
  useEffect(() => {
    const store = useGlucoseStore.getState()
    store.setConnected(true)

    // Simulate glucose data for demo
    const baseGlucose = 110
    let lastValue = baseGlucose

    const addPoint = () => {
      const drift = (Math.random() - 0.5) * 10
      const trend = Math.sin(Date.now() / 60000) * 20
      lastValue = lastValue + drift * 0.3 + trend * 0.1
      lastValue = Math.max(70, Math.min(200, lastValue))
      store.addDataPoint(Math.round(lastValue))
    }

    // Add initial historical data
    for (let i = 30; i >= 0; i--) {
      const historicalTime = Date.now() - i * 5 * 60 * 1000
      const variance = Math.sin(historicalTime / 60000) * 20
      const noise = (Math.random() - 0.5) * 15
      const value = Math.round(baseGlucose + variance + noise)
      store.addDataPoint(Math.max(70, Math.min(200, value)))
    }

    // Continue with real-time updates
    const interval = setInterval(addPoint, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [])

  const glucoseColor = getGlucoseColor(currentMgDl)
  const trendArrow = getTrendArrow(trend)

  return (
    <div style={styles.container}>
      <div style={styles.overlay}>
        <div style={styles.valueSection}>
          <div style={styles.dropIcon}>🩸</div>
          <div style={styles.valueWrapper}>
            <div style={styles.valueRow}>
              <span
                style={{
                  ...styles.value,
                  color: glucoseColor,
                  textShadow: `0 0 20px ${glucoseColor}40`,
                }}
              >
                {currentMgDl || '--'}
              </span>
              {trendArrow && <span style={styles.trend}>{trendArrow}</span>}
            </div>
            <span style={styles.unit}>mg/dL</span>
          </div>
        </div>

        <div style={styles.chartSection}>
          <MiniChart
            data={history}
            color="#3b82f6"
            gradientId="glucoseGradient"
            minY={40}
            maxY={250}
            referenceLines={[
              { value: 70, color: '#f59e0b' },
              { value: 180, color: '#f59e0b' },
            ]}
          />
        </div>

        {!isConnected && (
          <div style={styles.disconnected}>
            <span style={styles.disconnectedDot} />
            Disconnected
          </div>
        )}
      </div>
    </div>
  )
}

function getGlucoseColor(mgDl: number): string {
  if (mgDl === 0) return '#888'
  if (mgDl < 70) return '#ff4757' // Red - low (hypoglycemia)
  if (mgDl < 80) return '#f59e0b' // Orange - borderline low
  if (mgDl <= 140) return '#22c55e' // Green - normal
  if (mgDl <= 180) return '#f59e0b' // Orange - elevated
  return '#ff4757' // Red - high (hyperglycemia)
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    padding: '1rem',
  },
  overlay: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.75rem 1rem',
    background: 'var(--bg-card)',
    borderRadius: '16px',
    border: '1px solid rgba(59, 130, 246, 0.2)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    minWidth: '280px',
  },
  valueSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexShrink: 0,
  },
  dropIcon: {
    fontSize: '1.5rem',
  },
  valueWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  valueRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  value: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '2rem',
    fontWeight: 700,
    lineHeight: 1,
  },
  trend: {
    fontSize: '1.25rem',
    marginLeft: '2px',
  },
  unit: {
    fontSize: '0.65rem',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  chartSection: {
    flex: 1,
    height: '60px',
    minWidth: '120px',
  },
  disconnected: {
    position: 'absolute',
    top: '4px',
    right: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.6rem',
    color: 'rgba(255,255,255,0.4)',
  },
  disconnectedDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#ff4757',
  },
}
