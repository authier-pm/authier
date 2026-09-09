import {
  MAX_PASSWORD_FORM_HTML_BYTES,
  passwordFormHtmlByteLength,
  passwordFormSnapshotSchema
} from '@shared/passwordFormClassification'
import { getSelectorForElement } from './cssSelectorGenerators'
import { isElementVisibleInViewport } from './isElementInViewport'

const OMITTED_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'SVG',
  'IFRAME',
  'TEXTAREA',
  'SELECT'
])
const FIELD_ATTRIBUTES = [
  'name',
  'id',
  'type',
  'autocomplete',
  'placeholder',
  'aria-label'
] as const

const MAX_VISITED_NODES = 1000
const MAX_NESTING_DEPTH = 48

const redactText = (text: string) =>
  text.replace(/\S+@\S+\.\S+/g, '[email]').replace(/\s+/g, ' ')

const isOmittedElement = (node: Node) =>
  node instanceof Element &&
  (OMITTED_TAGS.has(node.tagName) ||
    (node instanceof HTMLElement && node.hidden))

const serializeInput = (
  input: HTMLInputElement,
  index: number,
  attributeLimit: number
) => {
  const element = document.createElement('input')
  for (const attribute of FIELD_ATTRIBUTES) {
    const value = input.getAttribute(attribute)
    if (value && attributeLimit > 0)
      element.setAttribute(attribute, value.slice(0, attributeLimit))
  }
  element.type = input.type
  element.setAttribute('data-authier-index', String(index))
  return element
}

/** Read a bounded excerpt without pulling scripts, hidden controls or values. */
const readContextText = (element: Element, limit: number) => {
  if (!limit || isOmittedElement(element)) return ''
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        if (isOmittedElement(node) || node instanceof HTMLInputElement)
          return NodeFilter.FILTER_REJECT
        return NodeFilter.FILTER_ACCEPT
      }
    }
  )
  let text = ''
  let visited = 0
  while (text.length < limit && visited++ < MAX_VISITED_NODES) {
    const node = walker.nextNode()
    if (!node) break
    if (node.nodeType === Node.TEXT_NODE) {
      text += redactText((node.textContent ?? '').slice(0, limit * 8))
    }
  }
  return text.trim().slice(0, limit)
}

const readFieldContext = (input: HTMLInputElement, limit: number) => {
  const label = input.labels?.[0]
  if (label) return readContextText(label, limit)
  const labelId = input.getAttribute('aria-labelledby')?.split(/\s+/)[0]
  const labelledBy = labelId ? document.getElementById(labelId) : null
  if (labelledBy) return readContextText(labelledBy, limit)

  // Div-based field rows often place their caption next to an input wrapper.
  let ancestor: HTMLElement | null = input
  for (
    let depth = 0;
    ancestor && depth < 4;
    depth++, ancestor = ancestor.parentElement
  ) {
    const previous = ancestor.previousElementSibling
    if (
      previous &&
      !previous.matches('input') &&
      !previous.querySelector('input')
    ) {
      const text = readContextText(previous, limit)
      if (text) return text
    }
    if (ancestor === input.form) break
  }
  return ''
}

/** Preserve all field indexes; shrink surrounding copy instead of slicing HTML. */
const compactForm = (scope: HTMLElement, inputs: HTMLInputElement[]) => {
  const headings = Array.from(
    scope.querySelectorAll('h1, h2, h3, legend')
  ).slice(0, 3)
  const buttons = Array.from(
    scope.querySelectorAll('button, [role="button"]')
  ).slice(0, 3)
  let limit = 256
  while (true) {
    const form = document.createElement('form')
    form.setAttribute('data-authier-trimmed', 'true')
    const appendContext = (
      tag: string,
      text: string,
      parent: HTMLElement = form
    ) => {
      if (!text) return
      const element = document.createElement(tag)
      element.textContent = text
      parent.appendChild(element)
    }
    for (const heading of headings)
      appendContext('h2', readContextText(heading, limit))
    for (const [index, input] of inputs.entries()) {
      const row = document.createElement('div')
      appendContext('span', readFieldContext(input, limit), row)
      row.appendChild(serializeInput(input, index, Math.floor(limit / 2)))
      form.appendChild(row)
    }
    for (const button of buttons)
      appendContext('button', readContextText(button, limit))
    const html = form.outerHTML
    if (passwordFormHtmlByteLength(html) <= MAX_PASSWORD_FORM_HTML_BYTES)
      return html
    limit = Math.floor(limit / 2)
  }
}

/** Rebuild the form from allowed attributes: never clone input values or URLs. */
export const snapshotPasswordForm = (scope: HTMLElement) => {
  const inputs = Array.from(
    scope.querySelectorAll<HTMLInputElement>('input')
  ).filter(
    (input) =>
      ['password', 'text', 'email', 'tel'].includes(input.type) &&
      !input.disabled &&
      !input.readOnly &&
      isElementVisibleInViewport(input)
  )
  if (!inputs.some((input) => input.type === 'password') || inputs.length > 24)
    return null

  let visited = 0
  let bytes = 0
  let oversized = false
  const serialize = (node: Node, depth = 0): Node | null => {
    if (++visited > MAX_VISITED_NODES || depth > MAX_NESTING_DEPTH)
      oversized = true
    if (oversized) return null
    if (node.nodeType === Node.TEXT_NODE) {
      const raw = node.textContent ?? ''
      if (raw.length > MAX_PASSWORD_FORM_HTML_BYTES) oversized = true
      if (oversized) return null
      const text = redactText(raw)
      bytes += passwordFormHtmlByteLength(text)
      if (bytes > MAX_PASSWORD_FORM_HTML_BYTES) oversized = true
      return oversized ? null : document.createTextNode(text)
    }
    if (!(node instanceof HTMLElement) || isOmittedElement(node)) return null
    let element: HTMLElement
    if (node instanceof HTMLInputElement) {
      const index = inputs.indexOf(node)
      if (index === -1) return null
      element = serializeInput(node, index, 200)
    } else {
      element = document.createElement(node.tagName.toLowerCase())
    }
    bytes += passwordFormHtmlByteLength(element.outerHTML)
    if (bytes > MAX_PASSWORD_FORM_HTML_BYTES) oversized = true
    if (!(node instanceof HTMLInputElement)) {
      for (const child of node.childNodes) {
        if (oversized) break
        const sanitized = serialize(child, depth + 1)
        if (sanitized) element.appendChild(sanitized)
      }
    }
    return element
  }

  const sanitized = serialize(scope)
  const fullHtml = sanitized instanceof HTMLElement ? sanitized.outerHTML : ''
  const html =
    oversized ||
    passwordFormHtmlByteLength(fullHtml) > MAX_PASSWORD_FORM_HTML_BYTES
      ? compactForm(scope, inputs)
      : fullHtml
  const parsed = passwordFormSnapshotSchema.safeParse({
    url: location.href,
    language: document.documentElement.lang,
    html,
    inputs: inputs.map((input) => {
      const selector = getSelectorForElement(input)
      return {
        type: input.type,
        domPath: selector.css,
        domOrdinal: selector.domOrdinal
      }
    })
  })
  return parsed.success ? { snapshot: parsed.data, inputs } : null
}
