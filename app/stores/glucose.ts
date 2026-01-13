import { create } from 'zustand'

export interface GlucoseDataPoint {
  time: number
  value: number
}

export type GlucoseTrend =
  | 'rising_fast'
  | 'rising'
  | 'stable'
  | 'falling'
  | 'falling_fast'
  | 'unknown'

interface GlucoseStore {
  currentMgDl: number
  trend: GlucoseTrend
  history: GlucoseDataPoint[]
  isConnected: boolean
  lastUpdated: number | null
  setCurrentGlucose: (mgDl: number, trend?: GlucoseTrend) => void
  addDataPoint: (value: number) => void
  setConnected: (connected: boolean) => void
  clearHistory: () => void
}

const MAX_HISTORY_POINTS = 72 // 6 hours at 5-minute intervals (more than we need for 30 min display)

export const useGlucoseStore = create<GlucoseStore>((set) => ({
  currentMgDl: 0,
  trend: 'unknown',
  history: [],
  isConnected: false,
  lastUpdated: null,

  setCurrentGlucose: (mgDl: number, trend: GlucoseTrend = 'unknown') =>
    set({ currentMgDl: mgDl, trend, lastUpdated: Date.now() }),

  addDataPoint: (value: number) =>
    set((state) => {
      const now = Date.now()
      const newHistory = [
        ...state.history,
        { time: now, value },
      ].slice(-MAX_HISTORY_POINTS)

      return {
        history: newHistory,
        currentMgDl: value,
        lastUpdated: now,
      }
    }),

  setConnected: (connected: boolean) => set({ isConnected: connected }),

  clearHistory: () => set({ history: [], currentMgDl: 0, trend: 'unknown' }),
}))

export function getTrendArrow(trend: GlucoseTrend): string {
  switch (trend) {
    case 'rising_fast':
      return '⬆️'
    case 'rising':
      return '↗️'
    case 'stable':
      return '→'
    case 'falling':
      return '↘️'
    case 'falling_fast':
      return '⬇️'
    default:
      return ''
  }
}
