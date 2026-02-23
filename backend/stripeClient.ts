import Stripe from 'stripe'

export const createStripeClient = () => {
  const apiKey = process.env.STRIPE_SECRET_KEY
  if (!apiKey) {
    throw new Error('Missing STRIPE_SECRET_KEY')
  }

  return new Stripe(apiKey)
}

export const createStripeClientGetter = () => {
  let stripeClient: Stripe | null = null

  return () => {
    if (stripeClient) return stripeClient
    stripeClient = createStripeClient()
    return stripeClient
  }
}
