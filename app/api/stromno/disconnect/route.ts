import { NextResponse } from 'next/server'
import { stromnoManager } from '@/lib/stromno-manager'

export async function POST() {
  try {
    stromnoManager.disconnect()
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
