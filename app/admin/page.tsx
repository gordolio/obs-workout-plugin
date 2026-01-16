'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import {
  Heart,
  Droplet,
  Settings,
  Monitor,
  ArrowLeft,
  Wifi,
  WifiOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useHeartRateStore } from '@/stores/heartrate'
import { useGlucoseStore } from '@/stores/glucose'
import {
  useConnectStromno,
  useDisconnectStromno,
  parseWidgetUrl,
  subscribeToHeartRate,
} from '@/services/stromno'
import {
  useConnectDexcom,
  useDisconnectDexcom,
  subscribeToGlucose,
} from '@/services/dexcom'
import { useSettings } from '@/services/settings'

export default function AdminPanel() {
  const heartRateConnected = useHeartRateStore((s) => s.isConnected)
  const glucoseConnected = useGlucoseStore((s) => s.isConnected)

  const { data: settings } = useSettings()

  const [stromnoUrl, setStromnoUrl] = useState('')
  const [stromnoError, setStromnoError] = useState<string | null>(null)

  const [dexcomCredentials, setDexcomCredentials] = useState({
    username: '',
    password: '',
    region: 'us' as 'us' | 'ous',
  })
  const [dexcomError, setDexcomError] = useState<string | null>(null)

  // Sync state when settings load
  const [hasLoadedSettings, setHasLoadedSettings] = useState(false)
  if (settings && !hasLoadedSettings) {
    setHasLoadedSettings(true)
    if (settings.stromnoUrl) setStromnoUrl(settings.stromnoUrl)
    if (settings.dexcomUsername) {
      setDexcomCredentials({
        username: settings.dexcomUsername,
        password: settings.dexcomPassword ?? '',
        region: settings.dexcomRegion ?? 'us',
      })
    }
  }

  const connectStromnoMutation = useConnectStromno()
  const disconnectStromnoMutation = useDisconnectStromno()
  const connectDexcomMutation = useConnectDexcom()
  const disconnectDexcomMutation = useDisconnectDexcom()

  const stromnoLoading =
    connectStromnoMutation.isPending || disconnectStromnoMutation.isPending
  const dexcomLoading =
    connectDexcomMutation.isPending || disconnectDexcomMutation.isPending

  // Subscribe to SSE streams on mount
  useEffect(() => {
    const unsubscribeHeartRate = subscribeToHeartRate()
    const unsubscribeGlucose = subscribeToGlucose()
    return () => {
      unsubscribeHeartRate()
      unsubscribeGlucose()
    }
  }, [])

  // Validate widget URL as user types
  const isValidWidgetUrl = stromnoUrl
    ? parseWidgetUrl(stromnoUrl) !== null
    : false

  async function handleStromnoConnect() {
    if (!stromnoUrl) return

    setStromnoError(null)

    try {
      await connectStromnoMutation.mutateAsync(stromnoUrl)
    } catch (err) {
      setStromnoError(err instanceof Error ? err.message : 'Connection failed')
    }
  }

  async function handleStromnoDisconnect() {
    try {
      await disconnectStromnoMutation.mutateAsync()
      setStromnoError(null)
    } catch (err) {
      setStromnoError(err instanceof Error ? err.message : 'Disconnect failed')
    }
  }

  async function handleDexcomConnect() {
    if (!dexcomCredentials.username || !dexcomCredentials.password) return

    setDexcomError(null)

    try {
      await connectDexcomMutation.mutateAsync(dexcomCredentials)
    } catch (err) {
      setDexcomError(err instanceof Error ? err.message : 'Connection failed')
    }
  }

  async function handleDexcomDisconnect() {
    try {
      await disconnectDexcomMutation.mutateAsync()
      setDexcomError(null)
    } catch (err) {
      setDexcomError(err instanceof Error ? err.message : 'Disconnect failed')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 p-6">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-white">
            <Settings className="h-7 w-7" />
            Settings
          </h1>
        </header>

        {/* Stromno Section */}
        <section className="mb-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <Heart className="h-5 w-5 text-red-500" />
              Stromno (Heart Rate)
            </h2>
            <StatusBadge
              status={heartRateConnected ? 'connected' : 'disconnected'}
            />
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">
              Widget URL
            </label>
            <div className="relative">
              <input
                type="text"
                value={stromnoUrl}
                onChange={(e) => setStromnoUrl(e.target.value)}
                placeholder="https://app.stromno.com/widget/view/..."
                disabled={heartRateConnected || stromnoLoading}
                className={cn(
                  'w-full rounded-lg border bg-zinc-800/50 px-3 py-2 pr-10',
                  'text-sm text-white placeholder:text-zinc-500',
                  'focus:outline-none focus:ring-1',
                  heartRateConnected || stromnoLoading
                    ? 'border-zinc-700 opacity-60'
                    : stromnoUrl && !isValidWidgetUrl
                      ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/50'
                      : 'border-zinc-700 focus:border-red-500/50 focus:ring-red-500/50'
                )}
              />
              {stromnoUrl && !stromnoLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isValidWidgetUrl ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              )}
            </div>
            <p className="mt-1.5 text-xs text-zinc-500">
              Get your widget URL from{' '}
              <a
                href="https://app.stromno.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-400 hover:underline"
              >
                app.stromno.com
              </a>{' '}
              → Widgets → Copy Link
            </p>
          </div>

          {stromnoError && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {stromnoError}
            </div>
          )}

          <button
            onClick={
              heartRateConnected
                ? handleStromnoDisconnect
                : handleStromnoConnect
            }
            disabled={
              stromnoLoading || (!heartRateConnected && !isValidWidgetUrl)
            }
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              'disabled:cursor-not-allowed disabled:opacity-50',
              heartRateConnected
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'bg-red-500 text-white hover:bg-red-600'
            )}
          >
            {stromnoLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Connecting...
              </>
            ) : heartRateConnected ? (
              <>
                <WifiOff className="h-4 w-4" /> Disconnect
              </>
            ) : (
              <>
                <Wifi className="h-4 w-4" /> Connect
              </>
            )}
          </button>
        </section>

        {/* Dexcom Section */}
        <section className="mb-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <Droplet className="h-5 w-5 text-blue-500" />
              Dexcom (Blood Glucose)
            </h2>
            <StatusBadge
              status={glucoseConnected ? 'connected' : 'disconnected'}
            />
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-400">
                Username
              </label>
              <input
                type="text"
                value={dexcomCredentials.username}
                onChange={(e) =>
                  setDexcomCredentials((c) => ({
                    ...c,
                    username: e.target.value,
                  }))
                }
                placeholder="your@email.com"
                disabled={glucoseConnected || dexcomLoading}
                className={cn(
                  'w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2',
                  'text-sm text-white placeholder:text-zinc-500',
                  'focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50',
                  (glucoseConnected || dexcomLoading) && 'opacity-60'
                )}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-400">
                Password
              </label>
              <input
                type="password"
                value={dexcomCredentials.password}
                onChange={(e) =>
                  setDexcomCredentials((c) => ({
                    ...c,
                    password: e.target.value,
                  }))
                }
                placeholder="••••••••"
                disabled={glucoseConnected || dexcomLoading}
                className={cn(
                  'w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2',
                  'text-sm text-white placeholder:text-zinc-500',
                  'focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50',
                  (glucoseConnected || dexcomLoading) && 'opacity-60'
                )}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-400">
                Region
              </label>
              <select
                value={dexcomCredentials.region}
                onChange={(e) =>
                  setDexcomCredentials((c) => ({
                    ...c,
                    region: e.target.value as 'us' | 'ous',
                  }))
                }
                disabled={glucoseConnected || dexcomLoading}
                className={cn(
                  'w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2',
                  'text-sm text-white',
                  'focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50',
                  (glucoseConnected || dexcomLoading) && 'opacity-60'
                )}
              >
                <option value="us">United States</option>
                <option value="ous">Outside US</option>
              </select>
            </div>
          </div>

          {dexcomError && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {dexcomError}
            </div>
          )}

          <button
            onClick={
              glucoseConnected ? handleDexcomDisconnect : handleDexcomConnect
            }
            disabled={
              dexcomLoading ||
              (!glucoseConnected &&
                (!dexcomCredentials.username || !dexcomCredentials.password))
            }
            className={cn(
              'mt-4 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              'disabled:cursor-not-allowed disabled:opacity-50',
              glucoseConnected
                ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            )}
          >
            {dexcomLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Connecting...
              </>
            ) : glucoseConnected ? (
              <>
                <WifiOff className="h-4 w-4" /> Disconnect
              </>
            ) : (
              <>
                <Wifi className="h-4 w-4" /> Connect
              </>
            )}
          </button>
        </section>

        {/* OBS Browser Sources */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <Monitor className="h-5 w-5" />
            OBS Browser Sources
          </h2>
          <p className="mb-4 text-sm text-zinc-400">
            Add these URLs as Browser Sources in OBS:
          </p>

          <div className="space-y-3">
            <UrlCard
              url="http://localhost:3000/heartrate"
              label="Heart Rate Overlay"
              color="red"
            />
            <UrlCard
              url="http://localhost:3000/glucose"
              label="Blood Glucose Overlay"
              color="blue"
            />
          </div>

          <p className="mt-4 text-xs text-zinc-500">
            Recommended size: <strong>320x100</strong> pixels. Enable
            &quot;Shutdown source when not visible&quot; for better performance.
          </p>
        </section>
      </div>
    </div>
  )
}

function StatusBadge({
  status,
}: {
  status: 'connected' | 'disconnected' | 'error'
}) {
  const styles = {
    connected: 'bg-green-500/20 text-green-400',
    disconnected: 'bg-zinc-700/50 text-zinc-400',
    error: 'bg-red-500/20 text-red-400',
  }

  return (
    <span
      className={cn(
        'rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide',
        styles[status]
      )}
    >
      {status}
    </span>
  )
}

function UrlCard({
  url,
  label,
  color,
}: {
  url: string
  label: string
  color: 'red' | 'blue'
}) {
  const colorStyles = {
    red: 'border-red-500/20 hover:border-red-500/40',
    blue: 'border-blue-500/20 hover:border-blue-500/40',
  }

  return (
    <div
      className={cn(
        'rounded-lg border bg-zinc-800/30 p-3 transition-colors',
        colorStyles[color]
      )}
    >
      <code className="block font-mono text-sm text-cyan-400">{url}</code>
      <span className="text-xs text-zinc-500">{label}</span>
    </div>
  )
}
