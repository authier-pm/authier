import { Field, ID, ObjectType } from 'type-graphql'
import { DeviceGQL } from './Device'

@ObjectType()
export class VaultUnlockEventsGQL {
  @Field(() => ID)
  id: number

  @Field()
  deviceIp: string

  @Field({ nullable: true })
  approvedFromIp?: string

  @Field({ nullable: true })
  approvedAt?: Date

  @Field()
  deviceId: string

  @Field(() => DeviceGQL)
  device: DeviceGQL

  @Field({ nullable: true })
  approvedFromDeviceId?: string

  @Field(() => DeviceGQL, { nullable: true })
  approvedFromDevice?: DeviceGQL

  // skip overwrite 👇
}
