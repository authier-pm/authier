import { site } from '../config'
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

const researchDatasetCreator = {
  '@type': 'Organization',
  name: 'Authier contributors',
  url: site.githubUrl
} as const

const researchDatasetLicense =
  'https://spdx.org/licenses/AGPL-3.0-or-later.html'

export const createResearchDatasetSchema = (artifact: ResearchArtifact) => ({
  '@type': 'Dataset' as const,
  name: artifact.title,
  description: artifact.description,
  url: `${site.url}${artifact.href}`,
  datePublished: artifact.publishedAt,
  dateModified: artifact.updatedAt,
  creator: researchDatasetCreator,
  license: researchDatasetLicense
})
