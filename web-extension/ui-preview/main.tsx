import { RememberedSessionPreview } from './scenarios/RememberedSessionPreview'
import { type ComponentType } from 'react'
import ReactDOM from 'react-dom/client'
import '@src/index.css'
import { AutofillControlsPreview } from './scenarios/AutofillControlsPreview'

import { PasskeyApprovalPreview } from './scenarios/PasskeyApprovalPreview'
import { PasskeyVaultPreview } from './scenarios/PasskeyVaultPreview'

const DEFAULT_SCENARIO = 'autofill-controls'
const scenarios: Record<string, ComponentType> = {
  [DEFAULT_SCENARIO]: AutofillControlsPreview,
  'remembered-session': RememberedSessionPreview,
  'passkey-vault': PasskeyVaultPreview,
  'passkey-approval': PasskeyApprovalPreview
}
const requestedScenario =
  new URLSearchParams(window.location.search).get('scenario') ??
  DEFAULT_SCENARIO
document.body.classList.toggle(
  'extension-popup',
  !requestedScenario.startsWith('passkey-')
)
const Scenario = scenarios[requestedScenario]

if (!Scenario) {
  throw new Error(`Unknown UI preview scenario: ${requestedScenario}`)
}

ReactDOM.createRoot(document.getElementById('ui-preview')!).render(<Scenario />)
