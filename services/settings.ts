import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'

export const SettingsSchema = z.object({
  stromnoUrl: z.string().url().nullable(),
  dexcomUsername: z.string().nullable(),
  dexcomPassword: z.string().nullable(),
  dexcomRegion: z.enum(['us', 'ous']).nullable(),
})

export type Settings = z.infer<typeof SettingsSchema>

async function fetchSettings(): Promise<Settings> {
  const response = await fetch('/api/settings')

  if (!response.ok) {
    throw new Error('Failed to fetch settings')
  }

  const data = await response.json()
  return SettingsSchema.parse(data)
}

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
    staleTime: 0,
    refetchOnMount: true,
  })
}
