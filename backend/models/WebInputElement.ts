import { Field, InputType } from 'type-graphql'
import { WebInputType } from '../generated/typegraphql-prisma/enums/WebInputType'

@InputType()
export class WebInputElement {
  @Field()
  domPath: string
  @Field()
  url: string
  @Field(() => WebInputType)
  kind: WebInputType
}
