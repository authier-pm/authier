import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  classifyPasswordForm,
  PasswordFormKind,
  resetLanguageCache
} from './classifyPasswordForm'
import { snapshotPasswordForm } from './snapshotPasswordForm'
import {
  resetPasswordFormClassificationRequests,
  resolvePasswordFormClassification
} from './resolvePasswordFormClassification'
import { kostkohratkyRegisterConfirmHtml } from '../../ui-preview/fixtures/kostkohratkyRegisterConfirm'
import {
  fingerprintPasswordForm,
  MAX_PASSWORD_FORM_HTML_BYTES,
  passwordFormHtmlByteLength,
  type PasswordFormSnapshot
} from '@shared/passwordFormClassification'
import { WebInputType } from '@shared/generated/graphqlBaseTypes'

const { classify } = vi.hoisted(() => ({ classify: vi.fn() }))
vi.mock('./connectTRPC', () => ({
  trpc: { classifyPasswordForm: { mutate: classify } }
}))
vi.mock('./isElementInViewport', () => ({
  isElementVisibleInViewport: (input: HTMLElement) => input.isConnected
}))

const modelResult = async (snapshot: PasswordFormSnapshot) => ({
  version: 1,
  fingerprint: await fingerprintPasswordForm(snapshot),
  result: {
    kind: 'SIGNUP',
    currentPasswordIndex: null,
    newPasswordIndexes: [0, 1],
    usernameIndex: null
  }
})
const localClassification = () =>
  classifyPasswordForm(
    document.querySelector<HTMLInputElement>('input[type="password"]')!
  )

beforeEach(() => {
  document.body.innerHTML = kostkohratkyRegisterConfirmHtml
  document.documentElement.lang = 'cs'
  Object.assign(location, {
    href: 'https://www.kostkohratky.cz/1669325656/e-register-confirm?token=private-token#secret',
    pathname: '/1669325656/e-register-confirm',
    search: '?token=private-token'
  })
  resetLanguageCache()
  resetPasswordFormClassificationRequests()
  classify.mockReset().mockImplementation(modelResult)
})

