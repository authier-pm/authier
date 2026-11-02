import { afterEach, describe, expect, it, vi } from 'vitest'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import {
  createRequestDb,
  databaseConnectionString,
  db,
  withDatabase
} from './prismaClient'

vi.hoisted(() => vi.resetModules())
vi.mock('postgres', () => ({ default: vi.fn() }))
vi.mock('drizzle-orm/postgres-js', () => ({ drizzle: vi.fn() }))

afterEach(() => vi.clearAllMocks())

const fixture = () => {
  const end = vi.fn().mockResolvedValue(undefined)
  const client = { end } as unknown as ReturnType<typeof postgres>
  const execute = vi.fn().mockResolvedValue([])
  const database = { execute } as unknown as ReturnType<typeof drizzle>
  vi.mocked(postgres).mockReturnValueOnce(client)
  vi.mocked(drizzle).mockReturnValueOnce(database)
  return { end, database, execute }
}

describe('Worker database lifecycle', () => {
  it('prefers Hyperdrive over a stale Neon environment variable', () => {
    expect(
      databaseConnectionString({
        DATABASE_URL: 'postgres://old-neon',
        HYPERDRIVE: { connectionString: 'postgres://hyperdrive' }
      })
    ).toBe('postgres://hyperdrive')
    expect(databaseConnectionString({ DATABASE_URL: 'postgres://local' })).toBe(
      'postgres://local'
    )
    expect(() => databaseConnectionString({})).toThrow(
      'Database is not configured'
    )
  })

  it('shares a connection with legacy helpers and closes it on success', async () => {
    const connection = fixture()
    await withDatabase(
      { HYPERDRIVE: { connectionString: 'postgres://hyperdrive' } },
      async () => {
        expect(createRequestDb().db).toBe(connection.database)
        await db.execute('SELECT 1')
        await createRequestDb().close()
        expect(connection.end).not.toHaveBeenCalled()
      }
    )
    expect(connection.execute).toHaveBeenCalledWith('SELECT 1')
    expect(connection.end).toHaveBeenCalledOnce()
    expect(postgres).toHaveBeenCalledWith(
      'postgres://hyperdrive',
      expect.objectContaining({
        max: 1,
        connect_timeout: 10,
        fetch_types: false
      })
    )
  })

  it('closes failed work without replaying it', async () => {
    const connection = fixture()
    const failure = new Error('transaction failed')
    const work = vi.fn(() => {
      throw failure
    })
    await expect(
      withDatabase({ DATABASE_URL: 'postgres://local' }, work)
    ).rejects.toBe(failure)
    expect(connection.end).toHaveBeenCalledOnce()
    expect(work).toHaveBeenCalledOnce()
  })

  it('keeps overlapping Worker invocations isolated', async () => {
    const first = fixture()
    const second = fixture()
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    const pending = withDatabase(
      { DATABASE_URL: 'postgres://first' },
      async () => {
        expect(createRequestDb().db).toBe(first.database)
        await gate
        expect(createRequestDb().db).toBe(first.database)
      }
    )
    await withDatabase({ DATABASE_URL: 'postgres://second' }, async () => {
      expect(createRequestDb().db).toBe(second.database)
    })
    release()
    await pending
    expect(first.end).toHaveBeenCalledOnce()
    expect(second.end).toHaveBeenCalledOnce()
  })
})
