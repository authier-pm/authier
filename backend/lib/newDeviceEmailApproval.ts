import { createHash, randomBytes } from 'node:crypto'
import { and, eq, isNull, notExists, type InferSelectModel } from 'drizzle-orm'
import {
  allowsEmailApproval,
  isNewDeviceApprovalComplete,
  requiresBothApprovals
} from '../../shared/newDeviceApproval'
import * as schema from '../drizzle/schema'
import type { DbType } from '../prisma/prismaClient'
import { sendEmail } from '../utils/email'
import { getBackendOrigin } from '../utils/getBackendOrigin'

type Transaction = Parameters<Parameters<DbType['transaction']>[0]>[0]

export const invalidateNewDeviceApprovals = async (
  tx: Transaction,
  userId: string
) => {
  await tx
    .update(schema.decryptionChallenge)
    .set({
      approvedAt: null,
      approvedFromDeviceId: null,
      approvedByRecovery: false,
      emailApprovalTokenHash: null,
      emailApprovalExpiresAt: null,
      emailApprovalSentAt: null,
      emailApprovedAt: null,
      deviceApprovedAt: null
    })
    .where(
      and(
        eq(schema.decryptionChallenge.userId, userId),
        notExists(
          tx
            .select({ id: schema.device.id })
            .from(schema.device)
            .where(
              and(
                eq(schema.device.id, schema.decryptionChallenge.deviceId),
                eq(schema.device.userId, userId),
                isNull(schema.device.deletedAt)
              )
            )
        )
      )
    )
}

export const hasCurrentDeviceApproval = async (
  db: Pick<DbType, 'query'>,
  challenge: InferSelectModel<typeof schema.decryptionChallenge>,
  user: Pick<InferSelectModel<typeof schema.user>, 'id' | 'newDevicePolicy'>
) => {
  if (
    !challenge.approvedAt ||
    challenge.rejectedAt ||
    challenge.blockIp ||
    challenge.userId !== user.id
  )
    return false
  if (await hasPendingReset(db, challenge.id)) return false
  const existingDevice = await db.query.device.findFirst({
    where: { id: challenge.deviceId }
  })
  if (existingDevice && existingDevice.userId !== user.id) return false
  // A previously enrolled device already passed approval. Login still requires
  // its current master-password-encrypted enrollment secret.
  if (existingDevice && !existingDevice.deletedAt) return true
  if (
    isNewDeviceApprovalComplete(user.newDevicePolicy, {
      emailApproved: Boolean(challenge.emailApprovedAt),
      deviceApproved: Boolean(challenge.deviceApprovedAt)
    })
  )
    return true
  if (!challenge.approvedByRecovery) return false
  const reset = await db.query.masterDeviceResetRequest.findFirst({
    where: {
      decryptionChallengeId: challenge.id,
      userId: user.id,
      rejectedAt: { isNull: true }
    },
    columns: { completedAt: true }
  })
  return Boolean(reset?.completedAt)
}

const approvalLifetimeMs = 15 * 60_000
const resendCooldownMs = 60_000
const tokenPattern = /^[a-f0-9]{64}$/
export const hashDeviceApprovalToken = (token: string) =>
  createHash('sha256').update(token).digest('hex')

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => {
    const replacements: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }
    return replacements[character]
  })

const hasPendingReset = async (
  db: Pick<DbType, 'query'>,
  challengeId: number
) =>
  Boolean(
    await db.query.masterDeviceResetRequest.findFirst({
      where: {
        decryptionChallengeId: challengeId,
        completedAt: { isNull: true },
        rejectedAt: { isNull: true }
      },
      columns: { id: true }
    })
  )

