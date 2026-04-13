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
  return (
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    style.visibility === 'collapse' ||
    style.opacity === '0' ||
    el.hidden
  )
}

export function isElementVisibleInViewport(el: HTMLElement): boolean {
  if (!el.isConnected) {
    return false
  }

  if (el.getClientRects().length === 0) {
    return false
  }

  if (isHidden(el)) {
    return false
  }

  return isElementInViewport(el)
}
