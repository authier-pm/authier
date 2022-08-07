import { dmmf } from '../prisma/prismaClient'
import { getPrismaRelationsFromInfo } from './getPrismaRelationsFromInfo'
import gqlInfo from './fixtures/gqlInfo.json'
import { describe, expect, it } from 'vitest'

describe('getPrismaRelationsFromInfo', () => {
  it('should ignore fields where first letter is NOT capital', async () => {
    const res = getPrismaRelationsFromInfo({
      info: {
        fieldName: 'me',
        fieldNodes: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'me' },
            arguments: [],
            directives: [],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: {
                    kind: 'Name',
                    value: 'EncryptedSecrets',
                    //@ts-expect-error
                    loc: { start: 13, end: 29 }
                  },
                  arguments: [],
                  directives: [],
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: {
                          kind: 'Name',
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
      rootModel: dmmf.modelMap.User
    })

    expect(res).toMatchInlineSnapshot(`
      {
        "EncryptedSecrets": true,
      }
    `)
  })

  it('should load even nested relation fields', async () => {
    const res = getPrismaRelationsFromInfo({
      info: gqlInfo as any,
      rootModel: dmmf.modelMap.User
    })

    expect(res).toMatchInlineSnapshot(`
      {
        "masterDevice": {
          "include": {
            "User": true,
          },
        },
      }
    `)
  })

  it.todo('should return null when there are none')
})
