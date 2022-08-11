import { z } from 'zod'

export const loginCredentialsSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
})

export const totpSchema = z.object({
  totp: z.string().min(1),
  url: z.string().min(1),
  label: z.string().min(1),
  androidUri: z.string().min(1),
  iosUri: z.string().min(1),
  iconUrl: z.string().min(1)
})
