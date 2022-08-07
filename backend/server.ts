import { app } from './app'

app.listen({ port: Number(process.env.PORT!), host: '0.0.0.0' }).then(() => {
  console.log(`Listening on ${process.env.PORT}`)

  import('./scripts/generateGqlSchemas')
})
