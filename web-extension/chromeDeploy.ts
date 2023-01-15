import chromeWebstoreUpload from 'chrome-webstore-upload'
import * as dotenv from 'dotenv'
import fs from 'fs'

dotenv.config()
const { env } = process

const store = chromeWebstoreUpload({
  extensionId: env.EXTENSION_ID,
  clientId: env.CLIENT_ID,
  clientSecret: env.CLIENT_SECRET,
  refreshToken: env.REFRESH_TOKEN
})

let uploadExisting
let publishRes
const upload = async () => {
  const myZipFile = fs.createReadStream('./mypackage.zip')
  uploadExisting = await store.uploadExisting(myZipFile)
}

const publish = async () => {
  publishRes = await store.publish()
}
