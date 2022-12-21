import { GraphQLNonNegativeInt } from 'graphql-scalars'
import { Field, InputType } from 'type-graphql'
import { WebInputTypeGQL } from './types/WebInputType'

@InputType()
export class WebInputElement {
  @Field()
  domPath: string
  @Field(() => GraphQLNonNegativeInt, {
    description:
      'The index of the input element on the page (0-based). We are not able to always generate a css selector which matches only one element. Here the domOrdinal comes in and saves the day.'
  })
  domOrdinal: number
  @Field()
  url: string
  @Field(() => WebInputTypeGQL)
  kind: WebInputTypeGQL
}
