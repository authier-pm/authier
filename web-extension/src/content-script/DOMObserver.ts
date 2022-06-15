import mitt from 'mitt'

export const bodyInputChangeEmitter = mitt<{
  inputRemoved: HTMLInputElement
  inputAdded: HTMLInputElement
}>()

const inputDebounceMap = new Map()

const DEBOUNCE_TIME = 180 // we want to debounce the emitted events- we don't want to emit events for every DOM mutation if there are many in quick succession

function emitDebounced(
  eventName: 'inputRemoved' | 'inputAdded',
  input: HTMLInputElement
) {
  if (inputDebounceMap.has(input)) {
    clearTimeout(inputDebounceMap.get(input))
  }
  const timer = setTimeout(() => {
    bodyInputChangeEmitter.emit(eventName, input)
    inputDebounceMap.delete(input)
  }, DEBOUNCE_TIME)
  inputDebounceMap.set(input, timer)
}

/**
 * inspired from https://usefulangle.com/post/357/javascript-detect-element-removed-from-dom
 */
export const inputDomMutationObserver = new MutationObserver(function (
  mutationsList
) {
  mutationsList.forEach(function (mutation) {
    mutation.removedNodes.forEach(function (removedNode) {
      if (removedNode.nodeName === 'INPUT') {
        emitDebounced('inputRemoved', removedNode as HTMLInputElement)
      }
    })
    mutation.addedNodes.forEach(function (addedNode) {
      if (addedNode.nodeName === 'INPUT') {
        emitDebounced('inputAdded', addedNode as HTMLInputElement)
      } else if (addedNode['querySelectorAll']) {
        // @ts-expect-error TODO
        const childInputs = addedNode.querySelectorAll('input')
        for (const input of childInputs) {
          emitDebounced('inputAdded', input)
        }
      }
    })
  })
})

inputDomMutationObserver.observe(document.body, {
  subtree: true,
  childList: true
})
