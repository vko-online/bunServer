import { Context } from 'src/context'
import { Resolver, InputType, Field, Arg, Ctx, Authorized, Mutation } from 'type-graphql'
import { addPosition } from 'src/services/rethink'
// import { VoidMock } from 'graphql-scalars'

@InputType()
class StateInput {
  @Field(() => Boolean, { nullable: false })
  online!: boolean

  @Field(() => Number, { nullable: false })
  latitude!: number

  @Field(() => Number, { nullable: false })
  longitude!: number
}

@Resolver()
export default class StateResolver {
  @Authorized()
  @Mutation(() => Boolean, { nullable: true }) // prisma resolver
  async updateState (@Arg('input', type => StateInput) input: StateInput, @Ctx() context: Context): Promise<boolean> {
    await context.prisma.user.update({
      where: {
        id: context.currentUserId as string
      },
      data: {
        online: input.online,
        latitude: input.latitude,
        longitude: input.longitude
      }
    })
    await addPosition({
      id: context.currentUserId as string,
      lat: input.latitude,
      lon: input.longitude,
      online: input.online
    })
    return true
  }
  // todo: add rethindb resolver
}
