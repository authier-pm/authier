// @ts-ignore-error  TS1192: Module '"/home/capaj/work-repos/authier-repos/authier2/backend/stripe"' has no default export.
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2022-11-15'
})
