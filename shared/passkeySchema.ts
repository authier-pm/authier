import { z } from 'zod'

const base64urlSchema = z
  .string()
  .min(1)
  .regex(/^[A-Za-z0-9_-]+$/)
const p256CoordinateSchema = base64urlSchema.length(43)

/** This complete object is encrypted by the vault before it leaves the device. */
export const passkeySchema = z.object({
  credentialId: base64urlSchema.max(1364),
  rpId: z.string().min(1).max(253),
  rpName: z.string(),
  userHandle: base64urlSchema.max(86),
  userName: z.string(),
  userDisplayName: z.string(),
  privateKeyJwk: z.object({
    kty: z.literal('EC'),
    crv: z.literal('P-256'),
    x: p256CoordinateSchema,
    y: p256CoordinateSchema,
    d: p256CoordinateSchema,
    key_ops: z.array(z.literal('sign')).optional(),
    ext: z.boolean().optional()
  }),
  createdAt: z.string().datetime(),
  url: z.string().min(1),
  label: z.string(),
  iconUrl: z.string().min(1).nullable()
})

export type PasskeyData = z.infer<typeof passkeySchema>
