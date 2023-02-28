import { z } from 'zod'

const secretUrlsSchema = z.object({
  url: z.string().min(1),
  label: z.string(),
  androidUri: z.string().min(1).nullable().optional(),
  iosUri: z.string().min(1).nullable().optional(),
  iconUrl: z.string().min(1).nullable()
})

export const loginCredentialsSchema = secretUrlsSchema.extend({
  username: z.string().min(1),
  password: z.string().min(1)
})

export const totpSchema = secretUrlsSchema.extend({
  secret: z.string().min(1),
  digits: z.number(),
  period: z.number(),
  url: z.string().min(1).nullish() // This can be nullish for imported items, should be non-nullish for TOTP items added from web extension
})
