import { blogPosts } from '../data/blog'
import { guides } from '../data/guides'
import { researchArtifacts } from '../data/research'
import { site } from '../config'

export const prerender = true

const escapeXml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')

export function GET() {
  const entries = [...blogPosts, ...guides, ...researchArtifacts].sort(
    (left, right) =>
      new Date(right.publishedAt).getTime() -
      new Date(left.publishedAt).getTime()
  )
  const latestUpdatedAt = entries.reduce(
    (latest, entry) => Math.max(latest, new Date(entry.updatedAt).getTime()),
    0
  )
  const items = entries
    .map(
      (post) => `<item>
  <title>${escapeXml(post.title)}</title>
  <link>${site.url}${post.href}</link>
  <guid isPermaLink="true">${site.url}${post.href}</guid>
  <description>${escapeXml(post.description)}</description>
  <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
  <category>${escapeXml(post.category)}</category>
</item>`
    )
    .join('\n')

  const body = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>Authier articles, guides, and research</title>
  <link>${site.url}/</link>
  <atom:link href="${site.url}/rss.xml" rel="self" type="application/rss+xml" />
  <description>${escapeXml(site.description)}</description>
  <language>en</language>
  <lastBuildDate>${new Date(latestUpdatedAt).toUTCString()}</lastBuildDate>
${items}
</channel>
</rss>`

  return new Response(body, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8'
    }
  })
}
