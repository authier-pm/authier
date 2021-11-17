import { Field, ObjectType } from 'type-graphql'
import { EncryptedSecretGQL } from './generated/EncryptedSecret'

@ObjectType()
export class EncryptedSecretQuery extends EncryptedSecretGQL {}

@ObjectType()
export class EncryptedSecretMutation extends EncryptedSecretQuery {
  @Field(() => EncryptedSecretGQL)
  update() {
    throw new Error('Method not implemented.')
  }
}
