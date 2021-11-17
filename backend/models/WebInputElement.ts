import { Field, InputType } from 'type-graphql'
import { WebInputTypeGQL } from './types/WebInputType'

@InputType()
export class WebInputElement {
  @Field()
  domPath: string
  @Field()
  url: string
  @Field(() => WebInputTypeGQL)
  kind: WebInputTypeGQL
}
