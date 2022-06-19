import { GraphQLPositiveInt } from 'graphql-scalars'
import { Field, InputType } from 'type-graphql'
import { WebInputTypeGQL } from './types/WebInputType'

@InputType()
export class WebInputElement {
  @Field()
  domPath: string
  @Field(() => GraphQLPositiveInt)
  domOrdinal: number
  @Field()
  url: string
  @Field(() => WebInputTypeGQL)
  kind: WebInputTypeGQL
}
