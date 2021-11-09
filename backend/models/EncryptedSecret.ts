import { Field, ObjectType } from 'type-graphql'
import { EncryptedSecret } from '../generated/typegraphql-prisma'

@ObjectType()
export class EncryptedSecretQuery extends EncryptedSecret {}

@ObjectType()
export class EncryptedSecretMutation extends EncryptedSecretQuery {
  @Field(() => EncryptedSecret)
  update() {
    throw new Error('Method not implemented.')
  }
}
