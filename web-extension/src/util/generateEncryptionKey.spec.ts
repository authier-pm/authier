import { generateEncryptionKey } from './generateEncryptionKey'

describe('generateEncryptionKey', () => {
  it('should generate an encryption key from a password and an encryption salt', () => {
    const password = 'my_password'
    const salt = 'my_salt'
    const key = generateEncryptionKey(password, salt)

    expect(key).toBeDefined()
    expect(typeof key).toBe('string')
    expect(key.length).toBe(1024)
    expect(key).not.toEqual(password)
    expect(key).not.toEqual(salt)
  })

  it('should generate different keys for different salts', () => {
    const password = 'my_password'
    const salt1 = 'salt1'
    const salt2 = 'salt2'
    const key1 = generateEncryptionKey(password, salt1)
    const key2 = generateEncryptionKey(password, salt2)

    expect(key1).not.toEqual(key2)
  })
})
