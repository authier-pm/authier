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
  ID
} from 'type-graphql'

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
}