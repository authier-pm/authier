import cryptoJS from 'crypto-js'

const PBKDF2Iterations = 10

export const generateEncryptionKey = (
  password: string,
  encryptionSalt: string
) =>
  cryptoJS
    .PBKDF2(password, encryptionSalt, {
      // TODO: make sure this uses crypto.subtle, seems like it does not
      iterations: PBKDF2Iterations, // TODO: make this customizable per user
      keySize: 64
    })
    .toString(cryptoJS.enc.Hex)
