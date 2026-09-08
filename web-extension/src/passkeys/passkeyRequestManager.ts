import type { PasskeyData } from '@shared/passkeySchema'
import {
  assertNoExcludedPasskey,
  createPasskey,
  creationOptionsSchema,
  getPasskeyAssertion,
  getUnsupportedPasskeyReason,
  passkeyMatchesRequest,
  requestOptionsSchema,
  validateRpId,
  type PasskeyCreationOptions,
  type PasskeyRequestOptions
} from './webauthn'
import type { PasskeyApprovalView, PasskeyReply } from './passkeyApprovalTypes'

export interface PasskeySender {
  id?: string
  url?: string
  frameId?: number
  tab?: { id?: number }
}

export interface PasskeyRepository {
  initialize(): Promise<unknown>
  identity(): string | null
  session(): object | null
  verifyPassword(password: string): Promise<object>
  list(): Promise<PasskeyData[]>
  save(passkey: PasskeyData): Promise<void>
}

export interface PasskeyWindows {
  extensionId: string
  approvalUrl(token: string): string
  open(token: string): Promise<number>
  close(windowId: number): Promise<unknown>
  isCurrentTab(tabId: number, url: string): Promise<boolean>
}

type RequestOptions =
  | { operation: 'create'; options: PasskeyCreationOptions }
  | { operation: 'get'; options: PasskeyRequestOptions }

type PendingRequest = RequestOptions & {
  token: string
  requestId: string
  tabId: number
  url: string
  origin: string
  rpId: string
  identity: string
  session: object | null
  verifiedUntil: number
  windowId?: number
  processing: boolean
  attempts: number
  timer: ReturnType<typeof setTimeout>
  resolve(reply: PasskeyReply): void
}

export const passkeyErrorReply = (error: unknown): PasskeyReply => ({
  status: 'error',
  name: error instanceof DOMException ? error.name : 'NotAllowedError',
  // Do not expose backend responses, key data, or exception stacks to websites.
  message:
    error instanceof DOMException
      ? error.message
      : 'Authier could not complete this passkey request.'
})

const denied = (message: string) => new DOMException(message, 'NotAllowedError')

export class PasskeyRequestManager {
  private pending = new Map<string, PendingRequest>()

  constructor(
    private repository: PasskeyRepository,
    private windows: PasskeyWindows
  ) {}

  async begin(
    request: {
      requestId: string
      operation: 'create' | 'get'
      options: unknown
    },
    sender: PasskeySender
  ): Promise<PasskeyReply> {
    if (
      sender.id !== this.windows.extensionId ||
      sender.frameId !== 0 ||
      sender.tab?.id === undefined ||
      !sender.url
    ) {
      throw new DOMException(
        'Passkeys require a top-level website.',
        'SecurityError'
      )
    }
    const tabId = sender.tab.id
    const url = sender.url
    const origin = new URL(url).origin
    const serializedOptions = JSON.stringify(request.options)
    if (!serializedOptions || serializedOptions.length > 262_144) {
      throw new DOMException('The passkey request is too large.', 'DataError')
    }
    const parsed: RequestOptions =
      request.operation === 'create'
        ? {
            operation: 'create',
            options: creationOptionsSchema.parse(request.options)
          }
        : {
            operation: 'get',
            options: requestOptionsSchema.parse(request.options)
          }
    const rpId = validateRpId(
      parsed.operation === 'create'
        ? parsed.options.rp.id
        : parsed.options.rpId,
      origin
    )
    if (getUnsupportedPasskeyReason(parsed.options, parsed.operation))
      return { status: 'fallback' }
    // Reserve before the first await: initialization and credential lookup may be slow.
    // This also lets AbortSignal and navigation cancel ceremonies before UI opens.
    if ([...this.pending.values()].some((entry) => entry.tabId === tabId)) {
      throw denied('Another passkey request is already open for this tab.')
    }
    const token = crypto.randomUUID()
    const timeout = Math.min(
      Math.max(parsed.options.timeout ?? 120_000, 1_000),
      300_000
    )
    return new Promise<PasskeyReply>((resolve) => {
      const pending: PendingRequest = {
        ...parsed,
        token,
        requestId: request.requestId,
        tabId,
        url,
        origin,
        rpId,
        identity: '',
        session: null,
        verifiedUntil: 0,
        processing: false,
        attempts: 0,
        resolve,
        timer: setTimeout(
          () =>
            this.finish(
              token,
              passkeyErrorReply(denied('The passkey request timed out.'))
            ),
          timeout
        )
      }
      this.pending.set(token, pending)
      void this.prepare(pending).catch((error: unknown) =>
        this.finish(token, passkeyErrorReply(error))
      )
    })
  }

