import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { stromnoManager } from '@/lib/stromno-manager'

const ConnectRequestSchema = z.object({
  widgetUrl: z.string().url(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = ConnectRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    await stromnoManager.connect(parsed.data.widgetUrl)

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
