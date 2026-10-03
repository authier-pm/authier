import { codeFingerprint } from './codeFingerprint'
import type { VerificationCodeCandidate } from './verificationCodeProtocol'

/** Rescans a web app after DOM changes and reports each new candidate once. */
export const observeRenderedCodes = (
  document: Document,
  read: (document: Document) => VerificationCodeCandidate[],
  report: (candidates: VerificationCodeCandidate[]) => Promise<unknown>,
  attributeFilter: string[]
): (() => void) => {
  const seen = new Set<string>()
  let timer: ReturnType<typeof setTimeout> | undefined
  let stopped = false
  const scan = async () => {
    timer = undefined
    const observed = await Promise.all(
      read(document).map(async (candidate) => ({
        candidate,
        key: await codeFingerprint(JSON.stringify(candidate))
      }))
    )
    if (stopped) return
    const fresh = observed.filter(({ key }) => {
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    // Retain only bounded fingerprints, never a history of plaintext codes.
    for (const key of [...seen].slice(0, Math.max(0, seen.size - 500)))
      seen.delete(key)
    if (!fresh.length) return
    await report(fresh.map(({ candidate }) => candidate)).catch(() => {
      // A temporary background failure may be retried on the next DOM change.
      for (const { key } of fresh) seen.delete(key)
    })
  }
  const schedule = () => {
    if (stopped || timer !== undefined) return
    timer = setTimeout(() => {
      void scan()
    }, 300)
  }
  const observer = new MutationObserver(schedule)
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter
  })
  document.defaultView?.addEventListener('hashchange', schedule)
  schedule()
  return () => {
    stopped = true
    clearTimeout(timer)
    observer.disconnect()
    document.defaultView?.removeEventListener('hashchange', schedule)
  }
}
