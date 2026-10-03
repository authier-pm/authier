import { useEffect, useState } from 'react'
import { startVerificationCodePicker } from '@src/content-script/renderVerificationCodePicker'
import type { VerificationCodeCandidate } from '@src/verification-codes/verificationCodeProtocol'
import { useCodePreviewBackground } from './codePreviewBackground'
import './inlineVerificationCodesPreview.css'

const observeDemoEmail = (
  _document: Document,
  report: (candidates: VerificationCodeCandidate[]) => Promise<unknown>
) => {
  void report([
    { provider: 'Gmail', sender: 'mailer@shopify.com', code: '506731' },
    { provider: 'Gmail', sender: 'mailer@unrelated.example', code: '778899' }
  ])
  return () => undefined
}

const VerificationForm = ({ single }: { single: boolean }) => {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''))
  const [code, setCode] = useState('')
  const verified = single ? code === '506731' : digits.join('') === '506731'
  return (
    <section className="verification-preview__card">
      <div className="verification-preview__mail" aria-hidden>
        <svg
          viewBox="0 0 32 32"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M16 24H6a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3h17a3 3 0 0 1 3 3v6M7 11l8 4 7-4m-2 11 3 3 6-7" />
        </svg>
      </div>
      <h1>Verify your account to continue</h1>
      <p className="verification-preview__description">
        For added security, enter the 6 digit code sent
        <br className="verification-preview__break" /> to demo@example.com.
      </p>
      <div className="verification-preview__inputs" data-code-inputs>
        {single ? (
          <input
            className="verification-preview__single"
            aria-label="Verification code"
            type="text"
            autoComplete="one-time-code"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.currentTarget.value)}
          />
        ) : (
          Array.from({ length: 6 }, (_, index) => (
            <input
              key={index}
              aria-label={`Verification code digit ${index + 1}`}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              maxLength={1}
              value={digits[index]}
              onChange={(event) => {
                const value = event.currentTarget.value
                setDigits((current) =>
                  current.map((digit, slot) => (slot === index ? value : digit))
                )
              }}
            />
          ))
        )}
      </div>
      <p className="verification-preview__resend">
        Didn’t receive a code? <button type="button">Resend code</button>
      </p>
      <p className="verification-preview__status" role="status">
        {verified ? 'Verification code filled' : ''}
      </p>
    </section>
  )
}

export const InlineVerificationCodesPreview = () => {
  const ready = useCodePreviewBackground({
    reportUrl: 'https://mail.google.com/mail/u/0/#inbox',
    reportTabId: 42,
    pageUrl: 'https://admin.shopify.com/challenges/user_verification',
    observe: observeDemoEmail
  })
  const [visible, setVisible] = useState(
    !new URLSearchParams(location.search).has('late')
  )
  const single = new URLSearchParams(location.search).has('single')
  useEffect(() => {
    if (!ready) return
    return startVerificationCodePicker(new Set())
  }, [ready])

  return (
    <main className="verification-preview">
      <p className="verification-preview__caption">
        AUTHIER UI PREVIEW · SHOPIFY VERIFICATION
      </p>
      {visible ? <VerificationForm single={single} /> : null}
      <button
        type="button"
        className="verification-preview__toggle"
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? 'Hide verification form' : 'Show verification form'}
      </button>
    </main>
  )
}