describe('password form classification fallback', () => {
  it('trims a huge form while keeping the password fields and Czech captions', async () => {
    const local = localClassification()
    const unrelated = document.createElement('p')
    unrelated.textContent = 'Unrelated catalogue content. '.repeat(40_000)
    local.scope.prepend(unrelated)

    const result = await resolvePasswordFormClassification(local, [])
    expect(result.newPasswordInputs[0]?.name).toBe(
      'registerConfirm[newPassword]'
    )
    const sent = classify.mock.calls[0][0] as PasswordFormSnapshot
    expect(passwordFormHtmlByteLength(sent.html)).toBeLessThanOrEqual(
      MAX_PASSWORD_FORM_HTML_BYTES
    )
    expect(sent.html).toContain('data-authier-trimmed')
    expect(sent.html).toContain('Zadejte nové heslo')
    expect(sent.html).toContain('Nové heslo znovu')
    expect(sent.html).toContain('data-authier-index="0"')
    expect(sent.html).toContain('data-authier-index="1"')
    expect(sent.html).not.toContain('Unrelated catalogue')

    const before = await fingerprintPasswordForm(sent)
    unrelated.textContent = 'Different catalogue content. '.repeat(40_000)
    expect(
      await fingerprintPasswordForm(snapshotPasswordForm(local.scope)!.snapshot)
    ).toBe(before)
  })

  it('keeps every input index when multilingual labels and attributes need shrinking', () => {
    const scope = document.querySelector('form')!
    scope.replaceChildren()
    for (let index = 0; index < 24; index++) {
      const label = document.createElement('label')
      label.append(
        document.createTextNode('新しいパスワード 🔐 & " '.repeat(100))
      )
      const input = document.createElement('input')
      input.type = 'password'
      input.name = `field${index}`
      for (const attribute of ['id', 'placeholder', 'aria-label'])
        input.setAttribute(attribute, '🔐&"'.repeat(200))
      label.appendChild(input)
      scope.appendChild(label)
    }
    const captured = snapshotPasswordForm(scope)!
    expect(captured).not.toBeNull()
    expect(
      passwordFormHtmlByteLength(captured.snapshot.html)
    ).toBeLessThanOrEqual(MAX_PASSWORD_FORM_HTML_BYTES)
    const parsed = document.createElement('div')
    parsed.innerHTML = captured.snapshot.html
    expect(
      Array.from(
        parsed.querySelectorAll('input'),
        (input) => input.dataset.authierIndex
      )
    ).toEqual(Array.from({ length: 24 }, (_, index) => String(index)))
  })

  it('compacts deeply nested forms without cutting off their fields', () => {
    const scope = document.querySelector('form')!
    const wrapper = document.createElement('div')
    let parent = wrapper
    for (let index = 0; index < 100; index++) {
      const child = document.createElement('div')
      parent.appendChild(child)
      parent = child
    }
    parent.append(...scope.childNodes)
    scope.appendChild(wrapper)
    const captured = snapshotPasswordForm(scope)!
    expect(captured.snapshot.html).toContain('data-authier-trimmed')
    expect(captured.snapshot.html).toContain('data-authier-index="1"')
  })

  it('sends sanitized structure and uses the model to identify the first password', async () => {
    const password = document.querySelector<HTMLInputElement>(
      'input[type="password"]'
    )!
    password.value = 'do-not-send-password'
    password.setAttribute('value', 'do-not-send-password')
    password.setAttribute('onclick', 'do-not-send-handler')
    document.querySelector<HTMLInputElement>('input[type="hidden"]')!.value =
      'csrf-secret'
    const local = localClassification()
    expect(local.kind).toBe(PasswordFormKind.CHANGE_PASSWORD)
    const result = await resolvePasswordFormClassification(local, [])
    expect(result.kind).toBe(PasswordFormKind.SIGNUP)
    expect(result.currentPasswordInput).toBeNull()
    expect(result.newPasswordInputs[0]).toBe(password)
    const sent = JSON.stringify(classify.mock.calls[0][0])
    for (const secret of [
      'do-not-send-password',
      'do-not-send-handler',
      'csrf-secret',
      'private-token',
      'preview-only',
      '#secret'
    ]) {
      expect(sent).not.toContain(secret)
    }
    expect(sent).toContain('Zadejte nové heslo')
    expect(sent).toContain('data-authier-index')
  })

  it('uses a matching webInputs classification without a request, independent of values and URL tokens', async () => {
    const local = localClassification()
    const captured = snapshotPasswordForm(local.scope)!
    const formClassification = await modelResult(captured.snapshot)
    document.querySelector<HTMLInputElement>('input[type="password"]')!.value =
      'changed'
    const result = await resolvePasswordFormClassification(local, [
      {
        ...captured.snapshot.inputs[0],
        url: captured.snapshot.url,
        host: 'www.kostkohratky.cz',
        kind: WebInputType.PASSWORD,
        createdAt: '',
        formClassification
      }
    ])
    expect(result.signals).toContain('openrouter:cached')
    expect(classify).not.toHaveBeenCalled()
  })

  it('coalesces mutation scans of the same form', async () => {
    const local = localClassification()
    const results = await Promise.all([
      resolvePasswordFormClassification(local, []),
      resolvePasswordFormClassification(local, [])
    ])
    expect(
      results.every((result) => result.kind === PasswordFormKind.SIGNUP)
    ).toBe(true)
    expect(classify).toHaveBeenCalledTimes(1)
  })

  it('requests a fresh classification when the form changes', async () => {
    const local = localClassification()
    const captured = snapshotPasswordForm(local.scope)!
    const formClassification = await modelResult(captured.snapshot)
    document.querySelector('h1')!.textContent = 'Vyberte heslo'
    await resolvePasswordFormClassification(local, [
      {
        ...captured.snapshot.inputs[0],
        url: captured.snapshot.url,
        host: 'www.kostkohratky.cz',
        kind: WebInputType.PASSWORD,
        createdAt: '',
        formClassification
      }
    ])
    expect(classify).toHaveBeenCalledTimes(1)
  })

  it('does not ask the model to override standard autocomplete attributes', async () => {
    for (const input of document.querySelectorAll('input[type="password"]'))
      input.setAttribute('autocomplete', 'new-password')
    const local = localClassification()
    expect(await resolvePasswordFormClassification(local, [])).toBe(local)
    expect(classify).not.toHaveBeenCalled()
  })

  it('rejects invalid model targets', async () => {
    classify.mockImplementation(async (snapshot: PasswordFormSnapshot) => {
      const result = await modelResult(snapshot)
      result.result.newPasswordIndexes = [0, 22]
      return result
    })
    const local = localClassification()
    expect(await resolvePasswordFormClassification(local, [])).toBe(local)
  })

  it('does not apply a response to a replaced form', async () => {
    classify.mockImplementation(async (snapshot: PasswordFormSnapshot) => {
      document.body.innerHTML = kostkohratkyRegisterConfirmHtml
      return modelResult(snapshot)
    })
    const result = await resolvePasswordFormClassification(
      localClassification(),
      []
    )
    expect(result.kind).toBe(PasswordFormKind.UNKNOWN)
    expect(result.currentPasswordInput).toBeNull()
    expect(result.newPasswordInputs).toEqual([])
  })

  it('falls back after a provider failure without retrying on every DOM mutation', async () => {
    const warning = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined)
    classify.mockRejectedValue(new Error('provider unavailable'))
    const local = localClassification()
    expect(await resolvePasswordFormClassification(local, [])).toBe(local)
    expect(await resolvePasswordFormClassification(local, [])).toBe(local)
    expect(classify).toHaveBeenCalledTimes(1)
    warning.mockRestore()
  })
})
