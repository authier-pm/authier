import { useEffect, useState } from 'react'
import { fillOtpInputs } from '@src/content-script/fillOtpInputs'
import { h, render } from 'preact'
import { WebInputType } from '@shared/generated/graphqlBaseTypes'
import { PromptPasswordOption } from '@src/content-script/components/PromptPasswordOption'
import type { ILoginSecret } from '@src/util/useDeviceState'
import './bitfinexTotpPreview.css'

const DEMO_CODE = '481502'
const demoLogin = {
  id: 'preview-bitfinex-login',
  createdAt: '2026-01-01T00:00:00Z',
  loginCredentials: {
    username: 'demo@example.com',
    password: 'preview-only',
    label: 'Bitfinex',
    url: 'https://www.bitfinex.com/'
  }
} as ILoginSecret

export function BitfinexTotpPreview() {
  const [step, setStep] = useState<'login' | 'otp'>('login')
  const [code, setCode] = useState('')
  const [verified, setVerified] = useState(false)

  // Match Bitfinex's document-level paste and window-level keydown handlers,
  // including deferred React rendering. No real credentials or network calls.
  useEffect(() => {
    if (step !== 'otp') return
    const paste = (event: ClipboardEvent) => {
      const text = event.clipboardData?.getData('text') ?? ''
      event.preventDefault()
      setTimeout(() => setCode(text.replace(/\D/g, '')), 10)
    }
    const keydown = (event: KeyboardEvent) => {
      if (/^\d$/.test(event.key)) {
        setCode((previous) =>
          previous.length < 6 ? previous + event.key : previous
        )
      } else if (event.key === 'Backspace') {
        setCode((previous) => previous.slice(0, -1))
      }
    }
    document.addEventListener('paste', paste)
    window.addEventListener('keydown', keydown)
    return () => {
      document.removeEventListener('paste', paste)
      window.removeEventListener('keydown', keydown)
    }
  }, [step])

  useEffect(() => {
    // Deliberately broad saved selector: the same path matches the first OTP box.
    const container = document.createElement('div')
    document.body.appendChild(container)
    render(
      h(PromptPasswordOption, {
        container,
        onSelectLogin: () => {},
        loginCredentials: [demoLogin],
        webInputs: [
          {
            kind: WebInputType.USERNAME_OR_EMAIL,
            domPath: '.bitfinex-preview input[type="text"]',
            domOrdinal: 0,
            host: 'www.bitfinex.com',
            url: 'https://www.bitfinex.com/login/',
            createdAt: '2026-01-01'
          }
        ]
      }),
      container
    )
    return () => {
      render(null, container)
      container.remove()
    }
  }, [])

  const fillCode = async () => {
    const inputs = Array.from(
      document.querySelectorAll<HTMLInputElement>('.login__otp-code input')
    )
    const filled = await fillOtpInputs(inputs, DEMO_CODE, new Set())
    setVerified(filled !== null)
  }

  return (
    <main className="bitfinex-preview">
      <div className="preview-caption">
        AUTHIER UI PREVIEW · SYNTHETIC ACCOUNT
      </div>
      {step === 'login' ? (
        <section>
          <h1>Log in</h1>
          <p>Your email or username</p>
          <input
            type="text"
            autoComplete="username"
            defaultValue="demo@example.com"
            aria-label="Username"
          />
          <button onClick={() => setStep('otp')}>
            Continue to two-factor authentication
          </button>
        </section>
      ) : (
        <section className="login__otp">
          <h1>Two-Factor Authentication</h1>
          <p>Please input Bitfinex’s 2FA token from your preferred app</p>
          <div className="login__otp-code">
            {Array.from({ length: 6 }, (_, index) => (
              <div className="otp-code-digit-wraper" key={index}>
                <input
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  autoComplete="off"
                  className="login__otp-code-digit"
                  data-1p-ignore="true"
                  data-lpignore="true"
                  data-bwignore="true"
                  aria-label={`OTP digit ${index + 1}`}
                  value={code[index] ?? ''}
                  onChange={() => {}}
                />
              </div>
            ))}
          </div>
          <p className="recovery-link">
            No access to your authentication app? →
          </p>
          <button onClick={fillCode}>Autofill demo TOTP</button>
          <div role="status">
            {verified
              ? 'Exact code verified · No account selector on TOTP inputs'
              : 'Ready to fill the demo code'}
          </div>
        </section>
      )}
    </main>
  )
}
