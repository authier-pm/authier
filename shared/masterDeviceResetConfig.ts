import { z } from 'zod'

export const resetWaitMinutesSchema = z
  .number()
  .int()
  .min(5)
  .max(90 * 24 * 60)
export const masterDeviceResetConfigSchema = z
  .object({
    requiredApprovals: z.number().int().min(0).max(10),
    waitMinutes: resetWaitMinutesSchema,
    notificationEmails: z.array(z.string().trim().email().max(254)).max(20)
  })
  .strict()
export type MasterDeviceResetConfig = z.infer<
  typeof masterDeviceResetConfigSchema
>
export const defaultMasterDeviceResetConfig: MasterDeviceResetConfig = {
  requiredApprovals: 1,
  waitMinutes: 48 * 60,
  notificationEmails: []
}
export const resetNotificationRecipients = (
  email: string | null,
  config: MasterDeviceResetConfig
) => [
  ...new Set(
    [email, ...config.notificationEmails]
      .filter((value): value is string => Boolean(value))
      .map((value) => value.toLowerCase())
  )
]
