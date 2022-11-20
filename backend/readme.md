# Authier API

Do not import generated resolvers from generated/resolvers. Write custom ones.

## Register

1. on the client: encrypted secret, secret
2. registerNewUser(encrypted secret, secret)

## Adding another device

1. deviceDecryptionChallenge -> encrypted secret
2. on the client: decrypt secret
3. addNewDeviceForUser(decryptedSecret)

# Naming conventions

all graphql custom fields must start with a lower letter. Capital letters are reserved for prisma relations only.

# DB

To run the project locally, you need a single postgresql superuser. You can name it whatever you like and use whatever password you wish.
We typically use `authier` and `auth133r` for testing.

you can use this:

```
ALTER USER authier WITH SUPERUSER;
```

## Testing

We run tests across many local DBs to avoid problems when multiple parallel tests write into a single DB.
One running test will always write to it's own DB. That's why when you run `yarn test:prepare` it creates many as many DBs as you have CPU cores on your machine.

### running the bundled code

you can run bundled lambda locally to check for bundling issues etc. Just run `pnpm build` and `node dist/lambda.js`

## AWS URL

https://stackoverflow.com/questions/63684133/prisma-cant-connect-to-postgresql#:~:text=replace%20special%20characters%20with%20percent-encodings
