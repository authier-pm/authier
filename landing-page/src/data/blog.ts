import type { ContentEntry } from './content'

export type BlogPost = ContentEntry

export const blogPosts = [
  {
    title: 'Authier vs Bitwarden: an honest comparison',
    description:
      'A practical Authier vs Bitwarden comparison with UI screenshots, covering device approval, maturity, audits, encryption, and who each password manager suits.',
    href: '/blog/authier-vs-bitwarden',
    publishedAt: '2023-02-23',
    updatedAt: '2026-08-31',
    readingTime: '7 min read',
    category: 'Comparison'
  },
  {
    title: 'Liftoff: why we built Authier',
    description:
      'The original launch note from the team after almost two years of building an open-source password manager, and the thinking behind it.',
    href: '/blog/launch',
    publishedAt: '2023-02-04',
    updatedAt: '2026-08-31',
    readingTime: '2 min read',
    category: 'Company'
  }
] as const satisfies readonly BlogPost[]
