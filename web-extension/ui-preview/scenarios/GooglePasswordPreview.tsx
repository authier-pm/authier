import { useEffect, useState } from 'react'
import { WebInputType } from '@shared/generated/graphqlBaseTypes'
import {
  autofill,
  resetAutofillStateForThisPage
} from '@src/content-script/autofill'
import { startBodyInputChangeObserver } from '@src/content-script/domMutationObserver'
import { removeLoginCredOption } from '@src/content-script/renderLoginCredOption'
import {
  googlePasswordChallengeHtml,
  googlePreviewLogins
} from '../fixtures/googlePasswordChallenge'
import './googlePasswordPreview.css'

const query = new URLSearchParams(location.search)
const selectedIdentity = !query.has('no-identity')
const initiallyVisible = !query.has('late')
const challengeHtml = googlePasswordChallengeHtml(selectedIdentity)
const staleWebInputs = query.has('stale-selector')
  ? [
      {
        createdAt: '2026-01-01T00:00:00Z',
        domPath: '[autocomplete="current-password"]',
        domOrdinal: 0,
        host: 'accounts.google.com',
        url: 'https://accounts.google.com/v3/signin/challenge/pwd',
        kind: WebInputType.PASSWORD
      }
    ]
  : []

export const GooglePasswordPreview = () => {
  const [visible, setVisible] = useState(initiallyVisible)
  const [replacement, setReplacement] = useState(0)
  const [submissions, setSubmissions] = useState(0)

  useEffect(() => {
    resetAutofillStateForThisPage()
    const observer = startBodyInputChangeObserver()
    const stop = autofill({
      extensionDeviceReady: true,
      autofillEnabled: true,
      webInputs: staleWebInputs,
      secretsForHost: {
        loginCredentials: googlePreviewLogins,
        totpSecrets: []
      },
      passwordCount: googlePreviewLogins.length
    })
    const mountTimer = initiallyVisible
      ? undefined
      : window.setTimeout(() => setVisible(true), 900)
    const preventSubmit = (event: Event) => {
      event.preventDefault()
      setSubmissions((count) => count + 1)
    }
    document.addEventListener('submit', preventSubmit)
    return () => {
      window.clearTimeout(mountTimer)
      stop()
      observer.disconnect()
      removeLoginCredOption()
      resetAutofillStateForThisPage()
      document.removeEventListener('submit', preventSubmit)
    }
  }, [])

  return (
    <main className="google-password-preview">
      <p className="google-password-preview__caption">
        AUTHIER UI PREVIEW · GOOGLE PASSWORD CHALLENGE · 10 SYNTHETIC ACCOUNTS
      </p>
      <section className="google-password-preview__card">
        {visible ? (
          <div
            key={replacement}
            className="google-password-preview__challenge"
            dangerouslySetInnerHTML={{ __html: challengeHtml }}
          />
        ) : (
          <p>Loading the password challenge…</p>
        )}
      </section>
      <footer className="google-password-preview__footer">
        <span role="status">Form submissions: {submissions}</span>
        <button
          type="button"
          onClick={() => setReplacement((count) => count + 1)}
        >
          Replace password form
        </button>
      </footer>
    </main>
  )
}
