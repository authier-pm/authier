import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { webcrypto } from 'node:crypto'
import {
  googleMessagesInbox,
  googleMessagesNewConversation,
  message
} from '../../ui-preview/fixtures/googleMessagesConversation'
import {
  observeGoogleMessagesCodes,
  readGoogleMessagesCodes
} from './readGoogleMessagesCodes'

const sms = (sender: string, code: string) => ({
  provider: 'Google Messages',
  sender,
  code
})

describe('Google Messages for Web code detection', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'crypto', {
      value: webcrypto,
      configurable: true
    })
    document.body.innerHTML = googleMessagesInbox
  })
  afterEach(() => {
    document.body.innerHTML = ''
    vi.useRealTimers()
  })

  it('reads unread previews and only the newest message of the open thread', () => {
    expect(readGoogleMessagesCodes(document)).toEqual([
      sms('AirBank', '474230'),
      sms('Google', '482913')
    ])
  })

  it('ignores read previews and a reply sent after the code', () => {
    document
      .querySelector('a[data-e2e-is-unread="true"]')!
      .setAttribute('data-e2e-is-unread', 'false')
    document
      .querySelector('mws-messages-list')!
      .insertAdjacentHTML('beforeend', message('Thanks, code 654321', true))
    expect(readGoogleMessagesCodes(document)).toEqual([])
  })

  it('ignores hidden conversations and messages without a named sender', () => {
    document
      .querySelector('mws-conversation-list-item')!
      .setAttribute('hidden', '')
    document.querySelector('a.selected')!.classList.remove('selected')
    expect(readGoogleMessagesCodes(document)).toEqual([])
  })

  it('reports a newly arrived conversation once while the tab stays open', async () => {
    vi.useFakeTimers()
    const report = vi.fn().mockResolvedValue(true)
    const stop = observeGoogleMessagesCodes(document, report)
    await vi.advanceTimersByTimeAsync(350)
    await vi.waitFor(() => expect(report).toHaveBeenCalledTimes(1))
    document
      .querySelector('.conv-container')!
      .insertAdjacentHTML('afterbegin', googleMessagesNewConversation)
    await vi.advanceTimersByTimeAsync(350)
    await vi.waitFor(() =>
      expect(report).toHaveBeenLastCalledWith([sms('+420 777 123 456', '5821')])
    )
    document.querySelector('mws-relative-timestamp')!.textContent = '1 min'
    await vi.advanceTimersByTimeAsync(350)
    expect(report).toHaveBeenCalledTimes(2)
    stop()
  })
})
