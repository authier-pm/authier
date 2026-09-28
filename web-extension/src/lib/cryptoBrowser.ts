// generate-password imports Node's crypto just for randomBytes.
// Vite aliases `crypto` to this module, supplying the equivalent WebCrypto primitive.
export const randomBytes = (size: number) =>
  crypto.getRandomValues(new Uint8Array(size))
