import { RememberedSessionPreview } from './scenarios/RememberedSessionPreview'
import { type ComponentType } from 'react'
import ReactDOM from 'react-dom/client'
import '@src/index.css'
import { AutofillControlsPreview } from './scenarios/AutofillControlsPreview'
import { AndroidVaultPreview } from './scenarios/AndroidVaultPreview'
import { AndroidIconPreview } from './scenarios/AndroidIconPreview'
import {
  AndroidLandingPreview,
  AndroidBlogPreview,
  AndroidUpdatesPreview
} from './scenarios/AndroidUpdatesPreview'
import { BitfinexTotpPreview } from './scenarios/BitfinexTotpPreview'
import { KostkohratkyPasswordPreview } from './scenarios/KostkohratkyPasswordPreview'

import { PasskeyApprovalPreview } from './scenarios/PasskeyApprovalPreview'
import { PasskeyVaultPreview } from './scenarios/PasskeyVaultPreview'

const DEFAULT_SCENARIO = 'autofill-controls'
const scenarios: Record<string, ComponentType> = {
  [DEFAULT_SCENARIO]: AutofillControlsPreview,
  'remembered-session': RememberedSessionPreview,
  'passkey-vault': PasskeyVaultPreview,
  'passkey-approval': PasskeyApprovalPreview,
  'android-vault': AndroidVaultPreview,
  'android-icon': AndroidIconPreview,
  'android-updates': AndroidUpdatesPreview,
  'android-blog': AndroidBlogPreview,
  'android-landing': AndroidLandingPreview,
  'bitfinex-totp': BitfinexTotpPreview,
  'kostkohratky-password': KostkohratkyPasswordPreview
}
const requestedScenario =
  new URLSearchParams(window.location.search).get('scenario') ??
  DEFAULT_SCENARIO
const Scenario = scenarios[requestedScenario]

if (!Scenario) {
  throw new Error(`Unknown UI preview scenario: ${requestedScenario}`)
}

document.body.classList.toggle(
  'extension-popup',
  !requestedScenario.startsWith('android-') &&
    requestedScenario !== 'bitfinex-totp' &&
    requestedScenario !== 'kostkohratky-password' &&
    !requestedScenario.startsWith('passkey-')
)

ReactDOM.createRoot(document.getElementById('ui-preview')!).render(<Scenario />)
