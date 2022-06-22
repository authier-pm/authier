import { app } from './app'

const environment = process.env.NODE_ENV

app.listen(process.env.PORT!, '0.0.0.0').then(() => {
  console.log(`Listening on ${process.env.PORT}`)

  import('./scripts/generateGqlSchemas')
})
