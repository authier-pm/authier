import debug from 'debug'
import Mailjet from 'node-mailjet'
const log = debug('au:email')

let client = Mailjet.apiConnect(
  process.env.MJ_APIKEY_PUBLIC!,
  process.env.MJ_APIKEY_PRIVATE!
)

export const sentEmails = [] as any[]

if (process.env.NODE_ENV === 'test') {
  client = {
    post: () => ({
      request: (attrs) => {
        console.log(
          `would have sent emails to ${attrs.Messages.map(
            (m: any) => m.To[0].Email
          ).join(', ')}`
        )
        sentEmails.push(attrs as any)
        // console.log(sentEmails)

        return Promise.resolve({
          response: {}
        })
      }
    })
  } as any
}

export const sendEmail = async (
  emailAddress: string,
  props: {
    Subject: string
    TextPart: string
    HTMLPart?: string
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
