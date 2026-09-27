/**
 *
 * @param el
 * @returns boolean
 */
export function isElementInViewport(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect()

  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <=
      (window.innerHeight ||
        document.documentElement.clientHeight) /* or $(window).height() */ &&
    rect.right <=
      (window.innerWidth ||
        document.documentElement.clientWidth) /* or $(window).width() */
  )
}

export function isHidden(el: HTMLElement): boolean {
  const style = window.getComputedStyle(el)
  const isHiddenAttributeSet = el.hidden === true

  return (
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    style.visibility === 'collapse' ||
    style.opacity === '0' ||
    isHiddenAttributeSet
  )
}

/** laid out and not hidden by CSS, but possibly scrolled out of the viewport */
export function isElementRendered(el: HTMLElement): boolean {
  return el.isConnected && el.getClientRects().length > 0 && !isHidden(el)
}

export function isElementVisibleInViewport(el: HTMLElement): boolean {
  return isElementRendered(el) && isElementInViewport(el)
}
