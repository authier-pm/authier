const chromeWebstoreUpload = require('chrome-webstore-upload')
const dotenv = require('dotenv')
const fs = require('fs')

dotenv.config()
const { env } = process

const store = chromeWebstoreUpload({
  extensionId: env.EXTENSION_ID,
  clientId: env.CLIENT_ID,
  clientSecret: env.CLIENT_SECRET,
  refreshToken: env.REFRESH_TOKEN
})

const myZipFile = fs.createReadStream('./mypackage.zip')
store.uploadExisting(myZipFile).then((res) => {
  console.log(res)
  // Response is a Resource Representation
  // https://developer.chrome.com/webstore/webstore_api/items#resource
})

store.publish(target).then((res) => {
  console.log(res)
  // Response is documented here:
  // https://developer.chrome.com/webstore/webstore_api/items/publish
})