export const sendNewDeviceApprovalEmail = async (
  db: DbType,
  challengeId: number
) => {
  const candidate = await db.query.decryptionChallenge.findFirst({
    where: { id: challengeId }
  })
  if (!candidate) return

  await db.transaction(async (tx) => {
    // Policy changes and approvals lock the user first, then the challenge.
    const [user] = await tx
      .select()
      .from(schema.user)
      .where(eq(schema.user.id, candidate.userId))
      .for('update')
    if (!user?.email || !allowsEmailApproval(user.newDevicePolicy)) return
    const [challenge] = await tx
      .select()
      .from(schema.decryptionChallenge)
      .where(eq(schema.decryptionChallenge.id, challengeId))
      .for('update')
    if (
      !challenge ||
      challenge.approvedAt ||
      challenge.emailApprovedAt ||
      challenge.rejectedAt ||
      challenge.blockIp ||
      (await hasPendingReset(tx, challengeId))
    )
      return

    const now = new Date()
    // Login polling must never resend a still-valid email or rotate its token.
    if (
      (challenge.emailApprovalTokenHash &&
        challenge.emailApprovalExpiresAt &&
        challenge.emailApprovalExpiresAt > now) ||
      (challenge.emailApprovalSentAt &&
        now.getTime() - challenge.emailApprovalSentAt.getTime() <
          resendCooldownMs)
    )
      return

    const token = randomBytes(32).toString('hex')
    const url = `${getBackendOrigin()}/approve-new-device#token=${token}`
    const instructions = requiresBothApprovals(user.newDevicePolicy)
      ? 'You also require approval from another Authier device before this device can sign in.'
      : 'Your master password is still required to sign in.'
    await sendEmail(
      user.email,
      {
        Subject: 'Approve a new Authier device',
        TextPart: `A new device, ${challenge.deviceName}, requested access to your Authier account from ${challenge.ipAddress}.\n\nIf you started this login, review and approve it within 15 minutes:\n${url}\n\n${instructions}\nIf this was not you, do not approve it.`,
        HTMLPart: `<p>A new device requested access to your Authier account.</p><p><strong>${escapeHtml(challenge.deviceName)}</strong><br>IP address: ${escapeHtml(challenge.ipAddress)}</p><p>If you started this login, <a href="${url}">review and approve this device</a> within 15 minutes.</p><p>${instructions}</p><p>If this was not you, do not approve it.</p>`
      },
      { requireDelivery: true }
    )
    await tx
      .update(schema.decryptionChallenge)
      .set({
        emailApprovalTokenHash: hashDeviceApprovalToken(token),
        emailApprovalExpiresAt: new Date(now.getTime() + approvalLifetimeMs),
        emailApprovalSentAt: now
      })
      .where(eq(schema.decryptionChallenge.id, challenge.id))
  })
}

const findEmailApproval = async (db: Pick<DbType, 'query'>, token: string) => {
  if (!tokenPattern.test(token)) return null
  const challenge = await db.query.decryptionChallenge.findFirst({
    where: { emailApprovalTokenHash: hashDeviceApprovalToken(token) }
  })
  if (
    !challenge ||
    challenge.approvedAt ||
    challenge.emailApprovedAt ||
    challenge.rejectedAt ||
    challenge.blockIp ||
    !challenge.emailApprovalExpiresAt ||
    challenge.emailApprovalExpiresAt <= new Date()
  )
    return null
  const user = await db.query.user.findFirst({
    where: { id: challenge.userId }
  })
  if (!user?.email || !allowsEmailApproval(user.newDevicePolicy)) return null
  const device = await db.query.device.findFirst({
    where: { id: challenge.deviceId }
  })
  if (
    (device &&
      (device.userId !== user.id || device.deletedAt || device.logoutAt)) ||
    (await hasPendingReset(db, challenge.id))
  )
    return null
  return { challenge, user }
}

export const confirmNewDeviceEmailApproval = async (
  db: DbType,
  token: string
): Promise<'approved' | 'waiting-for-device' | 'invalid'> => {
  const candidate = await findEmailApproval(db, token)
  if (!candidate) return 'invalid'

  return db.transaction(async (tx) => {
    await tx
      .select({ id: schema.user.id })
      .from(schema.user)
      .where(eq(schema.user.id, candidate.user.id))
      .for('update')
    await tx
      .select({ id: schema.decryptionChallenge.id })
      .from(schema.decryptionChallenge)
      .where(eq(schema.decryptionChallenge.id, candidate.challenge.id))
      .for('update')
    // Re-read after locking: a previous click, rejection or policy change wins.
    const current = await findEmailApproval(tx, token)
    if (!current) return 'invalid'
    const now = new Date()
    const complete = isNewDeviceApprovalComplete(current.user.newDevicePolicy, {
      emailApproved: true,
      deviceApproved: Boolean(current.challenge.deviceApprovedAt)
    })
    const [updated] = await tx
      .update(schema.decryptionChallenge)
      .set({
        emailApprovedAt: now,
        approvedAt: complete ? now : null,
        emailApprovalTokenHash: null,
        emailApprovalExpiresAt: null
      })
      .where(
        and(
          eq(schema.decryptionChallenge.id, current.challenge.id),
          eq(
            schema.decryptionChallenge.emailApprovalTokenHash,
            hashDeviceApprovalToken(token)
          ),
          isNull(schema.decryptionChallenge.rejectedAt)
        )
      )
      .returning({ id: schema.decryptionChallenge.id })
    if (!updated) return 'invalid'
    return complete ? 'approved' : 'waiting-for-device'
  })
}

