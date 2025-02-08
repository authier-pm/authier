// this entire file is just for testing in a browser console
const uselessInputTypes = [
  'hidden',
  'submit',
  'button',
  'reset',
  'button',
  'checkbox',
  'radio',
  'file',
  'color',
  'image',
  'range',
  'search',
  'time'
]

const getAllInputsIncludingShadowDom = (root) => {
  const inputs = []

  const searchNode = (node) => {
    const regularInputs = Array.from(node.querySelectorAll('input'))
    inputs.push(...regularInputs)

    const walker = document.createTreeWalker(
      node,
      NodeFilter.SHOW_ELEMENT,
      null
    )

    let currentNode = walker.currentNode
    while (currentNode) {
      if (currentNode.shadowRoot) {
        console.log('currentNode.shadowRoot', currentNode)
        searchNode(currentNode.shadowRoot)
      }
      currentNode = walker.nextNode()
    }
  }

  searchNode(root)
  return inputs
}

const filterUselessInputs = (documentBody) => {
  const inputEls = getAllInputsIncludingShadowDom(documentBody)
  const inputElsArray = inputEls.filter((el) => {
    return (
      uselessInputTypes.includes(el.type) === false &&
      el.offsetWidth > 0 && // filter out hidden elements
      el.offsetHeight > 0 &&
      el.value === '' // filter out elements that already have a value
    )
  })
  return inputElsArray
}

filterUselessInputs(document.body)
