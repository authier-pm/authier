import 'dotenv/config'
import { app } from './app'

app.listen({ port: Number(process.env.PORT), hostname: '0.0.0.0' }, () => {
  console.log(
    `Listening, GraphiQL: http://localhost:${process.env.PORT}/graphql`
  )

  if (process.env.NODE_ENV === 'development') {
    import('./scripts/generateGqlSchemas')
  }
})
