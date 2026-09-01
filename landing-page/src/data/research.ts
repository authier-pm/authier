import type { ContentEntry } from './content'

export type ResearchArtifact = ContentEntry

export const researchArtifacts = [
  {
    title: 'Open Autofill Safety Corpus v1',
    description:
      'A typed, machine-readable set of synthetic login, password-change, OTP, ambiguity, and dynamic-form cases for testing conservative autofill decisions.',
    href: '/research/autofill-safety-corpus',
    publishedAt: '2026-09-01',
    updatedAt: '2026-09-01',
    readingTime: '7 min read',
    category: 'Research artifact'
  }
] as const satisfies readonly ResearchArtifact[]
