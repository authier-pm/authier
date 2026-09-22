import browser from 'webextension-polyfill'
import { isTotpAccountEmail } from '@shared/totpLabel'
import { TotpEmailMessage } from '../util/totpAccountEmail'

const isEmailInput = (input: HTMLInputElement) =>
  input.type === 'email' ||
  (input.type === 'text' &&
    (/(?:^|\s)(?:email|username)(?:\s|$)/.test(input.autocomplete) ||
      /email/i.test(`${input.name} ${input.id}`)))

const singleEmail = (values: string[]) => {
  const emails = [
    ...new Set(values.map((value) => value.trim()).filter(isTotpAccountEmail))
  ]
  return emails.length === 1 ? emails[0] : undefined
}

export const readTotpPageEmail = (page: Document) => {
  const inputs = Array.from(page.querySelectorAll('input')).filter(
    (input) =>
      isEmailInput(input) &&
      input.getClientRects().length > 0 &&
      page.defaultView?.getComputedStyle(input).visibility !== 'hidden'
  )
  const inputEmail = singleEmail(inputs.map((input) => input.value))
  if (inputEmail) return inputEmail

  // innerText includes rendered text only, excluding scripts and hidden accounts.
  const visibleText = page.body?.innerText ?? ''
  const matches =
    visibleText.match(
      /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+/g
    ) ?? []
  return singleEmail(matches)
}

export const observeTotpAccountEmail = (
  page: Document,
  report: (email: string) => void
) => {
  const onInput = (event: Event) => {
    const input = event.target
    if (!(input instanceof HTMLInputElement) || !isEmailInput(input)) return
    const email = input.value.trim()
    if (isTotpAccountEmail(email)) report(email)
  }
  page.addEventListener('input', onInput, true)
  page.addEventListener('change', onInput, true)
  return () => {
    page.removeEventListener('input', onInput, true)
    page.removeEventListener('change', onInput, true)
  }
}

export const initializeTotpAccountEmail = () => {
  observeTotpAccountEmail(document, (email) => {
    void browser.runtime.sendMessage({ kind: TotpEmailMessage.REPORT, email })
  })
  browser.runtime.onMessage.addListener((message: unknown, sender) => {
    if (
      sender.id === browser.runtime.id &&
      typeof message === 'object' &&
      message !== null &&
      'kind' in message &&
      message.kind === TotpEmailMessage.PAGE
    ) {
      return Promise.resolve(readTotpPageEmail(document) ?? null)
    }
  })
}
