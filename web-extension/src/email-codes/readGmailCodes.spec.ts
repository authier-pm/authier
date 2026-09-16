import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { webcrypto } from 'node:crypto'
import {
  formattedEmailCodeBodies,
  gmailUnreadVerificationEmail,
  gmailVerificationEmail
} from '../../ui-preview/fixtures/gmailVerificationEmail'
import { observeGmailCodes, readGmailCodes } from './readGmailCodes'

describe('Gmail email code detection', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'crypto', {
      value: webcrypto,
      configurable: true
    })
    document.body.innerHTML = gmailVerificationEmail
  })
  afterEach(() => {
    document.body.innerHTML = ''
    vi.useRealTimers()
  })

  it('pairs an opened email code with its sender, even in a background tab', () => {
    expect(readGmailCodes(document)).toEqual([
      { provider: 'Gmail', sender: 'someone@example.com', code: '213456' }
    ])
  })

  it.each(formattedEmailCodeBodies)(
    'extracts plain text from $name',
    ({ html, code }) => {
      document.querySelector('.a3s')!.innerHTML = html
      expect(readGmailCodes(document)).toEqual([
        { provider: 'Gmail', sender: 'someone@example.com', code }
      ])
    }
  )

  it('does not read codes from HTML attributes or link destinations', () => {
    document.querySelector('.a3s')!.innerHTML =
      '<p data-code="213456">Your verification code is available <a href="https://example.com/?code=213456">here</a>.</p>'
    expect(readGmailCodes(document)).toEqual([])
  })

  it('does not let deeply nested layout wrappers separate the code from its context', () => {
    document.querySelector('.hP')!.textContent = 'Welcome'
    document.querySelector('.a3s')!.innerHTML =
      '<p>Your verification code:</p>' +
      '<div>'.repeat(50) +
      '<strong>213456</strong>' +
      '</div>'.repeat(50)
    expect(readGmailCodes(document)).toEqual([
      { provider: 'Gmail', sender: 'someone@example.com', code: '213456' }
    ])
  })

  it('does not truncate a longer code split across HTML cells', () => {
    document.querySelector('.a3s')!.innerHTML =
      '<p>Your verification code:</p><table><tr><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td><td>7</td><td>8</td><td>9</td></tr></table>'
    expect(readGmailCodes(document)).toEqual([])
  })

  it('reads unread inbox previews without opening mail', () => {
    document.body.innerHTML = gmailUnreadVerificationEmail
    expect(readGmailCodes(document)).toEqual([
      { provider: 'Gmail', sender: 'login@example.org', code: 'A7B8C9D0' }
    ])
    document.querySelector('tr')!.classList.remove('zE')
    expect(readGmailCodes(document)).toEqual([])
  })

  it('keeps senders separate across conversation messages', () => {
    document
      .querySelector('[role="main"]')!
      .insertAdjacentHTML(
        'beforeend',
        '<div class="adn"><span class="gD" email="other@example.org"></span><div class="a3s">Your login code is 87654321</div></div>'
      )
    expect(
      readGmailCodes(document).map(({ sender, code }) => [sender, code])
    ).toEqual([
      ['someone@example.com', '213456'],
      ['other@example.org', '87654321']
    ])
  })

  it.each([
    '<div class="gmail_quote">Your security code is 765432</div>',
    '<blockquote>Your security code is 765432</blockquote>',
    '<span hidden>Your security code is 765432</span>',
    '<span style="display:none">Your security code is 765432</span>',
    '<span contenteditable="true">Your security code is 765432</span>'
  ])('ignores quoted, hidden and editable content', (html) => {
    document.querySelector('.a3s')!.innerHTML = html
    expect(readGmailCodes(document)).toEqual([])
  })

  it('ignores a hidden email or known old timestamp', () => {
    document.querySelector('.adn')!.setAttribute('hidden', '')
    expect(readGmailCodes(document)).toEqual([])
    document.querySelector('.adn')!.removeAttribute('hidden')
    document
      .querySelector('.gE')!
      .insertAdjacentHTML(
        'beforeend',
        '<span class="g3" title="Wed, Sep 16, 2020, 10:00 AM"></span>'
      )
    expect(readGmailCodes(document)).toEqual([])
  })

  it('requires sender metadata and the Gmail message structure', () => {
    document.querySelector('.gD')!.removeAttribute('email')
    expect(readGmailCodes(document)).toEqual([])
    document.body.innerHTML = '<main>Your verification code is 213456</main>'
    expect(readGmailCodes(document)).toEqual([])
  })

  it('observes late arrivals and text updates without repeatedly notifying', async () => {
    vi.useFakeTimers()
    document.body.innerHTML = '<div role="main"></div>'
    const report = vi.fn().mockResolvedValue(true)
    const stop = observeGmailCodes(document, report)
    await vi.advanceTimersByTimeAsync(350)
    expect(report).not.toHaveBeenCalled()
    document.body.innerHTML = gmailVerificationEmail
    await vi.advanceTimersByTimeAsync(350)
    await vi.waitFor(() => expect(report).toHaveBeenCalledTimes(1))
    document.querySelector('.a3s')!.append(' More email text.')
    await vi.advanceTimersByTimeAsync(350)
    expect(report).toHaveBeenCalledTimes(1)
    document.querySelector('strong')!.textContent = '765432'
    await vi.advanceTimersByTimeAsync(350)
    await vi.waitFor(() =>
      expect(report).toHaveBeenLastCalledWith([
        { provider: 'Gmail', sender: 'someone@example.com', code: '765432' }
      ])
    )
    stop()
    document.querySelector('strong')!.textContent = '111222'
    await vi.advanceTimersByTimeAsync(350)
    expect(report).toHaveBeenCalledTimes(2)
  })
})
