import * as Sentry from '@sentry/react-native'
import { SENTRY_DSN } from '@env'

export const routingInstrumentation =
  new Sentry.ReactNavigationInstrumentation()

// TODO reenable when we get the proper DSN
// Sentry.init({
//   dsn: Config.SENTRY_DSN,
//   // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
//   // We recommend adjusting this value in production.
//   tracesSampleRate: 1.0,
//   integrations: [
//     new Sentry.ReactNativeTracing({
//       // Pass instrumentation to be used as `routingInstrumentation`
//       routingInstrumentation
//     })
//   ]
// })
