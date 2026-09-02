import type {
  AutofillSafetyCorpus,
  AutofillSafetyFixture,
  AutofillSafetyObservation,
  AutofillSafetyPhase
} from '../../../research/autofill-safety'

const allowedFixtureTags = new Set([
  'button',
  'div',
  'form',
  'h1',
  'input',
  'label',
  'main'
])

const safeIdentifierPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const safeLanguagePattern = /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i
const activeAttributePattern =
  /\s(?:action|autofocus|contenteditable|formaction|href|src|srcdoc|style)\s*=/i
const eventAttributePattern = /\son[a-z0-9_-]+\s*=/i

export interface AutofillPlaygroundPhase {
  readonly key: string
  readonly fixtureId: string
  readonly fixtureTitle: string
  readonly fixtureCategory: AutofillSafetyFixture['category']
  readonly phase: AutofillSafetyPhase
  readonly expected: AutofillSafetyObservation
  readonly frameDocument: string
}

const assertSafeIdentifier = (value: string, label: string): void => {
  if (!safeIdentifierPattern.test(value)) {
    throw new Error(`Unsafe ${label}: ${value}`)
  }
}

const collectMarkupIds = (markup: string): ReadonlySet<string> => {
  const ids = new Set<string>()

  for (const match of markup.matchAll(/\sid\s*=\s*"([^"]+)"/gi)) {
    const id = match[1]

    if (!id) {
      throw new Error('Fixture markup contains an empty id attribute')
    }

    if (ids.has(id)) {
      throw new Error(`Fixture markup contains duplicate id: ${id}`)
    }

    ids.add(id)
  }

  return ids
}

const assertExpectedTargetsExist = (
  phase: AutofillSafetyPhase,
  markupIds: ReadonlySet<string>
): void => {
  const passwordTargetId = phase.expected.storedPasswordTargetId

  if (passwordTargetId && !markupIds.has(passwordTargetId)) {
    throw new Error(
      `Missing stored-password target ${passwordTargetId} in ${phase.id}`
    )
  }

  for (const otpTargetId of phase.expected.otpTargetIds) {
    if (!markupIds.has(otpTargetId)) {
      throw new Error(`Missing OTP target ${otpTargetId} in ${phase.id}`)
    }
  }
}

const assertSyntheticFixtureMarkup = (phase: AutofillSafetyPhase): void => {
  assertSafeIdentifier(phase.id, 'phase id')

  const fixtureUrl = new URL(phase.document.url)

  if (
    fixtureUrl.protocol !== 'https:' ||
    fixtureUrl.hostname !== 'synthetic.invalid'
  ) {
    throw new Error(
      `Fixture URL must use https://synthetic.invalid: ${fixtureUrl}`
    )
  }

  const language = phase.document.language ?? 'en'

  if (!safeLanguagePattern.test(language)) {
    throw new Error(`Unsafe fixture language: ${language}`)
  }

  const markup = phase.document.bodyHtml.trim()

  if (!markup) {
    throw new Error(`Fixture phase ${phase.id} has no markup`)
  }

  if (markup.includes('<!') || markup.includes('<?') || markup.includes('<%')) {
    throw new Error(`Fixture phase ${phase.id} contains unsupported markup`)
  }

  if (
    activeAttributePattern.test(markup) ||
    eventAttributePattern.test(markup)
  ) {
    throw new Error(`Fixture phase ${phase.id} contains an active attribute`)
  }

  for (const match of markup.matchAll(/<\/?\s*([a-z][a-z0-9-]*)\b[^>]*>/gi)) {
    const tagName = match[1]?.toLowerCase()

    if (!tagName || !allowedFixtureTags.has(tagName)) {
      throw new Error(
        `Fixture phase ${phase.id} contains unsupported tag: ${tagName ?? 'unknown'}`
      )
    }
  }

  const textWithoutTags = markup.replace(
    /<\/?\s*([a-z][a-z0-9-]*)\b[^>]*>/gi,
    ''
  )

  if (textWithoutTags.includes('<') || textWithoutTags.includes('>')) {
    throw new Error(`Fixture phase ${phase.id} contains malformed markup`)
  }

  const markupIds = collectMarkupIds(markup)
  assertExpectedTargetsExist(phase, markupIds)
}

export const createAutofillFixtureDocument = (
  phase: AutofillSafetyPhase
): string => {
  assertSyntheticFixtureMarkup(phase)

  const language = phase.document.language ?? 'en'
  const bodyHtml = phase.document.bodyHtml.trim()

  return `<!doctype html>
<html lang="${language}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'none'; style-src 'unsafe-inline'; form-action 'none'; base-uri 'none'"
    />
    <style>
      :root {
        color-scheme: light;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      * {
        box-sizing: border-box;
      }

      body {
        min-width: 260px;
        margin: 0;
        padding: clamp(24px, 7vw, 64px);
        background: #f4f8f7;
        color: #14211f;
      }

      main,
      form,
      #otp-code-widget {
        width: min(100%, 520px);
      }

      main,
      form {
        display: grid;
        gap: 16px;
      }

      main > form {
        width: 100%;
      }

      h1 {
        margin: 0 0 6px;
        font-size: clamp(1.55rem, 4vw, 2.15rem);
        letter-spacing: -0.04em;
      }

      label {
        margin-bottom: -8px;
        color: #344743;
        font-size: 0.88rem;
        font-weight: 650;
      }

      input {
        width: 100%;
        min-height: 48px;
        padding: 0 14px;
        border: 1px solid #b8c8c4;
        border-radius: 10px;
        background: #ffffff;
        color: #14211f;
        outline: none;
      }

      input:focus {
        border-color: #188d77;
        box-shadow: 0 0 0 3px rgba(24, 141, 119, 0.14);
      }

      button {
        min-height: 46px;
        padding: 0 18px;
        border: 0;
        border-radius: 10px;
        background: #126c5a;
        color: #ffffff;
        font-weight: 720;
      }

      #otp-code-widget {
        display: grid;
        grid-template-columns: repeat(6, minmax(34px, 54px));
        gap: 8px;
      }

      #otp-code-widget input {
        padding: 0;
        text-align: center;
      }

      @media (max-width: 430px) {
        #otp-code-widget {
          grid-template-columns: repeat(3, minmax(44px, 1fr));
        }
      }
    </style>
  </head>
  <body>
    ${bodyHtml}
  </body>
</html>`
}

export const createAutofillPlaygroundPhases = (
  corpus: AutofillSafetyCorpus
): readonly AutofillPlaygroundPhase[] => {
  const records = corpus.fixtures.flatMap((fixture) => {
    assertSafeIdentifier(fixture.id, 'fixture id')

    return fixture.phases.map((phase) => ({
      key: `${fixture.id}--${phase.id}`,
      fixtureId: fixture.id,
      fixtureTitle: fixture.title,
      fixtureCategory: fixture.category,
      phase,
      expected: phase.expected,
      frameDocument: createAutofillFixtureDocument(phase)
    }))
  })

  const keys = new Set<string>()

  for (const record of records) {
    if (keys.has(record.key)) {
      throw new Error(`Duplicate playground phase key: ${record.key}`)
    }

    keys.add(record.key)
  }

  return records
}
