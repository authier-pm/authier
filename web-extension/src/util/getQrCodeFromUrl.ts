import jsQR from 'jsqr'

export const getQrCodeFromUrl = async (imageUrl: string) => {
  const response = await fetch(imageUrl)
  const fileBlob = await response.blob()
  const bitmap = await createImageBitmap(fileBlob)
  //TODO: Change, this option is limited on Firefox https://github.com/BabylonJS/Spector.js/issues/137#issue-550442024
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
  const context = canvas.getContext('2d')
  if (context) {
    //TODO: Solve this error
    context.drawImage(bitmap, 0, 0)
    const imageData = context.getImageData(0, 0, bitmap.width, bitmap.height)
    const result = jsQR(imageData.data, imageData.width, imageData.height)

    return result
  }
}
