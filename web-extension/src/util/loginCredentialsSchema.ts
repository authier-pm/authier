import { z } from 'zod'

export const loginCredentialsSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
})
