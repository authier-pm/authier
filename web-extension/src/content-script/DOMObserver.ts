import mitt from 'mitt'

export const bodyInputChangeEmitter = mitt<{
  inputRemoved: HTMLInputElement
  inputAdded: HTMLInputElement
}>()

/**
 * inspired from https://usefulangle.com/post/357/javascript-detect-element-removed-from-dom
 */
export const inputDomMutationObserver = new MutationObserver(function (
  mutationsList
) {
  mutationsList.forEach(function (mutation) {
    mutation.removedNodes.forEach(function (removedNode) {
      if (removedNode.nodeName === 'INPUT') {
        bodyInputChangeEmitter.emit(
          'inputRemoved',
          removedNode as HTMLInputElement
        )
      }
    })
    mutation.addedNodes.forEach(function (addedNode) {
      if (addedNode.nodeName === 'INPUT') {
        bodyInputChangeEmitter.emit('inputAdded', addedNode as HTMLInputElement)
      } else if (addedNode['querySelectorAll']) {
        // @ts-expect-error
        const childInputs = addedNode.querySelectorAll('input')
        for (const input of childInputs) {
          bodyInputChangeEmitter.emit('inputAdded', input)
        }
      }
    })
  })
})

inputDomMutationObserver.observe(document.body, {
  subtree: true,
  childList: true
})
