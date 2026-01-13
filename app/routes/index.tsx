import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>OBS Workout Overlay</h1>
      <p style={styles.subtitle}>Real-time health metrics for your stream</p>

      <div style={styles.links}>
        <Link to="/heartrate" style={styles.link}>
          <div style={{ ...styles.card, ...styles.heartCard }}>
            <span style={styles.cardIcon}>❤️</span>
            <span style={styles.cardLabel}>Heart Rate Overlay</span>
            <code style={styles.cardPath}>/heartrate</code>
          </div>
        </Link>

        <Link to="/glucose" style={styles.link}>
          <div style={{ ...styles.card, ...styles.glucoseCard }}>
            <span style={styles.cardIcon}>🩸</span>
            <span style={styles.cardLabel}>Blood Glucose Overlay</span>
            <code style={styles.cardPath}>/glucose</code>
          </div>
        </Link>

        <Link to="/admin" style={styles.link}>
          <div style={{ ...styles.card, ...styles.adminCard }}>
            <span style={styles.cardIcon}>⚙️</span>
            <span style={styles.cardLabel}>Admin Panel</span>
            <code style={styles.cardPath}>/admin</code>
          </div>
        </Link>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0f14 0%, #1a1a24 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 700,
    marginBottom: '0.5rem',
    background: 'linear-gradient(135deg, #fff 0%, #a0a0a0 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: '1.1rem',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: '3rem',
  },
  links: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    width: '100%',
    maxWidth: '400px',
  },
  link: {
    textDecoration: 'none',
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1.25rem 1.5rem',
    borderRadius: '12px',
    border: '1px solid var(--border-subtle)',
    background: 'var(--bg-card)',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
  },
  heartCard: {
    borderColor: 'rgba(255, 71, 87, 0.3)',
  },
  glucoseCard: {
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  adminCard: {
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardIcon: {
    fontSize: '1.5rem',
  },
  cardLabel: {
    flex: 1,
    fontSize: '1rem',
    fontWeight: 500,
    color: '#fff',
  },
  cardPath: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '0.8rem',
    color: 'rgba(255,255,255,0.4)',
    background: 'rgba(0,0,0,0.3)',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
  },
}
