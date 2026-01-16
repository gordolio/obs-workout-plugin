import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  // Add more environment variables as needed
  // DEXCOM_USERNAME: z.string().optional(),
  // DEXCOM_PASSWORD: z.string().optional(),
})

export const env = envSchema.parse(process.env)
