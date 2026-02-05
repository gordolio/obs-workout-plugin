export async function register() {
  // Only run on the server at runtime (not during build)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { getSettings } = await import('@/lib/db')
    const { stromnoManager } = await import('@/lib/stromno-manager')
    const { dexcomManager } = await import('@/lib/dexcom-manager')

    console.log('[Auto-Connect] Checking for saved connections...')

    try {
      const settings = await getSettings()

      // Auto-connect to Stromno if URL is configured
      if (settings.stromnoUrl) {
        console.log('[Auto-Connect] Found Stromno URL, connecting...')
        try {
          await stromnoManager.connect(settings.stromnoUrl)
          console.log('[Auto-Connect] Stromno connected successfully')
        } catch (error) {
          console.error(
            '[Auto-Connect] Failed to connect to Stromno:',
            error instanceof Error ? error.message : error
          )
        }
      }

      // Auto-connect to Dexcom if credentials are configured
      if (
        settings.dexcomUsername &&
        settings.dexcomPassword &&
        settings.dexcomRegion
      ) {
        console.log('[Auto-Connect] Found Dexcom credentials, connecting...')
        try {
          await dexcomManager.connect({
            username: settings.dexcomUsername,
            password: settings.dexcomPassword,
            region: settings.dexcomRegion,
          })
          console.log('[Auto-Connect] Dexcom connected successfully')
        } catch (error) {
          console.error(
            '[Auto-Connect] Failed to connect to Dexcom:',
            error instanceof Error ? error.message : error
          )
        }
      }

      if (!settings.stromnoUrl && !settings.dexcomUsername) {
        console.log('[Auto-Connect] No saved connections found')
      }
    } catch (error) {
      console.error(
        '[Auto-Connect] Failed to read settings:',
        error instanceof Error ? error.message : error
      )
    }
  }
}
