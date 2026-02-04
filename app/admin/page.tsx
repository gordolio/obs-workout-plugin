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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusBadge, UrlCard, ColorConfigEditor } from '@/components/admin'
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
import { useColorConfig, useUpdateColorConfig } from '@/services/colors'
import {
  ColorConfig,
  DEFAULT_HEARTRATE_CONFIG,
  DEFAULT_GLUCOSE_CONFIG,
} from '@/lib/color-config'

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

  // Color config
  const { data: heartrateColorConfig } = useColorConfig('heartrate')
  const { data: glucoseColorConfig } = useColorConfig('glucose')
  const updateColorConfigMutation = useUpdateColorConfig()

  const [localHeartrateConfig, setLocalHeartrateConfig] =
    useState<ColorConfig | null>(null)
  const [localGlucoseConfig, setLocalGlucoseConfig] =
    useState<ColorConfig | null>(null)
  const [hasLoadedColorConfigs, setHasLoadedColorConfigs] = useState(false)

  // Sync color configs when loaded (same pattern as settings sync)
  if (heartrateColorConfig && glucoseColorConfig && !hasLoadedColorConfigs) {
    setHasLoadedColorConfigs(true)
    setLocalHeartrateConfig(heartrateColorConfig)
    setLocalGlucoseConfig(glucoseColorConfig)
  }

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

        <Tabs defaultValue="heartrate" className="w-full">
          <TabsList className="mb-6 w-full bg-zinc-800/50 p-1">
            <TabsTrigger
              value="heartrate"
              className="flex-1 data-[state=active]:bg-zinc-700 data-[state=active]:text-white"
            >
              <Heart className="mr-2 h-4 w-4 text-red-500" />
              Heart Rate
            </TabsTrigger>
            <TabsTrigger
              value="glucose"
              className="flex-1 data-[state=active]:bg-zinc-700 data-[state=active]:text-white"
            >
              <Droplet className="mr-2 h-4 w-4 text-blue-500" />
              Glucose
            </TabsTrigger>
            <TabsTrigger
              value="obs"
              className="flex-1 data-[state=active]:bg-zinc-700 data-[state=active]:text-white"
            >
              <Monitor className="mr-2 h-4 w-4" />
              OBS Sources
            </TabsTrigger>
          </TabsList>

          {/* Heart Rate Tab */}
          <TabsContent value="heartrate" className="space-y-4">
            {/* Connection Settings */}
            <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                  <Wifi className="h-5 w-5" />
                  Connection
                </h2>
                <StatusBadge
                  status={heartRateConnected ? 'connected' : 'disconnected'}
                />
              </div>

              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-medium text-zinc-400">
                  Stromno Widget URL
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

            {/* Color Configuration */}
            {localHeartrateConfig && (
              <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                <ColorConfigEditor
                  title="Appearance"
                  icon={<Heart className="h-5 w-5 text-red-500" />}
                  config={localHeartrateConfig}
                  defaultConfig={DEFAULT_HEARTRATE_CONFIG}
                  accentColor="red"
                  onChange={(config) => setLocalHeartrateConfig(config)}
                  onSave={() => {
                    if (localHeartrateConfig) {
                      updateColorConfigMutation.mutate({
                        metric: 'heartrate',
                        config: localHeartrateConfig,
                      })
                    }
                  }}
                  isSaving={updateColorConfigMutation.isPending}
                />
              </section>
            )}
          </TabsContent>

          {/* Glucose Tab */}
          <TabsContent value="glucose" className="space-y-4">
            {/* Connection Settings */}
            <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                  <Wifi className="h-5 w-5" />
                  Connection
                </h2>
                <StatusBadge
                  status={glucoseConnected ? 'connected' : 'disconnected'}
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-400">
                    Dexcom Username
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
                  glucoseConnected
                    ? handleDexcomDisconnect
                    : handleDexcomConnect
                }
                disabled={
                  dexcomLoading ||
                  (!glucoseConnected &&
                    (!dexcomCredentials.username ||
                      !dexcomCredentials.password))
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

            {/* Color Configuration */}
            {localGlucoseConfig && (
              <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                <ColorConfigEditor
                  title="Appearance"
                  icon={<Droplet className="h-5 w-5 text-blue-500" />}
                  config={localGlucoseConfig}
                  defaultConfig={DEFAULT_GLUCOSE_CONFIG}
                  accentColor="blue"
                  onChange={(config) => setLocalGlucoseConfig(config)}
                  onSave={() => {
                    if (localGlucoseConfig) {
                      updateColorConfigMutation.mutate({
                        metric: 'glucose',
                        config: localGlucoseConfig,
                      })
                    }
                  }}
                  isSaving={updateColorConfigMutation.isPending}
                />
              </section>
            )}
          </TabsContent>

          {/* OBS Browser Sources Tab */}
          <TabsContent value="obs">
            <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <Monitor className="h-5 w-5" />
                Browser Sources
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
                &quot;Shutdown source when not visible&quot; for better
                performance.
              </p>
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
