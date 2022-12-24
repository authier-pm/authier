import { app } from './app'

app.listen({ port: Number(process.env.PORT!), host: '0.0.0.0' }).then(() => {
  console.log(
    `Listening, GraphiQL: http://localhost:${process.env.PORT}/graphiql`
  )

  import('./scripts/generateGqlSchemas')
})
