import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useHeartRateStore } from '../stores/heartrate'
import { MiniChart } from '../components/MiniChart'

export const Route = createFileRoute('/heartrate')({
  component: HeartRateOverlay,
})

function HeartRateOverlay() {
  const { currentBpm, history, isConnected } = useHeartRateStore()
  const [pulse, setPulse] = useState(false)

  // Pulse animation tied to heart rate
  useEffect(() => {
    if (currentBpm <= 0) return

    const interval = 60000 / currentBpm // ms per beat
    const timer = setInterval(() => {
      setPulse(true)
      setTimeout(() => setPulse(false), 150)
    }, interval)

    return () => clearInterval(timer)
  }, [currentBpm])

  // Demo data simulation (remove in production with real Stromno)
  useEffect(() => {
    const store = useHeartRateStore.getState()
    store.setConnected(true)

    // Simulate heart rate data for demo
    const interval = setInterval(() => {
      const baseHr = 85
      const variance = Math.sin(Date.now() / 10000) * 15
      const noise = (Math.random() - 0.5) * 8
      const hr = Math.round(baseHr + variance + noise)
      store.addDataPoint(Math.max(60, Math.min(180, hr)))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const bpmColor = getBpmColor(currentBpm)

  return (
    <div style={styles.container}>
      <div style={styles.overlay}>
        <div style={styles.valueSection}>
          <div
            style={{
              ...styles.heartIcon,
              transform: pulse ? 'scale(1.2)' : 'scale(1)',
              filter: pulse
                ? `drop-shadow(0 0 12px ${bpmColor})`
                : `drop-shadow(0 0 6px ${bpmColor})`,
            }}
          >
            ❤️
          </div>
          <div style={styles.valueWrapper}>
            <span
              style={{
                ...styles.value,
                color: bpmColor,
                textShadow: `0 0 20px ${bpmColor}40`,
              }}
            >
              {currentBpm || '--'}
            </span>
            <span style={styles.unit}>BPM</span>
          </div>
        </div>

        <div style={styles.chartSection}>
          <MiniChart
            data={history}
            color="#ff4757"
            gradientId="heartGradient"
            minY={50}
            maxY={200}
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

function getBpmColor(bpm: number): string {
  if (bpm === 0) return '#888'
  if (bpm < 60) return '#3b82f6' // Blue - low
  if (bpm < 100) return '#22c55e' // Green - normal
  if (bpm < 140) return '#f59e0b' // Orange - elevated
  return '#ff4757' // Red - high
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
    border: '1px solid rgba(255, 71, 87, 0.2)',
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
  heartIcon: {
    fontSize: '1.5rem',
    transition: 'transform 0.15s ease, filter 0.15s ease',
  },
  valueWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  value: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '2rem',
    fontWeight: 700,
    lineHeight: 1,
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