  private async prepare(pending: PendingRequest) {
    await this.repository.initialize()
    if (this.pending.get(pending.token) !== pending) return
    const identity = this.repository.identity()
    if (!identity) {
      this.finish(pending.token, { status: 'fallback' })
      return
    }
    pending.identity = identity
    await this.assertCurrent(pending)
    if (pending.operation === 'get' && this.repository.session()) {
      const matches = (await this.repository.list()).some((passkey) =>
        passkeyMatchesRequest(passkey, pending.options, pending.origin)
      )
      await this.assertCurrent(pending)
      if (!matches) {
        this.finish(pending.token, { status: 'fallback' })
        return
      }
    }
    const windowId = await this.windows.open(pending.token)
    if (this.pending.get(pending.token) === pending) pending.windowId = windowId
    else void this.windows.close(windowId)
  }

  private get(token: string, sender: PasskeySender) {
    if (
      sender.id !== this.windows.extensionId ||
      sender.url !== this.windows.approvalUrl(token) ||
      (sender.frameId !== undefined && sender.frameId !== 0)
    ) {
      throw new DOMException(
        'Only the Authier approval window can approve a passkey.',
        'SecurityError'
      )
    }
    const pending = this.pending.get(token)
    if (!pending)
      throw denied(
        'This passkey request has expired. Please try again on the website.'
      )
    return pending
  }

  private async assertCurrent(pending: PendingRequest) {
    if (
      this.pending.get(pending.token) !== pending ||
      this.repository.identity() !== pending.identity ||
      !(await this.windows.isCurrentTab(pending.tabId, pending.url))
    ) {
      const error = denied('The website or vault changed. Please try again.')
      this.finish(pending.token, passkeyErrorReply(error))
      throw error
    }
    // Navigation, cancellation and account changes can arrive during the tab check.
    if (
      this.pending.get(pending.token) !== pending ||
      this.repository.identity() !== pending.identity
    ) {
      const error = denied('The website or vault changed. Please try again.')
      this.finish(pending.token, passkeyErrorReply(error))
      throw error
    }
  }

  private isVerified(pending: PendingRequest) {
    return (
      pending.verifiedUntil > Date.now() &&
      pending.session !== null &&
      pending.session === this.repository.session()
    )
  }

  async view(
    token: string,
    sender: PasskeySender
  ): Promise<PasskeyApprovalView> {
    const pending = this.get(token, sender)
    await this.assertCurrent(pending)
    let verified = this.isVerified(pending)
    let accounts: PasskeyApprovalView['accounts'] = []
    if (verified && pending.operation === 'get') {
      const passkeys = await this.repository.list()
      await this.assertCurrent(pending)
      verified = this.isVerified(pending)
      if (verified) {
        accounts = passkeys
          .filter((passkey) =>
            passkeyMatchesRequest(passkey, pending.options, pending.origin)
          )
          .map(({ credentialId, userName, userDisplayName }) => ({
            credentialId,
            userName,
            userDisplayName
          }))
      }
    }
    return {
      token,
      operation: pending.operation,
      origin: pending.origin,
      rpId: pending.rpId,
      accountName:
        pending.operation === 'create' ? pending.options.user.name : undefined,
      verified,
      accounts
    }
  }

