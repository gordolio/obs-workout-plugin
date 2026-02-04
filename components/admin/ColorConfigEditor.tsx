'use client'

import { Loader2, Plus, Trash2, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ColorConfig, ColorStop } from '@/lib/color-config'

export function ColorConfigEditor({
  title,
  icon,
  config,
  defaultConfig,
  accentColor,
  onChange,
  onSave,
  isSaving,
}: {
  title: string
  icon: React.ReactNode
  config: ColorConfig
  defaultConfig: ColorConfig
  accentColor: 'red' | 'blue'
  onChange: (config: ColorConfig) => void
  onSave: () => void
  isSaving: boolean
}) {
  const buttonStyles = {
    red: 'bg-red-500 hover:bg-red-600',
    blue: 'bg-blue-500 hover:bg-blue-600',
  }

  const updateIconGradient = (value: boolean) => {
    onChange({ ...config, icon: { ...config.icon, useGradient: value } })
  }

  const updateIconStaticColor = (color: string) => {
    onChange({ ...config, icon: { ...config.icon, staticColor: color } })
  }

  const updateTextGradient = (value: boolean) => {
    onChange({ ...config, text: { ...config.text, useGradient: value } })
  }

  const updateTextStaticColor = (color: string) => {
    onChange({ ...config, text: { ...config.text, staticColor: color } })
  }

  const updateGraphGradient = (value: boolean) => {
    onChange({ ...config, graph: { ...config.graph, useGradient: value } })
  }

  const updateGraphStaticColor = (color: string) => {
    onChange({ ...config, graph: { ...config.graph, staticColor: color } })
  }

  const updateInterpolate = (value: boolean) => {
    onChange({ ...config, interpolate: value })
  }

  const updateColorStop = (index: number, stop: ColorStop) => {
    const newStops = [...config.colorStops]
    newStops[index] = stop
    onChange({ ...config, colorStops: newStops })
  }

  const addColorStop = () => {
    if (config.colorStops.length >= 5) return
    const lastStop = config.colorStops[config.colorStops.length - 1]
    const newStop: ColorStop = {
      threshold: lastStop ? lastStop.threshold + 20 : 100,
      color: '#888888',
    }
    onChange({ ...config, colorStops: [...config.colorStops, newStop] })
  }

  const removeColorStop = (index: number) => {
    if (config.colorStops.length <= 1) return
    const newStops = config.colorStops.filter((_, i) => i !== index)
    onChange({ ...config, colorStops: newStops })
  }

  const resetToDefaults = () => {
    onChange(defaultConfig)
  }

  return (
    <div className="rounded-lg">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
          {icon}
          {title}
        </h3>
        <button
          onClick={resetToDefaults}
          className="flex items-center gap-1 text-xs text-zinc-400 transition-colors hover:text-white"
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </button>
      </div>

      <div className="space-y-4">
        {/* Icon Color Mode */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">Icon color mode</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateIconGradient(true)}
              className={cn(
                'rounded px-2 py-1 text-xs transition-colors',
                config.icon.useGradient
                  ? 'bg-zinc-600 text-white'
                  : 'bg-zinc-700/50 text-zinc-400 hover:text-white'
              )}
            >
              Gradient
            </button>
            <button
              onClick={() => updateIconGradient(false)}
              className={cn(
                'rounded px-2 py-1 text-xs transition-colors',
                !config.icon.useGradient
                  ? 'bg-zinc-600 text-white'
                  : 'bg-zinc-700/50 text-zinc-400 hover:text-white'
              )}
            >
              Static
            </button>
          </div>
        </div>

        {/* Icon Static Color (shown when static mode) */}
        {!config.icon.useGradient && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Icon color</span>
            <input
              type="color"
              value={config.icon.staticColor}
              onChange={(e) => updateIconStaticColor(e.target.value)}
              className="h-8 w-12 cursor-pointer rounded border border-zinc-600 bg-transparent"
            />
          </div>
        )}

        {/* Text/Number Color Mode */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">Number color mode</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateTextGradient(true)}
              className={cn(
                'rounded px-2 py-1 text-xs transition-colors',
                config.text.useGradient
                  ? 'bg-zinc-600 text-white'
                  : 'bg-zinc-700/50 text-zinc-400 hover:text-white'
              )}
            >
              Gradient
            </button>
            <button
              onClick={() => updateTextGradient(false)}
              className={cn(
                'rounded px-2 py-1 text-xs transition-colors',
                !config.text.useGradient
                  ? 'bg-zinc-600 text-white'
                  : 'bg-zinc-700/50 text-zinc-400 hover:text-white'
              )}
            >
              Static
            </button>
          </div>
        </div>

        {/* Text Static Color (shown when static mode) */}
        {!config.text.useGradient && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Number color</span>
            <input
              type="color"
              value={config.text.staticColor}
              onChange={(e) => updateTextStaticColor(e.target.value)}
              className="h-8 w-12 cursor-pointer rounded border border-zinc-600 bg-transparent"
            />
          </div>
        )}

        {/* Graph Color Mode */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">Graph color mode</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateGraphGradient(true)}
              className={cn(
                'rounded px-2 py-1 text-xs transition-colors',
                config.graph.useGradient
                  ? 'bg-zinc-600 text-white'
                  : 'bg-zinc-700/50 text-zinc-400 hover:text-white'
              )}
            >
              Gradient
            </button>
            <button
              onClick={() => updateGraphGradient(false)}
              className={cn(
                'rounded px-2 py-1 text-xs transition-colors',
                !config.graph.useGradient
                  ? 'bg-zinc-600 text-white'
                  : 'bg-zinc-700/50 text-zinc-400 hover:text-white'
              )}
            >
              Static
            </button>
          </div>
        </div>

        {/* Graph Static Color (shown when static mode) */}
        {!config.graph.useGradient && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Graph color</span>
            <input
              type="color"
              value={config.graph.staticColor}
              onChange={(e) => updateGraphStaticColor(e.target.value)}
              className="h-8 w-12 cursor-pointer rounded border border-zinc-600 bg-transparent"
            />
          </div>
        )}

        {/* Smooth blending toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">Smooth color blending</span>
          <button
            onClick={() => updateInterpolate(!config.interpolate)}
            className={cn(
              'relative h-6 w-11 rounded-full transition-colors',
              config.interpolate ? 'bg-green-500' : 'bg-zinc-600'
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                config.interpolate ? 'left-5' : 'left-0.5'
              )}
            />
          </button>
        </div>

        {/* Color Stops */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-zinc-400">Color stops</span>
            {config.colorStops.length < 5 && (
              <button
                onClick={addColorStop}
                className="flex items-center gap-1 text-xs text-zinc-400 transition-colors hover:text-white"
              >
                <Plus className="h-3 w-3" />
                Add
              </button>
            )}
          </div>
          <div className="space-y-2">
            {config.colorStops
              .sort((a, b) => a.threshold - b.threshold)
              .map((stop, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded bg-zinc-700/30 p-2"
                >
                  <input
                    type="number"
                    value={stop.threshold}
                    onChange={(e) =>
                      updateColorStop(index, {
                        ...stop,
                        threshold: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-20 rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-sm text-white"
                  />
                  <input
                    type="color"
                    value={stop.color}
                    onChange={(e) =>
                      updateColorStop(index, { ...stop, color: e.target.value })
                    }
                    className="h-8 w-12 cursor-pointer rounded border border-zinc-600 bg-transparent"
                  />
                  <button
                    onClick={() => removeColorStop(index)}
                    disabled={config.colorStops.length <= 1}
                    className={cn(
                      'p-1 transition-colors',
                      config.colorStops.length <= 1
                        ? 'cursor-not-allowed text-zinc-600'
                        : 'text-zinc-400 hover:text-red-400'
                    )}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={onSave}
          disabled={isSaving}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors',
            'disabled:cursor-not-allowed disabled:opacity-50',
            buttonStyles[accentColor]
          )}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </div>
  )
}
