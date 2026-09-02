import { type ComponentType } from 'react'
import ReactDOM from 'react-dom/client'
import '@src/index.css'
import { AutofillControlsPreview } from './scenarios/AutofillControlsPreview'

const DEFAULT_SCENARIO = 'autofill-controls'
const scenarios: Record<string, ComponentType> = {
  [DEFAULT_SCENARIO]: AutofillControlsPreview
}
const requestedScenario =
  new URLSearchParams(window.location.search).get('scenario') ??
  DEFAULT_SCENARIO
const Scenario = scenarios[requestedScenario]

if (!Scenario) {
  throw new Error(`Unknown UI preview scenario: ${requestedScenario}`)
}

ReactDOM.createRoot(document.getElementById('ui-preview')!).render(<Scenario />)
