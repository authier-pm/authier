import { prisma } from '../prisma'
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Int,
  ObjectType,
  UseMiddleware
} from 'type-graphql'
import { IContext } from '../RootResolver'

@ObjectType()
export class Device {
  @Field(() => String)
  firstIpAdress: string

  @Field(() => String)
  lastIpAdress: string

  @Field(() => String)
  firebaseToken: string

  @Field(() => String)
  name: string
}
