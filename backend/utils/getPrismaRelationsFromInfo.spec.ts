import { getPrismaRelationsFromInfo } from './getPrismaRelationsFromInfo'

describe('getPrismaRelationsFromInfo', () => {
  it('should ignore fields where first letter is NOT capital', async () => {
    getPrismaRelationsFromInfo({
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
                  value: 'encryptedSecrets',
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
    })
  })
})
