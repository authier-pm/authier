import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type {
  AsyncAutofillSafetyAdapter,
  AutofillSafetyAdapter,
  AutofillSafetyObservation,
  AutofillSafetyPasswordKind,
  AutofillSafetyPhase
} from '../../../research/autofill-safety'
import {
  openAutofillSafetyCorpusV1,
  runAutofillSafetyCorpus,
  runAutofillSafetyCorpusAsync
} from '../../../research/autofill-safety'
import {
  classifyPasswordForm,
  PasswordFormKind,
  resetLanguageCache
} from './classifyPasswordForm'
import { findSegmentedOtpInputs, findSingleOtpInput } from './findOtpInputs'
import { selectStoredPasswordAutofillTarget } from './storedPasswordAutofillPolicy'

const originalLocation = { ...window.location }

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get: () => 10
  })
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get: () => 10
  })
})

afterAll(() => {
  Object.assign(window.location, originalLocation)
})

beforeEach(() => {
  document.body.innerHTML = ''
  document.documentElement.setAttribute('lang', 'en')
  resetLanguageCache()
})

const setUrl = (url: string): void => {
  const parsed = new URL(url)
  Object.assign(window.location, {
    href: parsed.href,
    pathname: parsed.pathname,
    search: parsed.search,
    host: parsed.host,
    hostname: parsed.hostname,
    origin: parsed.origin,
    protocol: parsed.protocol
  })
}

const mountDocument = (phase: AutofillSafetyPhase): void => {
  setUrl(phase.document.url)

  if (phase.document.language === null) {
    document.documentElement.removeAttribute('lang')
  } else {
    document.documentElement.setAttribute('lang', phase.document.language)
  }

  document.body.innerHTML = phase.document.bodyHtml
  resetLanguageCache()
}

const mapPasswordKind = (
  kind: PasswordFormKind
): AutofillSafetyPasswordKind => {
  switch (kind) {
    case PasswordFormKind.LOGIN:
      return 'login'
    case PasswordFormKind.SIGNUP:
      return 'signup'
    case PasswordFormKind.CHANGE_PASSWORD:
      return 'change-password'
    case PasswordFormKind.UNKNOWN:
      return 'unknown'
  }
}

const inspectDocument = (
  phase: AutofillSafetyPhase
): AutofillSafetyObservation => {
  const inputs = Array.from(
    document.querySelectorAll<HTMLInputElement>('input')
  )
  const passwordInput = inputs.find((input) => input.type === 'password')

  let passwordKind: AutofillSafetyPasswordKind = 'none'
  let storedPasswordTargetId: string | null = null

  if (passwordInput) {
    const classification = classifyPasswordForm(passwordInput)
    passwordKind = mapPasswordKind(classification.kind)
    storedPasswordTargetId =
      selectStoredPasswordAutofillTarget(classification)?.id ?? null
  }

  const segmentedOtp = findSegmentedOtpInputs(
    inputs,
    phase.document.otpCodeLength
  )
  if (segmentedOtp) {
    return {
      passwordKind,
      storedPasswordTargetId,
      otpKind: 'segmented',
      otpTargetIds: segmentedOtp.inputs.map((input) => input.id)
    }
  }

  const singleOtp = findSingleOtpInput(inputs, phase.document.otpCodeLength)
  if (singleOtp) {
    return {
      passwordKind,
      storedPasswordTargetId,
      otpKind: 'single',
      otpTargetIds: [singleOtp.input.id]
    }
  }

  return {
    passwordKind,
    storedPasswordTargetId,
    otpKind: 'none',
    otpTargetIds: []
  }
}

const authierAdapter: AutofillSafetyAdapter = {
  name: 'Authier production classifiers and stored-password target policy',
  mountDocument,
  inspectDocument
}

const asyncAuthierAdapter: AsyncAutofillSafetyAdapter = {
  name: authierAdapter.name,
  mountDocument: (phase) => Promise.resolve(mountDocument(phase)),
  inspectDocument: (phase) => Promise.resolve(inspectDocument(phase))
}

describe('Open Autofill Safety Corpus v1 adapter', () => {
  it('matches every synthetic safety expectation', () => {
    const report = runAutofillSafetyCorpus(
      openAutofillSafetyCorpusV1,
      authierAdapter
    )

    expect(report.fixtureCount).toBe(6)
    expect(report.phaseCount).toBe(12)
    expect(report.phaseResults.filter((result) => !result.passed)).toEqual([])
    expect(report.passed).toBe(true)
  })

  it('produces the same report on repeated runs', () => {
    const first = runAutofillSafetyCorpus(
      openAutofillSafetyCorpusV1,
      authierAdapter
    )
    const second = runAutofillSafetyCorpus(
      openAutofillSafetyCorpusV1,
      authierAdapter
    )

    expect(second).toEqual(first)
  })

  it('produces the same ordered report through an async adapter', async () => {
    const synchronous = runAutofillSafetyCorpus(
      openAutofillSafetyCorpusV1,
      authierAdapter
    )
    const asynchronous = await runAutofillSafetyCorpusAsync(
      openAutofillSafetyCorpusV1,
      asyncAuthierAdapter
    )

    expect(asynchronous).toEqual(synchronous)
  })
})
