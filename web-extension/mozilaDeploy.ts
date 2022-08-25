var fs = require('fs')
import * as dotenv from 'dotenv'
var deploy = require('firefox-extension-deploy')

dotenv.config()
const { env } = process

deploy({
  issuer: env.ISSUER,
  secret: env.JWT_SECRET,

  // the ID of your extension
  id: 'exampleId@jetpack',
  // the version to publish
  version: '1.0.0',

  // a ReadStream containing a .zip (WebExtensions) or .xpi (Add-on SDK)
  src: fs.createReadStream('dist.zip')
}).then(
  function () {
    // success!
    console.log('success!')
  },
  function (err) {
    // failure :(
    console.log(err)
  }
)
