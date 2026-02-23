import { getPrismaRelationsFromGQLInfo } from './getPrismaRelationsFromInfo'
import gqlInfo from './fixtures/gqlInfo.json'
import { describe, expect, it } from 'vitest'
import { Kind } from 'graphql'

describe('getPrismaRelationsFromInfo', () => {
  it('should return null since Drizzle does not use DMMF', async () => {
    const res = getPrismaRelationsFromGQLInfo({
      info: {
        fieldName: 'me',
        fieldNodes: [
          {
            kind: Kind.FIELD,
            name: { kind: Kind.NAME, value: 'me' },
            arguments: [],
            directives: [],
            selectionSet: {
              kind: Kind.SELECTION_SET,
              selections: [
                {
                  kind: Kind.FIELD,
                  name: {
                    kind: Kind.NAME,
                    value: 'EncryptedSecrets',
                    //@ts-expect-error
                    loc: { start: 13, end: 29 }
                  },
                  arguments: [],
                  directives: [],
                  selectionSet: {
                    kind: Kind.SELECTION_SET,
                    selections: [
                      {
                        kind: Kind.FIELD,
                        name: {
                          kind: Kind.NAME,
                          value: 'id',
                          //@ts-expect-error
                          loc: { start: 38, end: 40 }
                        },
                        arguments: [],
                        directives: [],
                        //@ts-expect-error
                        loc: { start: 38, end: 40 }
                      }
                    ],
                    //@ts-expect-error
                    loc: { start: 30, end: 46 }
                  },
                  //@ts-expect-error
                  loc: { start: 13, end: 46 }
                }
              ],
              //@ts-expect-error
              loc: { start: 7, end: 50 }
            },
            //@ts-expect-error
            loc: { start: 4, end: 50 }
          }
        ]
      },
      rootModel: {}
    })

    expect(res).toBe(null)
  })

  it.todo('should be replaced with Drizzle relation loading tests')
})
