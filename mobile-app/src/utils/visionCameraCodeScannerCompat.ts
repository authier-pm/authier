export const BarcodeFormat = {
  QR_CODE: 'qr'
} as const

type Barcode = {
  rawValue?: string
}

type ScanOptions = {
  checkInverted?: boolean
}

export function useScanBarcodes(
  _formats: ReadonlyArray<string>,
  _options?: ScanOptions
): [undefined, Barcode[]] {
  return [undefined, []]
}
