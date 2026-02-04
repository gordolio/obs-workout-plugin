import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getColorConfig, updateColorConfig, MetricType } from '@/lib/db'
import { ColorConfigSchema } from '@/lib/color-config'

const MetricSchema = z.enum(['heartrate', 'glucose'])

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const metricParam = searchParams.get('metric')

    const metricResult = MetricSchema.safeParse(metricParam)
    if (!metricResult.success) {
      return NextResponse.json(
        { error: 'Invalid metric. Must be "heartrate" or "glucose"' },
        { status: 400 }
      )
    }

    const config = await getColorConfig(metricResult.data)
    return NextResponse.json(config)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

const UpdateColorConfigSchema = z.object({
  metric: MetricSchema,
  config: ColorConfigSchema,
})

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = UpdateColorConfigSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const config = await updateColorConfig(
      parsed.data.metric as MetricType,
      parsed.data.config
    )
    return NextResponse.json(config)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
