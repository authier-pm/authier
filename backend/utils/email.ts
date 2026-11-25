import { AsyncLocalStorage } from 'node:async_hooks'
import debug from 'debug'

const log = debug('au:email')

type EmailContent = {
  subject: string
  text: string
  html?: string
}

type EmailMessage = EmailContent & {
  from: {
    email: string
    name: string
  }
  to: string
}

export type EmailBindings = {
  EMAIL?: {
    send(message: EmailMessage): Promise<{ messageId: string }>
  }
}

const emailBindings = new AsyncLocalStorage<EmailBindings>()

export const sentEmails: EmailMessage[] = []

export const withEmailSending = <T>(bindings: EmailBindings, work: () => T) =>
  emailBindings.run(bindings, work)

export const sendEmail = async (
  emailAddress: string,
  content: EmailContent,
  options: { requireDelivery?: boolean } = {}
): Promise<void> => {
  const message: EmailMessage = {
    from: {
      email: 'no-reply@authier.pm',
      name: 'Authier password manager'
    },
    to: emailAddress,
    ...content
  }

  const isTest = process.env.NODE_ENV === 'test'
  if (isTest || process.env.DISABLE_EMAIL_SENDING !== 'false') {
    if (options.requireDelivery && !isTest) {
      throw new Error('Email approval delivery is disabled')
    }
    log(`would have sent email to ${emailAddress}`)
    sentEmails.push(message)
    return
  }

  const sender = emailBindings.getStore()?.EMAIL
  if (!sender) {
    throw new Error('Cloudflare EMAIL binding is not configured')
  }

  const result = await sender.send(message)
  log(`sent email ${result.messageId} to ${emailAddress}`)
}
