import { z } from 'zod'

export const loginCredentialsSchema = z.object({
  username: z.string().nonempty(),
  password: z.string().nonempty()
})
