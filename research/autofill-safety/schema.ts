export const OPEN_AUTOFILL_SAFETY_CORPUS_NAME =
  'Open Autofill Safety Corpus' as const

export const OPEN_AUTOFILL_SAFETY_CORPUS_VERSION = '1.0.0' as const

export type AutofillSafetyCategory =
  | 'password-only-login'
  | 'signup-no-fill'
  | 'change-password-no-fill'
  | 'otp-versus-code-traps'
  | 'ambiguity'
  | 'dynamic-replacement'

export type AutofillSafetyPasswordKind =
  | 'login'
  | 'signup'
  | 'change-password'
  | 'unknown'
  | 'none'

export type AutofillSafetyOtpKind = 'single' | 'segmented' | 'none'

export interface AutofillSafetyDocument {
  readonly url: string
  readonly language: string | null
  readonly bodyHtml: string
  /** The length of the synthetic TOTP value an adapter should look for. */
  readonly otpCodeLength: number
}

export interface AutofillSafetyObservation {
  readonly passwordKind: AutofillSafetyPasswordKind
  /** Null means a stored password must not be written in this phase. */
  readonly storedPasswordTargetId: string | null
  readonly otpKind: AutofillSafetyOtpKind
  /** Empty means a TOTP value must not be written in this phase. */
  readonly otpTargetIds: readonly string[]
}

export interface AutofillSafetyPhase {
  readonly id: string
  readonly description: string
  readonly document: AutofillSafetyDocument
  readonly expected: AutofillSafetyObservation
}

export interface AutofillSafetyFixture {
  readonly id: string
  readonly title: string
  readonly category: AutofillSafetyCategory
  readonly provenance: 'synthetic'
  readonly phases: readonly AutofillSafetyPhase[]
}

export interface AutofillSafetyCorpus {
  readonly name: typeof OPEN_AUTOFILL_SAFETY_CORPUS_NAME
  readonly version: typeof OPEN_AUTOFILL_SAFETY_CORPUS_VERSION
  readonly limitations: readonly string[]
  readonly fixtures: readonly AutofillSafetyFixture[]
}
