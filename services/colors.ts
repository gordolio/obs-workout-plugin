import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ColorConfig, ColorConfigSchema } from '@/lib/color-config'

type MetricType = 'heartrate' | 'glucose'

async function fetchColorConfig(metric: MetricType): Promise<ColorConfig> {
  const response = await fetch(`/api/colors?metric=${metric}`)

  if (!response.ok) {
    throw new Error('Failed to fetch color config')
  }

  const data = await response.json()
  return ColorConfigSchema.parse(data)
}

async function updateColorConfigApi(
  metric: MetricType,
  config: ColorConfig
): Promise<ColorConfig> {
  const response = await fetch('/api/colors', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ metric, config }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || 'Failed to update color config')
  }

  const data = await response.json()
  return ColorConfigSchema.parse(data)
}

export function useColorConfig(metric: MetricType) {
  return useQuery({
    queryKey: ['colorConfig', metric],
    queryFn: () => fetchColorConfig(metric),
    staleTime: Infinity, // Color config rarely changes
  })
}

export function useUpdateColorConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      metric,
      config,
    }: {
      metric: MetricType
      config: ColorConfig
    }) => updateColorConfigApi(metric, config),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['colorConfig', variables.metric], data)
    },
  })
}
