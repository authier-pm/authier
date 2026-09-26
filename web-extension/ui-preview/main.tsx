import { AndroidNotificationsPreview } from './scenarios/AndroidNotificationsPreview'
import {
  MasterDeviceRecoveryPreview,
  MasterDeviceResetProgressPreview
} from './scenarios/MasterDeviceRecoveryPreview'
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
  AndroidUpdatesPreview,
  SeptemberReleaseBlogPreview
} from './scenarios/AndroidUpdatesPreview'
import { BitfinexTotpPreview } from './scenarios/BitfinexTotpPreview'
import { KostkohratkyPasswordPreview } from './scenarios/KostkohratkyPasswordPreview'

import { PasskeyApprovalPreview } from './scenarios/PasskeyApprovalPreview'
import { PasskeyVaultPreview } from './scenarios/PasskeyVaultPreview'
import { EmailVerificationCodesPreview } from './scenarios/EmailVerificationCodesPreview'
import { NewDevicePolicyPreview } from './scenarios/NewDevicePolicyPreview'
import { TotpLabelsPreview } from './scenarios/TotpLabelsPreview'

const DEFAULT_SCENARIO = 'autofill-controls'
const scenarios: Record<string, ComponentType> = {
  [DEFAULT_SCENARIO]: AutofillControlsPreview,
  'new-device-policy': NewDevicePolicyPreview,
  'master-device-recovery': MasterDeviceRecoveryPreview,
  'master-device-reset-progress': MasterDeviceResetProgressPreview,
  'remembered-session': RememberedSessionPreview,
  'passkey-vault': PasskeyVaultPreview,
  'passkey-approval': PasskeyApprovalPreview,
  'email-verification-codes': EmailVerificationCodesPreview,
  'android-vault': AndroidVaultPreview,
  'android-notifications': AndroidNotificationsPreview,
  'android-icon': AndroidIconPreview,
  'android-updates': AndroidUpdatesPreview,
  'android-blog': AndroidBlogPreview,
  'september-release-blog': SeptemberReleaseBlogPreview,
  'android-landing': AndroidLandingPreview,
  'bitfinex-totp': BitfinexTotpPreview,
  'totp-labels': TotpLabelsPreview,
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
  !requestedScenario.startsWith('master-device-') &&
    requestedScenario !== 'new-device-policy' &&
    !requestedScenario.startsWith('android-') &&
    requestedScenario !== 'bitfinex-totp' &&
    requestedScenario !== 'totp-labels' &&
    requestedScenario !== 'kostkohratky-password' &&
    requestedScenario !== 'email-verification-codes' &&
    requestedScenario !== 'september-release-blog' &&
    !requestedScenario.startsWith('passkey-')
)

ReactDOM.createRoot(document.getElementById('ui-preview')!).render(<Scenario />)
