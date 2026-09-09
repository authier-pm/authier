// The production password library uses Node's randomBytes via webpack's shim.
// Supply the equivalent WebCrypto primitive in this Vite browser preview.
export const randomBytes = (size: number) =>
  crypto.getRandomValues(new Uint8Array(size))