  async verify(token: string, password: string, sender: PasskeySender) {
    const pending = this.get(token, sender)
    await this.assertCurrent(pending)
    if (pending.processing)
      throw denied('Please wait for the current operation.')
    if (pending.attempts >= 5) {
      this.finish(
        token,
        passkeyErrorReply(
          denied('Too many password attempts. Start again on the website.')
        )
      )
      throw denied('Too many password attempts. Start again on the website.')
    }
    pending.processing = true
    pending.attempts += 1
    // Error handling here releases the per-ceremony lock for a corrected password.
    try {
      const verifiedSession = await this.repository.verifyPassword(password)
      await this.assertCurrent(pending)
      if (verifiedSession !== this.repository.session())
        throw denied('The vault changed. Verify your master password again.')
      pending.session = verifiedSession
      pending.verifiedUntil = Date.now() + 60_000
      return await this.view(token, sender)
    } finally {
      pending.processing = false
    }
  }

  async approve(
    token: string,
    credentialId: string | undefined,
    sender: PasskeySender
  ) {
    const pending = this.get(token, sender)
    await this.assertCurrent(pending)
    if (pending.processing)
      throw denied('Please wait for the current operation.')
    if (!this.isVerified(pending)) {
      throw denied('Verify your master password again to continue.')
    }
    pending.processing = true
    try {
      const passkeys = await this.repository.list()
      await this.assertCurrent(pending)
      if (!this.isVerified(pending))
        throw denied(
          'The vault was locked or verification expired. Please try again.'
        )
      if (pending.operation === 'create') {
        assertNoExcludedPasskey(passkeys, pending.options, pending.origin)
        const result = await createPasskey(
          pending.options,
          pending.origin,
          true
        )
        await this.assertCurrent(pending)
        if (!this.isVerified(pending))
          throw denied(
            'The vault was locked or verification expired. Please try again.'
          )
        // Persist encrypted credentials to the sync service before telling the website registration succeeded.
        await this.repository.save(result.passkey)
        await this.assertCurrent(pending)
        if (!this.isVerified(pending))
          throw denied(
            'The vault was locked or verification expired. Please try again.'
          )
        this.finish(token, { status: 'ok', credential: result.credential })
      } else {
        const passkey = passkeys.find(
          (item) =>
            item.credentialId === credentialId &&
            passkeyMatchesRequest(item, pending.options, pending.origin)
        )
        if (!passkey) throw denied('Choose a passkey for this website.')
        const credential = await getPasskeyAssertion(
          passkey,
          pending.options,
          pending.origin,
          true
        )
        await this.assertCurrent(pending)
        if (!this.isVerified(pending))
          throw denied(
            'The vault was locked or verification expired. Please try again.'
          )
        this.finish(token, { status: 'ok', credential })
      }
    } catch (error) {
      // Every completed approval attempt settles the website, including exclusion
      // failures; otherwise it would hang until timeout while the popup retries.
      this.finish(token, passkeyErrorReply(error))
      throw error
    } finally {
      pending.processing = false
    }
  }

  dismiss(token: string, fallback: boolean, sender: PasskeySender) {
    this.get(token, sender)
    this.finish(
      token,
      fallback
        ? { status: 'fallback' }
        : passkeyErrorReply(denied('The passkey request was canceled.'))
    )
  }

  cancel(requestId: string, sender: PasskeySender) {
    for (const pending of this.pending.values()) {
      if (
        sender.id === this.windows.extensionId &&
        sender.frameId === 0 &&
        pending.tabId === sender.tab?.id &&
        pending.url === sender.url &&
        pending.requestId === requestId
      ) {
        this.finish(
          pending.token,
          passkeyErrorReply(
            new DOMException('The request was aborted.', 'AbortError')
          )
        )
      }
    }
  }

  cancelTab(tabId: number) {
    for (const pending of this.pending.values()) {
      if (pending.tabId === tabId)
        this.finish(
          pending.token,
          passkeyErrorReply(denied('The website was closed or navigated away.'))
        )
    }
  }

  windowClosed(windowId: number) {
    for (const pending of this.pending.values()) {
      if (pending.windowId === windowId)
        this.finish(
          pending.token,
          passkeyErrorReply(denied('The passkey request was canceled.'))
        )
    }
  }

  private finish(token: string, reply: PasskeyReply) {
    const pending = this.pending.get(token)
    if (!pending) return
    this.pending.delete(token)
    clearTimeout(pending.timer)
    pending.resolve(reply)
    if (pending.windowId !== undefined)
      void this.windows.close(pending.windowId)
  }
}
