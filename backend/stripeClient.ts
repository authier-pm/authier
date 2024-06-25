import Stripe from 'stripe'

export const stripeClient = new Stripe(
  process.env.STRIPE_SECRET_KEY as string,
  {
    apiVersion: '2024-06-20'
  }
)
