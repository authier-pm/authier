import { observeTotpAccountEmail, readTotpPageEmail } from './totpAccountEmail'

beforeEach(() => {
  document.body.innerHTML = ''
})

it('reads the Microsoft account from visible page text', () => {
  document.body.innerText =
    'Microsoft\n gael@frankobusiness.com\nScan the QR code'
  expect(readTotpPageEmail(document)).toBe('gael@frankobusiness.com')
})

it('recognizes punctuation, plus aliases and repeated occurrences', () => {
  document.body.innerText =
    'Account: (gael+work@frankobusiness.com). Confirm gael+work@frankobusiness.com'
  expect(readTotpPageEmail(document)).toBe('gael+work@frankobusiness.com')
})

it('does not choose arbitrarily between multiple page accounts', () => {
  document.body.innerText = 'one@example.com two@example.com'
  expect(readTotpPageEmail(document)).toBeUndefined()
})

it('prefers a visible filled email input over other page text', () => {
  document.body.innerText = 'support@example.com'
  const input = document.createElement('input')
  input.type = 'email'
  input.value = 'account@example.com'
  document.body.append(input)
  vi.spyOn(input, 'getClientRects').mockReturnValue([
    new DOMRect()
  ] as unknown as DOMRectList)
  expect(readTotpPageEmail(document)).toBe('account@example.com')
})

it('records the latest valid email input across dynamic forms, but never passwords', () => {
  const report = vi.fn()
  const stop = observeTotpAccountEmail(document, report)
  document.body.innerHTML =
    '<input type="email"><input type="password"><input autocomplete="username">'
  const inputs = document.querySelectorAll('input')
  const enter = (index: number, value: string, event = 'input') => {
    inputs[index].value = value
    inputs[index].dispatchEvent(new Event(event, { bubbles: true }))
  }
  enter(0, 'incomplete@')
  enter(1, 'password@example.com')
  expect(report).not.toHaveBeenCalled()
  enter(0, 'first@example.com')
  enter(2, 'last@example.com', 'change')
  expect(report.mock.calls).toEqual([
    ['first@example.com'],
    ['last@example.com']
  ])
  stop()
  enter(0, 'ignored@example.com')
  expect(report).toHaveBeenCalledTimes(2)
})
