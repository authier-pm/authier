import mailjet from 'node-mailjet'

const client = mailjet.connect(
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
  return client.post('send', { version: 'v3.1' }).request({
    Messages: [
      {
        From: {
          Email: 'authier.ml@google.com',
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
}
