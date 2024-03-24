import { WebInputType } from '../../../shared/generated/graphqlBaseTypes'

export type WebInputForAutofill = {
  __typename?: 'WebInputGQLScalars'
  id?: number
  host: string
  url: string
  domPath: string
  domOrdinal: number
  kind: WebInputType
  createdAt: string
}
