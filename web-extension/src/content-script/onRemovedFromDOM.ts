/**
 * from https://usefulangle.com/post/357/javascript-detect-element-removed-from-dom
 * @param domNode
 * @param callback
 * @returns
 */
export function onRemoveFromDOM(
  domNode: Node,
  callback: () => void
): MutationObserver {
  const observer = new MutationObserver(function (mutationsList) {
    mutationsList.forEach(function (mutation) {
      mutation.removedNodes.forEach(function (removedNode) {
        if (removedNode === domNode) {
          callback()
          observer.disconnect()
        }
      })
    })
  })
  if (domNode.parentNode) {
    observer.observe(domNode.parentNode, { subtree: false, childList: true })
  }

  return observer
}
