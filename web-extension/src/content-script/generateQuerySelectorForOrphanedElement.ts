export const generateQuerySelectorForOrphanedElement = (
  el: HTMLInputElement | HTMLFormElement
) => {
  if (el.tagName.toLowerCase() === 'html') return 'HTML'
  let selector = el.tagName
  selector += el.type ? `[type="${el.type}"]` : ''
  selector += el.autocomplete ? `[autocomplete="${el.autocomplete}"]` : ''

  return selector
}
