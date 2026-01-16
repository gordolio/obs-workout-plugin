import { create } from 'zustand'

export interface HeartRateDataPoint {
  time: number
  value: number
}

interface HeartRateStore {
  currentBpm: number
  history: HeartRateDataPoint[]
  isConnected: boolean
  lastUpdated: number | null
  setCurrentBpm: (bpm: number) => void
  addDataPoint: (value: number) => void
  setConnected: (connected: boolean) => void
  clearHistory: () => void
}

const MAX_HISTORY_POINTS = 360 // 30 minutes at 5-second intervals

export const useHeartRateStore = create<HeartRateStore>((set) => ({
  currentBpm: 0,
  history: [],
  isConnected: false,
  lastUpdated: null,

  setCurrentBpm: (bpm: number) =>
    set({ currentBpm: bpm, lastUpdated: Date.now() }),

  addDataPoint: (value: number) =>
    set((state) => {
      const now = Date.now()
      const newHistory = [...state.history, { time: now, value }].slice(
        -MAX_HISTORY_POINTS
      )

      return {
        history: newHistory,
        currentBpm: value,
        lastUpdated: now,
      }
    }),

  setConnected: (connected: boolean) => set({ isConnected: connected }),

  clearHistory: () => set({ history: [], currentBpm: 0 }),
}))
