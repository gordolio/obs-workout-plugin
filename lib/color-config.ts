import { z } from 'zod'

// Schema definitions
export const ColorStopSchema = z.object({
  threshold: z.number(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
})

export const ColorConfigSchema = z.object({
  icon: z.object({
    useGradient: z.boolean(),
    staticColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  }),
  text: z.object({
    useGradient: z.boolean(),
    staticColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  }),
  graph: z.object({
    useGradient: z.boolean(),
    staticColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  }),
  colorStops: z.array(ColorStopSchema).min(1).max(5),
  interpolate: z.boolean(),
  waitingColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
})

export type ColorStop = z.infer<typeof ColorStopSchema>
export type ColorConfig = z.infer<typeof ColorConfigSchema>

// Default configurations
export const DEFAULT_HEARTRATE_CONFIG: ColorConfig = {
  icon: {
    useGradient: true,
    staticColor: '#ef4444',
  },
  text: {
    useGradient: true,
    staticColor: '#ef4444',
  },
  graph: {
    useGradient: false,
    staticColor: '#ef4444',
  },
  colorStops: [
    { threshold: 60, color: '#3b82f6' }, // Blue - low
    { threshold: 100, color: '#22c55e' }, // Green - normal
    { threshold: 140, color: '#f59e0b' }, // Orange - elevated
    { threshold: 200, color: '#ef4444' }, // Red - high
  ],
  interpolate: false,
  waitingColor: '#888888',
}

export const DEFAULT_GLUCOSE_CONFIG: ColorConfig = {
  icon: {
    useGradient: true,
    staticColor: '#3b82f6',
  },
  text: {
    useGradient: true,
    staticColor: '#3b82f6',
  },
  graph: {
    useGradient: false,
    staticColor: '#3b82f6',
  },
  colorStops: [
    { threshold: 70, color: '#ef4444' }, // Red - hypoglycemia
    { threshold: 80, color: '#f59e0b' }, // Orange - borderline low
    { threshold: 140, color: '#22c55e' }, // Green - normal
    { threshold: 180, color: '#f59e0b' }, // Orange - elevated
    { threshold: 250, color: '#ef4444' }, // Red - hyperglycemia
  ],
  interpolate: false,
  waitingColor: '#888888',
}

// Parse hex color to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/.exec(hex)
  if (!result) {
    return { r: 136, g: 136, b: 136 } // fallback gray
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  }
}

// Convert RGB to hex
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) =>
    Math.round(Math.max(0, Math.min(255, n)))
      .toString(16)
      .padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

// Interpolate between two colors
export function interpolateColor(
  color1: string,
  color2: string,
  t: number
): string {
  const c1 = hexToRgb(color1)
  const c2 = hexToRgb(color2)
  return rgbToHex(
    c1.r + (c2.r - c1.r) * t,
    c1.g + (c2.g - c1.g) * t,
    c1.b + (c2.b - c1.b) * t
  )
}

// Get color for a given value based on config
export function getColorForValue(value: number, config: ColorConfig): string {
  if (value === 0) {
    return config.waitingColor
  }

  const stops = [...config.colorStops].sort((a, b) => a.threshold - b.threshold)

  // Below first threshold
  if (value < stops[0].threshold) {
    return stops[0].color
  }

  // Above last threshold
  if (value >= stops[stops.length - 1].threshold) {
    return stops[stops.length - 1].color
  }

  // Find the two stops we're between
  for (let i = 0; i < stops.length - 1; i++) {
    const lower = stops[i]
    const upper = stops[i + 1]

    if (value >= lower.threshold && value < upper.threshold) {
      if (config.interpolate) {
        // Smooth interpolation
        const t =
          (value - lower.threshold) / (upper.threshold - lower.threshold)
        return interpolateColor(lower.color, upper.color, t)
      } else {
        // Discrete bands - return lower color
        return lower.color
      }
    }
  }

  // Fallback
  return config.waitingColor
}

// Convert color stops to SVG gradient stops (for graphs)
// Maps value thresholds to Y-axis positions (0-100%)
export function colorStopsToGradient(
  stops: ColorStop[],
  minY: number,
  maxY: number
): { offset: string; color: string }[] {
  const sortedStops = [...stops].sort((a, b) => b.threshold - a.threshold) // Sort descending for top-to-bottom

  return sortedStops.map((stop) => {
    // Map threshold to percentage (inverted because SVG gradients go top to bottom)
    const percent = ((maxY - stop.threshold) / (maxY - minY)) * 100
    const clampedPercent = Math.max(0, Math.min(100, percent))
    return {
      offset: `${clampedPercent}%`,
      color: stop.color,
    }
  })
}
