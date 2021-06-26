import 'reflect-metadata'
import fastify from 'fastify'
import mercurius from 'mercurius'
import { schema } from './schemas/schema'
import dotenv from 'dotenv'

dotenv.config()

async function main() {
  const app = fastify()

  app.register(mercurius, {
    schema,
    graphiql: 'playground'
  })

  app.listen(5051)
}

main().then(() => {
  console.log(`Listening on ${process.env.API_URL}`)
})
