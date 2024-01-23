import { webhookHandler } from './stripeWebhook'
import { describe, expect, it } from 'vitest'

describe('webhookHandler', () => {
  it('should return 400 when missing signature', async () => {
    await webhookHandler(
      {
        headers: {}
      } as any,
      {
        status: (code) => {
          expect(code).toBe(400)
          return {
            send: () => {}
          }
        },
        send: (message) => {
          expect(message).toMatch(/Webhook Error/)
        }
      }
    )
  })

  it.todo('should increment account limits on new subscription', () => {})
  it.todo(
    'should decrement account limits on subscription paused/deleted',
    () => {}
  )
})
