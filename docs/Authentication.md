# Authentication

This is simple description of authentication process in authier

## Client

#### Register

1. Get password from user
2. generate encryption salt
3. Use PBFK2 for password encryption (password + encryption salt (random string) = masterEncryptionKey)
4. Generate deviceSecret (initLocalDeviceAuthSecret = authSecret (random string) + masterEncryptionKey + (parsed) userId = adddeviceSecret + adddeviceSecretEncrypted)
5. Call `registerNewUser` mutation
6. If accessToken is in the responce we can create device state

```mermaid
graph Register
    generateBackendSecret --> authSecret*: Random string

    password --> PBFK2
    encryptionSalt --> PBFK2
    PBFK2 --> initLocalDeviceAuthSecret: masterEncryptionKey
    userId --> initLocalDeviceAuthSecret

    state initLocalDeviceAuthSecret {
        *authSecret --> addDeviceSecret
        *authSecret --> AES
        masterEncryptionKey --> AES
        iv --> AES
        AES --> addDeviceSecretEncrypted
    }

    initLocalDeviceAuthSecret --> registerNewUser: Call register function on server
    registerNewUser --> CreateUserInDB
```

#### Login

1. Get password from user
2. call `deviceDecryptionChallenge` mutation, which creates decryptionChallange and wait for master device confirmation
3. Master device confirm challange
4. Use PBDFK2 for password encryption (masterEncryptionKey)
5. Try to decrypt `addDeviceSecretEncrypted` (from decryptionChallange) with masterEncryptionKey and parsed `userId`
   (If is decrypted deviceSecret same as the one from decryptionChallange, we know that the master password is correct)
6. Generate new deviceSecret and encrypt it with masterEncryptionKey
7. Call `addNewDevice` mutation on backend

## Server
