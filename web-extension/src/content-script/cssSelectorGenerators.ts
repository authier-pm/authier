export const generateQuerySelectorForOrphanedElement = (
  el: HTMLInputElement | HTMLFormElement
) => {
  if (el.tagName.toLowerCase() === 'html') return 'HTML'
  let selector = el.tagName
  selector += el.type ? `[type="${el.type}"]` : ''
  selector += el.autocomplete ? `[autocomplete="${el.autocomplete}"]` : ''

  return selector
}

export interface ICSSSelectorDomOrdinal {
  css: string
  domOrdinal: number
}

/**
 * very important
 *
 */
export function getCssSelectorForInput(
  element: HTMLInputElement | HTMLFormElement
): ICSSSelectorDomOrdinal {
  // we don't want to use id attribute as it can be dynamically generated, for example okta does it for their login forms
  let proposedSelector = element.tagName.toLowerCase()
  if (element.name) {
    proposedSelector += `[name="${element.name}"]`
  }
  if (element.className) {
    proposedSelector += `[class="${element.className}"]`
  }
  if (element.autocomplete) {
    proposedSelector += `[autocomplete="${element.autocomplete}"]`
  }

  const inputsForProposedSelector = document.querySelectorAll(proposedSelector)
  if (inputsForProposedSelector.length === 1) {
    return { css: proposedSelector, domOrdinal: 0 }
  } else {
    for (let index = 0; index < inputsForProposedSelector.length; index++) {
      const element = inputsForProposedSelector[index]
      if (element === element) {
        return { css: proposedSelector, domOrdinal: index }
      }
    }
    throw new Error('failed to resolve a CSS selector')
  }
}

export function getSelectorForElement(
  target: HTMLInputElement | HTMLFormElement
): ICSSSelectorDomOrdinal {
  let selector: ICSSSelectorDomOrdinal
  if (document.body.contains(target)) {
    if (target.autocomplete && target.autocomplete !== 'off') {
      const autocompleteSelector = `[autocomplete="${target.autocomplete}"]`
      if (document.body.querySelectorAll(autocompleteSelector).length === 1) {
        return { css: autocompleteSelector, domOrdinal: 0 } // if the input has autocomplete, we always honor that. There are websites that generate ids for elements randomly
      }
    }

    selector = getCssSelectorForInput(target)
  } else {
    // this input is not in DOM anymore--it was probably removed as part of the login flow(multi step login flow)
    selector = {
      css: generateQuerySelectorForOrphanedElement(target),
      domOrdinal: 0
    } // we fallback to generating selector from the orphaned element
  }

  return selector
}
