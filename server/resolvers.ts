import {
  Query,
  //   Mutation,
  //   Authorized,
  //   Arg,
  //   FieldResolver,
  //   Root,
  Resolver,
  ObjectType,
  Field,
  ID,
  Mutation,
  Arg,
  Ctx
} from 'type-graphql'
import { prisma } from './prisma'
import { hash, compare } from 'bcrypt'
import { RequestGenericInterface, FastifyReply } from 'fastify'
//import cookie from 'fastify-cookie'

import { LoginResponce, User } from './models/models'
import { createAccessToken, createRefreshToken } from './auth'

interface IContext {
  request: RequestGenericInterface
  reply: FastifyReply
}

@ObjectType()
class Recipe {
  @Field(() => ID)
  id: string

  @Field(() => String)
  title: string

  @Field(() => Number, { nullable: true })
  averageRating?: number
}

@Resolver(Recipe)
export class RecipeResolver {
  @Query(() => [Recipe])
  recipes() {
    return [
      {
        id: '1',
        title: 'aaa354'
      }
    ]
  }

  @Query(() => [User])
  async users() {
    return await prisma.user.findMany()
  }

  @Mutation(() => Boolean)
  async register(
    @Arg('email') email: string,
    @Arg('password') password: string
  ) {
    const hashedPassword = await hash(password, 12)

    try {
      await prisma.user.create({
        data: {
          email: email,
          password: hashedPassword
        }
      })
      return true
    } catch (err) {
      console.log(err)
      return false
    }
  }

  @Mutation(() => LoginResponce)
  async login(
    @Arg('email') email: string,
    @Arg('password') password: string,
    @Ctx() Ctx: IContext
  ): Promise<LoginResponce> {
    const user = await prisma.user.findUnique({
      where: {
        email: email
      }
    })

    if (!user) {
      throw new Error('Could not find user')
    }

    const valid = await compare(password, user.password)

    if (!valid) {
      throw new Error('Bad password')
    }

    //login successful
    Ctx.reply.setCookie('jid', createRefreshToken(user), {
      httpOnly: true
    })

    return {
      accessToken: createAccessToken(user)
    }
  }
}
