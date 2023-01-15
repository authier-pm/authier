import { Field, InputType } from 'type-graphql'

@InputType()
export class SecretUsageEventInput {
  @Field()
  kind: string

  @Field()
  secretId: string

  @Field({ nullable: true })
  url?: string
}
