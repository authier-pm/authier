import type {
  AutofillSafetyCorpus,
  AutofillSafetyFixture,
  AutofillSafetyObservation,
  AutofillSafetyPhase
} from './schema'

export interface AutofillSafetyAdapter {
  readonly name: string
  mountDocument: (phase: AutofillSafetyPhase) => void
  inspectDocument: (phase: AutofillSafetyPhase) => AutofillSafetyObservation
}

export interface AutofillSafetyPhaseResult {
  readonly fixtureId: string
  readonly phaseId: string
  readonly passed: boolean
  readonly mismatches: readonly string[]
  readonly expected: AutofillSafetyObservation
  readonly actual: AutofillSafetyObservation
}

export interface AutofillSafetyRunReport {
  readonly corpusName: string
  readonly corpusVersion: string
  readonly adapterName: string
  readonly passed: boolean
  readonly fixtureCount: number
  readonly phaseCount: number
  readonly phaseResults: readonly AutofillSafetyPhaseResult[]
}

const compareText = (left: string, right: string): number => {
  if (left < right) {
    return -1
  }
  if (left > right) {
    return 1
  }
  return 0
}

const sortedFixtures = (
  fixtures: readonly AutofillSafetyFixture[]
): AutofillSafetyFixture[] =>
  [...fixtures].sort((left, right) => compareText(left.id, right.id))

const sortedPhases = (
  phases: readonly AutofillSafetyPhase[]
): AutofillSafetyPhase[] =>
  [...phases].sort((left, right) => compareText(left.id, right.id))

const idsMatch = (left: readonly string[], right: readonly string[]) =>
  left.length === right.length &&
  left.every((value, index) => value === right[index])

const compareObservation = (
  expected: AutofillSafetyObservation,
  actual: AutofillSafetyObservation
): string[] => {
  const mismatches: string[] = []

  if (actual.passwordKind !== expected.passwordKind) {
    mismatches.push(
      `passwordKind: expected ${expected.passwordKind}, received ${actual.passwordKind}`
    )
  }

  if (actual.storedPasswordTargetId !== expected.storedPasswordTargetId) {
    mismatches.push(
      `storedPasswordTargetId: expected ${String(expected.storedPasswordTargetId)}, received ${String(actual.storedPasswordTargetId)}`
    )
  }

  if (actual.otpKind !== expected.otpKind) {
    mismatches.push(
      `otpKind: expected ${expected.otpKind}, received ${actual.otpKind}`
    )
  }

  if (!idsMatch(actual.otpTargetIds, expected.otpTargetIds)) {
    mismatches.push(
      `otpTargetIds: expected [${expected.otpTargetIds.join(', ')}], received [${actual.otpTargetIds.join(', ')}]`
    )
  }

  return mismatches
}

const assertUniqueIds = (corpus: AutofillSafetyCorpus): void => {
  const fixtureIds = new Set<string>()
  const phaseIds = new Set<string>()

  for (const fixture of corpus.fixtures) {
    if (fixtureIds.has(fixture.id)) {
      throw new Error(`Duplicate fixture id: ${fixture.id}`)
    }
    fixtureIds.add(fixture.id)

    for (const phase of fixture.phases) {
      const qualifiedPhaseId = `${fixture.id}/${phase.id}`
      if (phaseIds.has(qualifiedPhaseId)) {
        throw new Error(`Duplicate phase id: ${qualifiedPhaseId}`)
      }
      phaseIds.add(qualifiedPhaseId)
    }
  }
}

/**
 * Runs fixtures in stable identifier order and emits no timestamps, randomness,
 * or environment-dependent metadata, so identical observations yield an
 * identical report.
 */
export const runAutofillSafetyCorpus = (
  corpus: AutofillSafetyCorpus,
  adapter: AutofillSafetyAdapter
): AutofillSafetyRunReport => {
  assertUniqueIds(corpus)

  const phaseResults: AutofillSafetyPhaseResult[] = []

  for (const fixture of sortedFixtures(corpus.fixtures)) {
    for (const phase of sortedPhases(fixture.phases)) {
      adapter.mountDocument(phase)
      const actual = adapter.inspectDocument(phase)
      const mismatches = compareObservation(phase.expected, actual)

      phaseResults.push({
        fixtureId: fixture.id,
        phaseId: phase.id,
        passed: mismatches.length === 0,
        mismatches,
        expected: phase.expected,
        actual
      })
    }
  }

  return {
    corpusName: corpus.name,
    corpusVersion: corpus.version,
    adapterName: adapter.name,
    passed: phaseResults.every((result) => result.passed),
    fixtureCount: corpus.fixtures.length,
    phaseCount: phaseResults.length,
    phaseResults
  }
}
