# Authier API

Do not import generated resolvers from generated/resolvers. Write custom ones.

## Register

1. on the client: encrypted secret, secret
2. registerNewUser(encrypted secret, secret)

## Adding another device

1. deviceDecryptionChallenge -> encrypted secret
2. on the client: decrypt secret
3. addNewDeviceForUser(decryptedSecret)
