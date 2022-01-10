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

export function isHidden(el) {
  const style = window.getComputedStyle(el)
  return style.display === 'none'
}
