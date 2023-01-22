var fs = require('fs')
const dotenv = require('dotenv')
var deploy = require('firefox-extension-deploy')
//
dotenv.config()
const { env } = process

deploy({
  issuer: env.ISSUER,
  secret: env.JWT_SECRET,

  // the ID of your extension
  id: '18c8ffa6-f17c-4d43-bfab-5dae503c8c31',
  // the version to publish
  version: '1.0.0',

  // a ReadStream containing a .zip (WebExtensions) or .xpi (Add-on SDK)
  src: fs.createReadStream('./dist.zip')
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

// const IntegratedBuilder =
//   require('webext-buildtools-integrated-builder').default
// const options = {
//   zipOptions: {
//     zipOutPath: './dist.zip'
//   },
//   firefoxAddons: {
//     api: {
//       jwtIssuer: env.ISSUER,
//       jwtSecret: env.JWT_SECRET
//     },
//     deploy: {
//       extensionId: '18c8ffa6-f17c-4d43-bfab-5dae503c8c31'
//     }
//   }
// } // you can retrieve json object here
//
// const logMethod = console.log
// const builder = new IntegratedBuilder(
//   options,
//   logMethod,
//   true, // stopOnWarning
//   true // stopOnError
// )
//
// builder.requireFirefoxAddonsDeploy()
