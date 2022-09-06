import { z } from 'zod'

export const loginCredentialsSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
})

export const totpSchema = z.object({
  secret: z.string().min(1),
  digits: z.number(),
  period: z.number()
})
