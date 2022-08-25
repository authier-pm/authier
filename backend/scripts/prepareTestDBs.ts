import 'dotenv/config'

import { execFile } from 'child_process'

import { prismaClient } from '../prisma/prismaClient'
import { getDbCount } from './getDbCount'

export const testDbsPrefix = 'authier_test'
const dbCount = getDbCount() // each jest worker uses one CPU and one DB, so we need that many DBs

const dbUrl = process.env.DATABASE_URL?.split(/(\d+)(?!.*\d)/)[0]
const migrateOneDb = async (dbName: string) => {
  const command = 'reset'
  // Currently we don't have any direct method to invoke prisma migration programmatically.
  // As a workaround, we spawn migration script as a child process and wait for its completion.
  // Please also refer to the following GitHub issue: https://github.com/prisma/prisma/issues/4703
  try {
    await prismaClient.$executeRawUnsafe(`DROP DATABASE IF EXISTS ${dbName};`)
    await prismaClient.$executeRawUnsafe(`CREATE DATABASE ${dbName}`)

    const exitCode = await new Promise((resolve, _) => {
      execFile(
        '../node_modules/prisma/build/index.js',
        ['migrate', command, '--force', '--skip-generate'],
        {
          env: {
            ...process.env,
            DATABASE_URL: `${dbUrl}/${dbName}`
          }
        },
        (error, stdout, stderr) => {
          console.log(stdout)
          if (error !== null) {
            console.log(`prisma exited with error ${error.message}`)
            resolve(error.code ?? 1)
          } else {
            resolve(0)
          }
        }
      )
    })

    if (exitCode !== 0) throw Error(`command failed with exit code ${exitCode}`)
  } catch (e) {
    console.error(e)
    throw e
  }
}

;(async () => {
  for (let index = 0; index < dbCount; index++) {
    await migrateOneDb(`${testDbsPrefix}_${index + 1}`)
  }

  console.log(`All ${dbCount} databases migrated successfully`)
})()
