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
  // Initial scan for visible inputs
  const initialInputs = document.querySelectorAll('input')
  initialInputs.forEach((input) => {
    const isVisible =
      !(input as HTMLElement).hidden &&
      window.getComputedStyle(input as HTMLElement).display !== 'none' &&
      window.getComputedStyle(input as HTMLElement).visibility !== 'hidden'

    if (isVisible) {
      emitDebounced('inputAdded', input as HTMLInputElement)
    }
  })

  const domMutationObserver = new MutationObserver(function (mutationsList) {
    mutationsList.forEach(function (mutation) {
      if (mutation.type === 'attributes') {
        // Check if the target is an input or contains inputs that became visible
        const target = mutation.target as HTMLElement
        if (target.nodeName === 'INPUT' || target.querySelector('input')) {
          const inputs =
            target.nodeName === 'INPUT'
              ? [target]
              : Array.from(target.querySelectorAll('input'))
          inputs.forEach((input) => {
            const isVisible =
              !(input as HTMLElement).hidden &&
              window.getComputedStyle(input as HTMLElement).display !==
                'none' &&
              window.getComputedStyle(input as HTMLElement).visibility !==
                'hidden'

            if (isVisible) {
              emitDebounced('inputAdded', input as HTMLInputElement)
            }
          })
        }
      }

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
          const inputs = node.querySelectorAll('input')
          if (inputs.length > 0) {
            inputs.forEach((input) => {
              emitDebounced('inputAdded', input)
            })
          }

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
    childList: true,
    attributes: true,
    attributeFilter: ['style', 'class'],
    characterData: true
  })

  return domMutationObserver
}
