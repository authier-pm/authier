import debug from 'debug'

const log = debug('au:email')

type MailjetRequestMessage = {
  From: {
    Email: string
    Name: string
  }
  To: Array<{
    Email: string
  }>
  Subject: string
  TextPart: string
  HTMLPart?: string
}

type MailjetSendPayload = {
  Messages: MailjetRequestMessage[]
}

type MailjetSendResponse = {
  response: {
    status: number
    body?: string
  } & Record<string, unknown>
}

export const sentEmails: MailjetSendPayload[] = []

const shouldDisableSending =
  process.env.NODE_ENV === 'test' ||
  process.env.DISABLE_EMAIL_SENDING !== 'false'

const sendMailjetRequest = async (
  payload: MailjetSendPayload
): Promise<MailjetSendResponse> => {
  const apiKey = process.env.MJ_APIKEY_PUBLIC
  const apiSecret = process.env.MJ_APIKEY_PRIVATE

  if (!apiKey || !apiSecret) {
    throw new Error('Missing Mailjet credentials')
  }

  const response = await fetch('https://api.mailjet.com/v3.1/send', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${apiKey}:${apiSecret}`)}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  const body = await response.text()

  if (!response.ok) {
    throw new Error(`Mailjet send failed (${response.status}): ${body}`)
  }

  return {
    response: {
      status: response.status,
      body
    }
  }
}

export const sendEmail = async (
  emailAddress: string,
  props: {
    Subject: string
    TextPart: string
    HTMLPart?: string
  }
) => {
  const payload: MailjetSendPayload = {
    Messages: [
      {
        From: {
          Email: 'no-reply@authier.pm',
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
  }

  if (shouldDisableSending) {
    console.log(
      `would have sent emails to ${payload.Messages.map((message) => message.To[0]?.Email).join(', ')}`
    )
    sentEmails.push(payload)

    return {
      response: {
        status: 200
      }
    }
  }

  const res = await sendMailjetRequest(payload)

  log(`sent email to ${emailAddress}`)
  return res
}
