import 'reflect-metadata'
import fastify from 'fastify'
import mercurius from 'mercurius'
import { schema } from './schemas/schema'
import dotenv from 'dotenv'
import cookie, { FastifyCookieOptions } from 'fastify-cookie'

dotenv.config()

async function main() {
  const app = fastify()

  app.register(cookie, {
    secret: 'my-secret', // for cookies signature
    parseOptions: {} // options for parsing cookies
  } as FastifyCookieOptions)

  app.register(mercurius, {
    schema,
    graphiql: 'playground',
    context: (request, reply) => {
      return { request, reply }
    }
  })

  app.listen(5051)
}

main().then(() => {
  console.log(`Listening on ${process.env.API_URL}`)
})
