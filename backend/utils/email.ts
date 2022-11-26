import debug from 'debug'
import Mailjet from 'node-mailjet'
const log = debug('au:email')

const client = Mailjet.apiConnect(
  process.env.MJ_APIKEY_PUBLIC!,
  process.env.MJ_APIKEY_PRIVATE!
)

export const sendEmail = async (
  emailAddress: string,
  props: {
    Subject: string
    TextPart: string
    HTMLPart: string
  }
) => {
  const res = client.post('send', { version: 'v3.1' }).request({
    Messages: [
      {
        From: {
          Email: 'admin@authier.ml',
          Name: 'Authier password manager'
        },
        To: [
          {
            Email: emailAddress
          }
        ],
        ...props
      }
    ]
  })

  log(`sent email to ${emailAddress}`)
  return res
}
