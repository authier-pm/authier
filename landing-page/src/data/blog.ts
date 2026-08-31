export interface BlogPost {
  title: string
  description: string
  href: string
  publishedAt: string
  updatedAt: string
  readingTime: string
  category: string
}

export const blogPosts = [
  {
    title: 'Authier vs Bitwarden: an honest comparison',
    description:
      'A practical comparison of two open-source password managers, including device approval, maturity, audits, encryption, and who each project suits.',
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
