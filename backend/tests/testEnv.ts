import 'reflect-metadata'
import faker from 'faker'
import '../dotenv'
import { afterAll, beforeAll, vi } from 'vitest'
import debug from 'debug'
faker.seed(1)
const log = debug('au:test')
/**
 * if you need to truncate inside your tests, just call this function. In regular tests, we only invoke this after all specs in current test file are done
 */
export const truncateAllTables = async () => {
  const prisma = (await import('../prisma/prismaClient')).prismaClient
  const tableNames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`

  const tables = tableNames
    .map(({ tablename }) => tablename)
    .filter((tableName) => {
      return tableName !== '_prisma_migrations'
    })

  for (const tablename of tables) {
    try {
      await prisma.$executeRawUnsafe(
        `TRUNCATE TABLE "public"."${tablename}" CASCADE;`
      )
    } catch (error) {
      console.error({ error })
    }
  }
  log('truncated all tables')
}

afterAll(truncateAllTables)

// TODO mocking is somehow breaking
// beforeAll(() => {
//   const fakeMailjetPost = {
//     request: vi.fn()
//   }

//   // we don't want to send anything from tests.
//   vi.mock('node-mailjet', () => ({
//     connect: () => {
//       return {
//         post: () => {
//           return fakeMailjetPost
//         }
//       }
//     }
//   }))
// })
