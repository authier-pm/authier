import mitt from 'mitt'

type EventHash = {
  inputRemoved: HTMLInputElement
  inputAdded: HTMLInputElement
}

export const bodyInputChangeEmitter = mitt<EventHash>()

const inputDebounceMap = new Map()

const DEBOUNCE_TIME = 180 // we want to debounce the emitted events- we don't want to emit events for every DOM mutation if there are many in quick succession

function emitDebounced(
  eventName: keyof EventHash,
  input: HTMLInputElement | HTMLIFrameElement
) {
  if (inputDebounceMap.has(input)) {
    clearTimeout(inputDebounceMap.get(input))
  }
  const timer = setTimeout(() => {
    bodyInputChangeEmitter.emit(eventName, input as HTMLInputElement)
    inputDebounceMap.delete(input)
  }, DEBOUNCE_TIME)
  inputDebounceMap.set(input, timer)
}

export const startBodyInputChangeObserver = () => {
  /**
   * inspired from https://usefulangle.com/post/357/javascript-detect-element-removed-from-dom
   */
  const domMutationObserver = new MutationObserver(function (mutationsList) {
    mutationsList.forEach(function (mutation) {
      mutation.removedNodes.forEach(function (removedNode) {
        if (removedNode.nodeName === 'INPUT') {
          emitDebounced('inputRemoved', removedNode as HTMLInputElement)
        }
      })
      mutation.addedNodes.forEach(function (addedNode) {
        const node = addedNode as HTMLElement

        if (node.nodeName === 'INPUT') {
          emitDebounced('inputAdded', node as HTMLInputElement)
        } else if (node['querySelectorAll']) {
          node.querySelectorAll('input').forEach((input) => {
            emitDebounced('inputAdded', input)
          })

          const childIframe = node.querySelector('input')
          if (childIframe) {
            emitDebounced('inputAdded', node as HTMLInputElement)
          }
        }
      })
    })
  })

  const body = document.body

  domMutationObserver.observe(body, {
    subtree: true,
    childList: true
  })

  return domMutationObserver
}
