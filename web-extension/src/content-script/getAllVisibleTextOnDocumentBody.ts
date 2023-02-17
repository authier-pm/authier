export const getAllVisibleTextOnDocumentBody = () => {
  function isExcluded(elm: HTMLElement) {
    // exclude elements with invisible text nodes
    if (elm.style.display == 'none' || elm.style.visibility == 'hidden') {
      return true
    }

    const ignoredTags = ['STYLE', 'SCRIPT', 'NOSCRIPT', 'IFRAME', 'OBJECT']
    if (ignoredTags.includes(elm.tagName)) {
      return true
    }

    return false
  }
  let text = ''

  function traverse(elm: HTMLElement) {
    if (
      elm.nodeType == Node.ELEMENT_NODE ||
      elm.nodeType == Node.DOCUMENT_NODE
    ) {
      // exclude elements with invisible text nodes
      if (isExcluded(elm)) {
        return
      }

      for (var i = 0; i < elm.childNodes.length; i++) {
        // recursively call to traverse
        traverse(elm.childNodes[i] as HTMLElement)
      }
    }

    if (elm.nodeType == Node.TEXT_NODE) {
      // exclude text node consisting of only spaces
      if (elm.nodeValue?.trim() == '') {
        return
      }

      // elm.nodeValue here is visible text we need.
      text += elm.nodeValue
    }
  }

  traverse(document.body)

  return text
}
