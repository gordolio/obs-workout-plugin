import { NextRequest, NextResponse } from 'next/server'
import { dexcomManager, DexcomCredentialsSchema } from '@/lib/dexcom-manager'
import { updateSettings } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = DexcomCredentialsSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid credentials', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    await dexcomManager.connect(parsed.data)

    // Save credentials to database on successful connection
    updateSettings({
      dexcomUsername: parsed.data.username,
      dexcomPassword: parsed.data.password,
      dexcomRegion: parsed.data.region,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
