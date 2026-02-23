import { Field, InputType } from 'type-graphql'

@InputType()
export class SecretUsageEventInput {
  @Field(() => String)
  kind: string

  @Field(() => String)
  secretId: string

  @Field(() => String, { nullable: true })
  url?: string
}
