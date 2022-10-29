# Authentication

This is simple description of authentication process in authier

## Client

#### Register

1. Get password from user
2. generate encryption salt
3. PBFK2 = password + encryption salt = masterEncryptionKey
4. AES = `authSecret` + `masterEncryptionKey` + `userId` = addDeviceSecretEncrypted (+ addDeviceSecret)

- authSecret = random string
- we use AES cypher to get `addDeviceSecretEncrypted` from materEncryptionKey, userId and authSecret

5. Call `registerNewUser` mutation
6. If accessToken is in the responce we create state

#

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

# Server mutations

### registerNewUser

1. create user with device in DB
2. check if user with such email or device exists
3. get the user device and set it on master
4. returns signed accessToken with user data

### deviceDecryptionChallenge
