export const copyTextToClipboard = (text: string) => {
  if (!navigator.clipboard?.writeText) {
    return Promise.reject(new Error('Clipboard is not available'))
  }

  return navigator.clipboard.writeText(text)
}
