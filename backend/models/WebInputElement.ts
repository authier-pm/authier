import { Field, InputType, Int } from 'type-graphql'
import { WebInputTypeGQL } from './types/WebInputType'

@InputType()
export class WebInputElement {
  @Field()
  domPath: string
  @Field(() => Int)
  domOrdinal: number
  @Field()
  url: string
  @Field(() => WebInputTypeGQL)
  kind: WebInputTypeGQL
}
