import type { PGlite } from '@electric-sql/pglite'
import { readdirSync } from 'node:fs'
import { join } from 'path'
import * as fs from 'fs'

/**
 * Custom migration runner for PGlite that properly splits migration statements
 * PGlite doesn't support multiple statements in a prepared statement, so we need to split them
 *
 * If base.sql exists, it will be used for faster initialization instead of running all migrations
 */
export async function runMigrationsForPGlite(
  client: PGlite,
  migrationsFolder: string
) {
  const baseFilePath = join(migrationsFolder, 'base.sql')

  // Check if base.sql exists
  const useBaseSql = fs.existsSync(baseFilePath)

  if (useBaseSql) {
    const sql = fs.readFileSync(baseFilePath, 'utf-8')

    // Split on statement breakpoints
    const statements = sql
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    // console.log(`Executing ${statements.length} statements from base.sql...`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]!

      try {
        await client.exec(statement)
      } catch (error) {
        console.error(`Error in statement ${i + 1}:`, error)
        console.error(`Statement:`, statement.substring(0, 200))
        throw error
      }
    }

    // console.log('✓ Schema initialized from base.sql')
    return
  }

  // Fallback: Run individual migration files
  const files = readdirSync(migrationsFolder)
  const sqlFiles = files
    .filter((f) => f.endsWith('.sql') && f !== 'base.sql')
    .sort() // Sort to ensure migrations run in order

  console.log(`Running ${sqlFiles.length} individual migration files...`)

  for (const file of sqlFiles) {
    const filePath = join(migrationsFolder, file)
    const sql = fs.readFileSync(filePath, 'utf-8')

    // Split on statement breakpoints
    const statements = sql
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    // console.log(`  ${file}: ${statements.length} statements`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]!

      // Skip PL/pgSQL functions as PGlite doesn't support them
      if (
        statement.includes('LANGUAGE plpgsql') ||
        statement.includes('$$ LANGUAGE plpgsql')
      ) {
        console.log(`    Skipping PL/pgSQL function in statement ${i + 1}`)
        continue
      }

      try {
        await client.exec(statement)
      } catch (error) {
        console.error(`    Error in statement ${i + 1}:`, error)
        console.error(`    Statement:`, statement.substring(0, 200))
        throw error
      }
    }
  }

  // console.log('All migrations completed successfully')
}
