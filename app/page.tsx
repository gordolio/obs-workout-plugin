import Link from 'next/link'
import { Heart, Droplet, Settings, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <header className="mb-16 text-center">
          <div className="mb-6 flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <Heart className="h-10 w-10 text-red-500" fill="#ef4444" />
              <Droplet className="h-10 w-10 text-blue-500" fill="#3b82f6" />
            </div>
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-white md:text-5xl">
            OBS Workout Overlay
          </h1>
          <p className="mx-auto max-w-xl text-lg text-zinc-400">
            Real-time health metrics for your stream. Display heart rate from
            Stromno and blood glucose from Dexcom.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <OverlayCard
            href="/heartrate"
            icon={<Heart className="h-8 w-8" fill="#ef4444" />}
            title="Heart Rate"
            description="Live BPM with pulsing animation and 30-minute graph"
            color="red"
            path="/heartrate"
          />

          <OverlayCard
            href="/glucose"
            icon={<Droplet className="h-8 w-8" fill="#3b82f6" />}
            title="Blood Glucose"
            description="Real-time glucose with trend arrows and range indicators"
            color="blue"
            path="/glucose"
          />

          <OverlayCard
            href="/admin"
            icon={<Settings className="h-8 w-8" />}
            title="Settings"
            description="Configure Stromno and Dexcom connections"
            color="zinc"
            path="/admin"
          />
        </div>

        <section className="mt-16 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8">
          <h2 className="mb-6 flex items-center gap-3 text-xl font-semibold text-white">
            <Monitor className="h-6 w-6" />
            Quick Setup for OBS
          </h2>

          <ol className="space-y-4 text-zinc-300">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-medium text-zinc-400">
                1
              </span>
              <div>
                <strong className="text-white">Add Browser Source</strong>
                <p className="text-sm text-zinc-400">
                  In OBS, add a new Browser Source to your scene
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-medium text-zinc-400">
                2
              </span>
              <div>
                <strong className="text-white">Enter Overlay URL</strong>
                <p className="text-sm text-zinc-400">
                  Use{' '}
                  <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-cyan-400">
                    http://localhost:3000/heartrate
                  </code>{' '}
                  or{' '}
                  <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-cyan-400">
                    /glucose
                  </code>
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-medium text-zinc-400">
                3
              </span>
              <div>
                <strong className="text-white">Set Size</strong>
                <p className="text-sm text-zinc-400">
                  Recommended: <strong>320x100</strong> pixels
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-medium text-zinc-400">
                4
              </span>
              <div>
                <strong className="text-white">Position</strong>
                <p className="text-sm text-zinc-400">
                  Drag to your preferred corner of the stream
                </p>
              </div>
            </li>
          </ol>
        </section>
      </div>
    </div>
  )
}

function OverlayCard({
  href,
  icon,
  title,
  description,
  color,
  path,
}: {
  href: string
  icon: React.ReactNode
  title: string
  description: string
  color: 'red' | 'blue' | 'zinc'
  path: string
}) {
  const colorStyles = {
    red: {
      border: 'border-red-500/20 hover:border-red-500/50',
      iconColor: 'text-red-500',
      glow: 'group-hover:shadow-red-500/10',
    },
    blue: {
      border: 'border-blue-500/20 hover:border-blue-500/50',
      iconColor: 'text-blue-500',
      glow: 'group-hover:shadow-blue-500/10',
    },
    zinc: {
      border: 'border-zinc-700 hover:border-zinc-600',
      iconColor: 'text-zinc-400',
      glow: '',
    },
  }

  const styles = colorStyles[color]

  return (
    <Link
      href={href}
      className={cn(
        'group block rounded-xl border bg-zinc-900/50 p-6 transition-all',
        'hover:bg-zinc-800/50 hover:shadow-xl',
        styles.border,
        styles.glow
      )}
    >
      <div className={cn('mb-4', styles.iconColor)}>{icon}</div>
      <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
      <p className="mb-4 text-sm text-zinc-400">{description}</p>
      <code className="inline-block rounded bg-zinc-800/80 px-2 py-1 font-mono text-xs text-zinc-500">
        {path}
      </code>
    </Link>
  )
}
