import { blogPosts } from '../data/blog'
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
  const items = blogPosts
    .map(
      (post) => `<item>
  <title>${escapeXml(post.title)}</title>
  <link>${site.url}${post.href}</link>
  <guid isPermaLink="true">${site.url}${post.href}</guid>
  <description>${escapeXml(post.description)}</description>
  <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
</item>`
    )
    .join('\n')

  const body = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
  <title>Authier password manager blog</title>
  <link>${site.url}/blog</link>
  <description>${escapeXml(site.description)}</description>
  <language>en</language>
  <lastBuildDate>${new Date(blogPosts[0].updatedAt).toUTCString()}</lastBuildDate>
${items}
</channel>
</rss>`

  return new Response(body, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8'
    }
  })
}
