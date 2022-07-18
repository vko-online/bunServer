import { Context } from 'src/context'
import { User } from 'src/generated/type-graphql'
import { Resolver, InputType, Field, Arg, Ctx, Query, Authorized } from 'type-graphql'
import { findNearest, findById } from 'src/services/state'
import { UserInputError } from 'apollo-server-core'

@InputType()
class DiscoverInput {
  @Field(() => Number, { nullable: true })
  from?: number

  @Field(() => Number, { nullable: true })
  to?: number
}

@Resolver()
export default class DiscoverResolver {
  @Authorized()
  @Query(() => [User]) // prisma resolver
  async discover (@Arg('input', type => DiscoverInput) input: DiscoverInput, @Ctx() context: Context): Promise<User[]> {
    let dobFilter: any
    if (input.from != null) {
      const now = new Date()
      const from = new Date(now.getFullYear() - input.from, 0, 1)
      dobFilter = {
        lte: from
      }
    }
    if (input.to != null) {
      const now = new Date()
      const to = new Date(now.getFullYear() - input.to, 0, 1)
      dobFilter = {
        gte: to
      }
    }
    const user = await context.prisma.user.findFirst({ where: { id: context.currentUserId as string } })

    return await context.prisma.user.findMany({
      where: {
        city: user?.city,
        identity: user?.looking,
        looking: user?.identity,
        dob: dobFilter,
        country: user?.country
      }
    })
  }

  // todo: add rethindb resolver
  @Authorized()
  @Query(() => [User]) // prisma resolver
  async discoverLive (@Arg('input', type => DiscoverInput) input: DiscoverInput, @Ctx() context: Context): Promise<User[]> {
    let dobFilter: any
    if (input.from != null) {
      const now = new Date()
      const from = new Date(now.getFullYear() - input.from, 0, 1)
      dobFilter = {
        lte: from
      }
    }
    if (input.to != null) {
      const now = new Date()
      const to = new Date(now.getFullYear() - input.to, 0, 1)
      dobFilter = {
        gte: to
      }
    }
    const user = await context.prisma.user.findFirst({ where: { id: context.currentUserId as string } })

    const userlocation = await findById({ id: context.currentUserId as string })
    if (userlocation == null) {
      throw new UserInputError('No location data provided')
    }
    const userLocations = await findNearest({ lat: userlocation.location.coordinates[0], lon: userlocation.location.coordinates[1] })

    return await context.prisma.user.findMany({
      where: {
        city: user?.city,
        identity: user?.looking,
        looking: user?.identity,
        dob: dobFilter,
        country: user?.country,
        id: {
          in: userLocations.map(v => v.doc.id)
        }
      }
    })
  }
}
