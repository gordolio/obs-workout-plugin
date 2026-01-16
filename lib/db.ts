import Database from 'better-sqlite3'
import { z } from 'zod'
import path from 'path'
import { mkdir } from 'fs/promises'

// Database path - stored in project root for development
const DB_PATH = path.join(process.cwd(), 'data', 'settings.db')

// Zod schemas for validation
export const SettingsSchema = z.object({
  stromnoUrl: z.string().url().nullable(),
  dexcomUsername: z.string().nullable(),
  dexcomPassword: z.string().nullable(),
  dexcomRegion: z.enum(['us', 'ous']).nullable(),
})

export type Settings = z.infer<typeof SettingsSchema>

export const SettingsUpdateSchema = SettingsSchema.partial()
export type SettingsUpdate = z.infer<typeof SettingsUpdateSchema>

// Singleton database instance
let db: Database.Database | null = null
let dbInitPromise: Promise<Database.Database> | null = null

async function initDb(): Promise<Database.Database> {
  if (db) return db

  // Ensure data directory exists
  const dataDir = path.dirname(DB_PATH)
  await mkdir(dataDir, { recursive: true })

  db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')

  // Initialize schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `)

  return db
}

async function getDb(): Promise<Database.Database> {
  if (db) return db
  if (!dbInitPromise) {
    dbInitPromise = initDb()
  }
  return dbInitPromise
}

const SETTINGS_KEYS: (keyof Settings)[] = [
  'stromnoUrl',
  'dexcomUsername',
  'dexcomPassword',
  'dexcomRegion',
]

export async function getSettings(): Promise<Settings> {
  const database = await getDb()
  const stmt = database.prepare(
    'SELECT key, value FROM settings WHERE key IN (?, ?, ?, ?)'
  )
  const rows = stmt.all(...SETTINGS_KEYS) as {
    key: string
    value: string | null
  }[]

  const rawSettings: Record<string, string | null> = {
    stromnoUrl: null,
    dexcomUsername: null,
    dexcomPassword: null,
    dexcomRegion: null,
  }

  for (const row of rows) {
    rawSettings[row.key] = row.value
  }

  return SettingsSchema.parse(rawSettings)
}

export async function updateSettings(
  updates: SettingsUpdate
): Promise<Settings> {
  const validated = SettingsUpdateSchema.parse(updates)
  const database = await getDb()

  const upsert = database.prepare(`
    INSERT INTO settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `)

  const transaction = database.transaction(() => {
    for (const [key, value] of Object.entries(validated)) {
      if (value !== undefined) {
        upsert.run(key, value)
      }
    }
  })

  transaction()
  return getSettings()
}

export async function clearSettings(): Promise<void> {
  const database = await getDb()
  database.exec('DELETE FROM settings')
}
