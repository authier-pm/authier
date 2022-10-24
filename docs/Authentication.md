# Authentication

This is simple description of authentication process in authier

## Client

#### Register

1. Get password from user
2. generate encryption salt
3. PBFK2 = password + encryption salt = masterEncryptionKey
4. initLocalDeviceAuthSecret = authSecret (random string) + masterEncryptionKey + userId = adddeviceSecret + adddeviceSecretEncrypted
5. Call `registerNewUser` mutation
6. If accessToken is in the responce we create state

```mermaid
graph Register;
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
    CreateUserInDB --> [*]: Returns
```

#### Login

1. Get password from user
2. call `deviceDecryptionChallenge` mutation, which creates deryptionChallange and wait for masterDevice confirmation
3.

## Server

#### Register

1.
