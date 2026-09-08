import { z } from 'zod'

const androidApiSchema = z.object({
  openapi: z.string().regex(/^3\./),
  paths: z.record(
    z.string(),
    z.object({ post: z.object({ operationId: z.string() }).optional() })
  ),
  components: z.object({
    schemas: z.object({
      SecretRecord: z.object({
        properties: z.object({
          kind: z.object({ enum: z.array(z.string()) })
        })
      })
    })
  })
})

export const verifyAndroidApi = (document: unknown) => {
  const api = androidApiSchema.parse(document)
  for (const path of [
    '/auth/register',
    '/auth/requestDeviceChallenge',
    '/auth/completeDeviceLogin',
    '/auth/refreshTokens',
    '/auth/logout',
    '/session/bootstrap',
    '/vault/sync',
    '/vault/create',
    '/vault/update',
    '/vault/delete',
    '/devices/list',
    '/devices/listPendingChallenges',
    '/devices/approveChallenge',
    '/devices/rejectChallenge',
    '/devices/remove',
    '/security/get',
    '/security/updateNewDevicePolicy',
    '/security/updateVaultLockTimeout'
  ]) {
    if (!api.paths[path]?.post)
      throw new Error(
        `Deployed API is missing ${path}; deploy the backend and migrations first`
      )
  }
  if (
    !api.components.schemas.SecretRecord.properties.kind.enum.includes(
      'PASSKEY'
    )
  )
    throw new Error('Deployed API does not support the passkey vault format')
}

if (import.meta.main) {
  const response = await fetch('https://api.authier.pm/api/v1/openapi.json', {
    signal: AbortSignal.timeout(20_000),
    redirect: 'error'
  })
  if (!response.ok)
    throw new Error(
      `Production API returned HTTP ${response.status}; deploy the backend and migrations before publishing Android`
    )
  verifyAndroidApi(await response.json())
  console.log(
    'Production exposes the required Android API contract (deployment must also have applied its migrations)'
  )
}
