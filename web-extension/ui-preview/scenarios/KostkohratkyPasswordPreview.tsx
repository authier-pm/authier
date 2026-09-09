import { useEffect } from 'react'
import { autofill } from '@src/content-script/autofill'
import { removePasswordGenerator } from '@src/content-script/renderPasswordGenerator'
import {
  createLargeKostkohratkyFormHtml,
  kostkohratkyRegisterConfirmHtml
} from '../fixtures/kostkohratkyRegisterConfirm'
import './kostkohratkyPasswordPreview.css'

export const KostkohratkyPasswordPreview = () => {
  const html = new URLSearchParams(location.search).has('large-form')
    ? createLargeKostkohratkyFormHtml()
    : kostkohratkyRegisterConfirmHtml
  useEffect(() => {
    const previousLanguage = document.documentElement.lang
    document.documentElement.lang = 'cs'
    const preventSubmit = (event: Event) => event.preventDefault()
    document.addEventListener('submit', preventSubmit)
    const stop = autofill({
      extensionDeviceReady: true,
      autofillEnabled: true,
      webInputs: [],
      secretsForHost: { loginCredentials: [], totpSecrets: [] },
      passwordCount: 0
    })
    return () => {
      stop()
      removePasswordGenerator()
      document.removeEventListener('submit', preventSubmit)
      document.documentElement.lang = previousLanguage
    }
  }, [])

  return (
    <main className="kostkohratky-preview">
      <header>
        <span className="kostkohratky-preview__brand">Kostkohrátky</span>
        <span>Dokončení registrace</span>
      </header>
      <div className="kostkohratky-preview__caption">
        AUTHIER UI PREVIEW · SANITIZED FORM · MOCK CLASSIFIER
      </div>
      <section dangerouslySetInnerHTML={{ __html: html }} />
      <p className="kostkohratky-preview__note">
        Zvolte si nové heslo pro svůj účet.
      </p>
    </main>
  )
}
