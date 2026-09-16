const excludedContent =
  'script, style, noscript, blockquote, .gmail_quote, .gmail_attr, [contenteditable="true"], [role="textbox"]'
const blockTags = new Set([
  'ADDRESS',
  'ARTICLE',
  'DIV',
  'FOOTER',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'HEADER',
  'LI',
  'OL',
  'P',
  'PRE',
  'SECTION',
  'TABLE',
  'TR',
  'UL'
])
const blockDisplays = new Set([
  'block',
  'flex',
  'grid',
  'list-item',
  'table',
  'table-row'
])
const MAX_EMAIL_TEXT_LENGTH = 32_000

/** Read rendered text without changing Gmail's DOM or inspecting HTML strings.
 * Inline markup stays joined, paragraphs/line breaks stay separated, and table
 * cells become tabs. The extractor can then handle formatting as plain text.
 */
export const createEmailTextReader = () => {
  // A new reader is created for each scan, so visibility cannot go stale.
  const styles = new WeakMap<Element, CSSStyleDeclaration | undefined>()
  const visibility = new WeakMap<Element, boolean>()
  const getStyle = (element: Element) => {
    if (!styles.has(element)) {
      styles.set(
        element,
        element.ownerDocument.defaultView?.getComputedStyle(element)
      )
    }
    return styles.get(element)
  }
  const isRendered = (element: Element): boolean => {
    const path: Element[] = []
    let visible = true
    for (
      let current: Element | null = element;
      current;
      current = current.parentElement
    ) {
      const cached = visibility.get(current)
      if (cached !== undefined) {
        visible = cached
        break
      }
      path.push(current)
      const style = getStyle(current)
      if (
        current.hasAttribute('hidden') ||
        current.getAttribute('aria-hidden') === 'true' ||
        style?.display === 'none' ||
        style?.visibility === 'hidden' ||
        style?.visibility === 'collapse'
      ) {
        visible = false
        break
      }
    }
    for (const current of path) visibility.set(current, visible)
    // Background tabs remain eligible: do not check document.visibilityState.
    return visible
  }

  const readText = (element: Element | null): string => {
    if (!element || element.closest(excludedContent) || !isRendered(element))
      return ''
    const parts: string[] = []
    let length = 0
    let visited = 0
    const append = (text: string) => {
      const part = text.slice(0, MAX_EMAIL_TEXT_LENGTH - length)
      parts.push(part)
      length += part.length
    }
    const visit = (node: Node, depth: number) => {
      if (length >= MAX_EMAIL_TEXT_LENGTH || ++visited > 20_000 || depth > 256)
        return
      if (node.nodeType === Node.TEXT_NODE) {
        append(node.textContent ?? '')
        return
      }
      if (
        !(node instanceof Element) ||
        node.matches(excludedContent) ||
        !isRendered(node)
      )
        return
      if (node.tagName === 'BR') {
        append('\n')
        return
      }
      const isCell =
        node.tagName === 'TD' ||
        node.tagName === 'TH' ||
        getStyle(node)?.display === 'table-cell'
      const isBlock =
        blockTags.has(node.tagName) ||
        blockDisplays.has(getStyle(node)?.display ?? '')
      if (isBlock) append('\n')
      if (isCell) append('\t')
      for (const child of node.childNodes) visit(child, depth + 1)
      if (isCell) append('\t')
      if (isBlock) append('\n')
    }
    visit(element, 0)
    return parts.join('')
  }
  return { isRendered, readText }
}
