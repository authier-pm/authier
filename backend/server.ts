import { app } from './app'

app.listen({ port: Number(process.env.PORT!), host: '0.0.0.0' }).then(() => {
  console.log(
    `Listening, GraphiQL: http://localhost:${process.env.PORT}/graphiql`
  )

  if (process.env.NODE_ENV === 'development') {
    import('./scripts/generateGqlSchemas')
    import('../node_modules/prisma-generator-checker/dist/runtimeChecker')
  }
})
