export const generateQuerySelectorForOrphanedElement = (el: HTMLElement) => {
  if (el.tagName.toLowerCase() == 'html') return 'HTML'
  let str = el.tagName
  str += el.id != '' ? '#' + el.id : ''
  if (el.className) {
    const classes = el.className.split(/\s/)
    for (let i = 0; i < classes.length; i++) {
      str += '.' + classes[i]
    }
  }
  return str
}