const approvalPage = (
  title: string,
  content: string,
  status = 200,
  script?: string
) => {
  const nonce = randomBytes(16).toString('base64')
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} · Authier</title><style>body{font:16px/1.6 system-ui,sans-serif;background:#0e1524;color:#eef2ff;margin:0;padding:32px}main{max-width:520px;margin:8vh auto;padding:32px;border:1px solid #394256;border-radius:20px}h1{font-size:28px}button{font:inherit;background:#b8f76d;color:#12210b;border:0;border-radius:10px;padding:12px 20px;cursor:pointer}p{overflow-wrap:anywhere}.brand{letter-spacing:.15em;color:#b8f76d}</style></head><body><main><p class="brand">AUTHIER</p><h1>${title}</h1>${content}</main>${script ? `<script nonce="${nonce}">${script}</script>` : ''}</body></html>`,
    {
      status,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
        'referrer-policy': 'no-referrer',
        'x-content-type-options': 'nosniff',
        'content-security-policy': `default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'`
      }
    }
  )
}

export const reviewNewDeviceEmailApproval = async (
  db: DbType,
  token: string
) => {
  const pending = await findEmailApproval(db, token)
  if (!pending) return newDeviceEmailApprovalResult('invalid')
  return Response.json(
    {
      deviceName: pending.challenge.deviceName,
      ipAddress: pending.challenge.ipAddress,
      requiresBoth: requiresBothApprovals(pending.user.newDevicePolicy)
    },
    {
      headers: {
        'cache-control': 'no-store',
        'referrer-policy': 'no-referrer',
        'x-content-type-options': 'nosniff'
      }
    }
  )
}

// A fragment never reaches HTTP request logs or Referer headers. The browser
// sends the token only in POST bodies; review is read-only, approval is explicit.
export const newDeviceEmailApprovalPage = () =>
  approvalPage(
    'Approve this new device?',
    `<p id="approval-status" role="status">Checking this approval link…</p><p><strong id="device-name"></strong><br><span id="device-ip"></span></p><form method="post" action="/approve-new-device"><input id="approval-token" type="hidden" name="token"><button id="approve-button" type="submit" disabled>Approve this device</button></form><p id="approval-instructions">Your master password is still required. If this was not you, close this page.</p><noscript><p>Enable JavaScript to review this approval link.</p></noscript>`,
    200,
    `const token = new URLSearchParams(location.hash.slice(1)).get('token');
  history.replaceState(null, '', location.pathname);
  const status = document.getElementById('approval-status');
  const unavailable = () => { status.textContent = 'This link has expired, was already used, or the request is no longer available.'; };
  if (!token || !/^[a-f0-9]{64}$/.test(token)) unavailable();
  else fetch('/approve-new-device/review', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token }) })
    .then(async (response) => {
      if (!response.ok) { unavailable(); return; }
      const details = await response.json();
      document.getElementById('device-name').textContent = details.deviceName;
      document.getElementById('device-ip').textContent = 'IP address: ' + details.ipAddress;
      document.getElementById('approval-token').value = token;
      if (details.requiresBoth) document.getElementById('approval-instructions').textContent = 'Approval from another Authier device is also required. Your master password is still required to sign in.';
      status.textContent = 'Only approve a login you started.';
      document.getElementById('approve-button').disabled = false;
    }).catch(unavailable);`
  )

export const newDeviceEmailApprovalResult = (
  status: Awaited<ReturnType<typeof confirmNewDeviceEmailApproval>>
) => {
  if (status === 'approved')
    return approvalPage(
      'Device approved',
      '<p>Return to the device signing in to finish unlocking your vault.</p>'
    )
  if (status === 'waiting-for-device')
    return approvalPage(
      'Email approval confirmed',
      '<p>Approve this login from another Authier device too, then return to the device signing in.</p>'
    )
  return approvalPage(
    'Approval link unavailable',
    '<p>This link has expired, was already used, or the request is no longer available.</p>',
    400
  )
}
