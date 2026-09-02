import { describe, expect, test } from 'bun:test'
import {
  openAutofillSafetyCorpusV1,
  type AutofillSafetyPhase
} from '../../../research/autofill-safety'
import {
  createAutofillFixtureDocument,
  createAutofillPlaygroundPhases
} from './autofillPlayground'

const safePhase = openAutofillSafetyCorpusV1.fixtures[0].phases[0]

describe('autofill playground documents', () => {
  test('builds all corpus phases into sandbox-ready documents', () => {
    const phases = createAutofillPlaygroundPhases(openAutofillSafetyCorpusV1)

    expect(phases).toHaveLength(12)
    expect(new Set(phases.map((phase) => phase.key)).size).toBe(12)

    for (const phase of phases) {
      expect(phase.frameDocument).toContain(
        "default-src 'none'; style-src 'unsafe-inline'; form-action 'none'"
      )
      expect(phase.frameDocument).toContain(
        phase.phase.document.bodyHtml.trim()
      )
    }
  })

  test('rejects active markup before it reaches srcdoc', () => {
    const unsafePhase = {
      ...safePhase,
      document: {
        ...safePhase.document,
        bodyHtml:
          '<form action="https://example.com"><input id="login-password" /></form>'
      }
    } satisfies AutofillSafetyPhase

    expect(() => createAutofillFixtureDocument(unsafePhase)).toThrow(
      'contains an active attribute'
    )
  })

  test('rejects a target that is missing from the fixture markup', () => {
    const missingTargetPhase = {
      ...safePhase,
      expected: {
        ...safePhase.expected,
        storedPasswordTargetId: 'missing-password'
      }
    } satisfies AutofillSafetyPhase

    expect(() => createAutofillFixtureDocument(missingTargetPhase)).toThrow(
      'Missing stored-password target missing-password'
    )
  })
})
