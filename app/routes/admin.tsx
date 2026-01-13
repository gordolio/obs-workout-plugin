import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/admin')({
  component: AdminPanel,
})

interface ServiceConfig {
  enabled: boolean
  status: 'connected' | 'disconnected' | 'error'
}

function AdminPanel() {
  const [stromno, setStromno] = useState<ServiceConfig>({
    enabled: false,
    status: 'disconnected',
  })

  const [dexcom, setDexcom] = useState<ServiceConfig>({
    enabled: false,
    status: 'disconnected',
  })

  const [dexcomCredentials, setDexcomCredentials] = useState({
    username: '',
    password: '',
    region: 'us' as 'us' | 'ous',
  })

  const [stromnoPort, setStromnoPort] = useState('8080')

  return (
    <div style={styles.container}>
      <div style={styles.panel}>
        <header style={styles.header}>
          <Link to="/" style={styles.backLink}>
            ← Back
          </Link>
          <h1 style={styles.title}>Settings</h1>
        </header>

        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              <span style={styles.icon}>❤️</span>
              Stromno (Heart Rate)
            </h2>
            <StatusBadge status={stromno.status} />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>WebSocket Port</label>
            <input
              type="text"
              value={stromnoPort}
              onChange={(e) => setStromnoPort(e.target.value)}
              placeholder="8080"
              style={styles.input}
            />
            <p style={styles.hint}>
              Default Stromno WebSocket server port
            </p>
          </div>

          <div style={styles.actions}>
            <button
              style={{
                ...styles.button,
                ...(stromno.enabled ? styles.buttonDanger : styles.buttonPrimary),
              }}
              onClick={() =>
                setStromno((s) => ({
                  ...s,
                  enabled: !s.enabled,
                  status: s.enabled ? 'disconnected' : 'connected',
                }))
              }
            >
              {stromno.enabled ? 'Disconnect' : 'Connect'}
            </button>
          </div>
        </section>

        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              <span style={styles.icon}>🩸</span>
              Dexcom (Blood Glucose)
            </h2>
            <StatusBadge status={dexcom.status} />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              value={dexcomCredentials.username}
              onChange={(e) =>
                setDexcomCredentials((c) => ({ ...c, username: e.target.value }))
              }
              placeholder="your@email.com"
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={dexcomCredentials.password}
              onChange={(e) =>
                setDexcomCredentials((c) => ({ ...c, password: e.target.value }))
              }
              placeholder="••••••••"
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Region</label>
            <select
              value={dexcomCredentials.region}
              onChange={(e) =>
                setDexcomCredentials((c) => ({
                  ...c,
                  region: e.target.value as 'us' | 'ous',
                }))
              }
              style={styles.select}
            >
              <option value="us">United States</option>
              <option value="ous">Outside US</option>
            </select>
          </div>

          <div style={styles.actions}>
            <button
              style={{
                ...styles.button,
                ...(dexcom.enabled ? styles.buttonDanger : styles.buttonPrimary),
              }}
              onClick={() =>
                setDexcom((s) => ({
                  ...s,
                  enabled: !s.enabled,
                  status: s.enabled ? 'disconnected' : 'connected',
                }))
              }
            >
              {dexcom.enabled ? 'Disconnect' : 'Connect'}
            </button>
          </div>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <span style={styles.icon}>📺</span>
            OBS Browser Sources
          </h2>
          <p style={styles.hint}>Add these URLs as Browser Sources in OBS:</p>

          <div style={styles.urlCard}>
            <code style={styles.urlCode}>http://localhost:3000/heartrate</code>
            <span style={styles.urlLabel}>Heart Rate Overlay</span>
          </div>

          <div style={styles.urlCard}>
            <code style={styles.urlCode}>http://localhost:3000/glucose</code>
            <span style={styles.urlLabel}>Blood Glucose Overlay</span>
          </div>

          <p style={styles.hint}>
            Recommended size: 320x100 pixels. Enable "Shutdown source when not visible" for performance.
          </p>
        </section>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: 'connected' | 'disconnected' | 'error' }) {
  const statusStyles: Record<string, React.CSSProperties> = {
    connected: { background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' },
    disconnected: { background: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255,255,255,0.5)' },
    error: { background: 'rgba(255, 71, 87, 0.2)', color: '#ff4757' },
  }

  return (
    <span style={{ ...styles.badge, ...statusStyles[status] }}>
      {status}
    </span>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0f14 0%, #1a1a24 100%)',
    padding: '2rem',
  },
  panel: {
    maxWidth: '600px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '2rem',
  },
  backLink: {
    color: 'rgba(255,255,255,0.5)',
    textDecoration: 'none',
    fontSize: '0.875rem',
    display: 'inline-block',
    marginBottom: '0.5rem',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 700,
  },
  section: {
    background: 'var(--bg-card)',
    borderRadius: '12px',
    border: '1px solid var(--border-subtle)',
    padding: '1.5rem',
    marginBottom: '1rem',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1rem',
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  icon: {
    fontSize: '1.25rem',
  },
  badge: {
    fontSize: '0.7rem',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: 500,
  },
  field: {
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: 500,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: '0.375rem',
  },
  input: {
    width: '100%',
    padding: '0.625rem 0.75rem',
    fontSize: '0.875rem',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '6px',
    color: '#fff',
    outline: 'none',
  },
  select: {
    width: '100%',
    padding: '0.625rem 0.75rem',
    fontSize: '0.875rem',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '6px',
    color: '#fff',
    outline: 'none',
  },
  hint: {
    fontSize: '0.75rem',
    color: 'rgba(255,255,255,0.4)',
    marginTop: '0.375rem',
  },
  actions: {
    marginTop: '1rem',
  },
  button: {
    padding: '0.625rem 1.25rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  buttonPrimary: {
    background: '#3b82f6',
    color: '#fff',
  },
  buttonDanger: {
    background: 'rgba(255, 71, 87, 0.2)',
    color: '#ff4757',
    border: '1px solid rgba(255, 71, 87, 0.3)',
  },
  urlCard: {
    background: 'rgba(0,0,0,0.3)',
    borderRadius: '6px',
    padding: '0.75rem',
    marginBottom: '0.5rem',
  },
  urlCode: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '0.8rem',
    color: '#3b82f6',
    display: 'block',
    marginBottom: '0.25rem',
  },
  urlLabel: {
    fontSize: '0.7rem',
    color: 'rgba(255,255,255,0.4)',
  },
}
