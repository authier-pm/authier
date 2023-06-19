import { app } from './app'
import { checkPrismaSchemaHash } from '../node_modules/prisma-generator-checker/dist/checkPrismaSchemaHash'

app.listen({ port: Number(process.env.PORT!), host: '0.0.0.0' }).then(() => {
  console.log(
    `Listening, GraphiQL: http://localhost:${process.env.PORT}/graphiql`
  )

  if (process.env.NODE_ENV === 'development') {
    import('./scripts/generateGqlSchemas')
    checkPrismaSchemaHash()
  }
})
