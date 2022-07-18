import { Context } from 'src/context'
import { Resolver, InputType, Field, Arg, Ctx, Authorized, Mutation } from 'type-graphql'
import { Decision, Interaction } from 'src/generated/type-graphql'

@InputType()
class InteractionInput {
  @Field(() => String, { nullable: false })
  targetId!: string

  @Field(() => Decision, { nullable: false })
  decision!: Decision
}

@Resolver()
export default class MatchmakingResolver {
  @Authorized()
  @Mutation(() => Interaction) // prisma resolver
  async interact (@Arg('input', type => InteractionInput) input: InteractionInput, @Ctx() context: Context): Promise<Interaction> {
    const existing = await context.prisma.interaction.findFirst({
      where: {
        author: {
          id: input.targetId
        },
        target: {
          id: context.currentUserId as string
        }
      }
    })

    if (existing != null) {
      // matched
      await context.prisma.interaction.update({
        where: {
          id: existing.id
        },
        data: {
          matched: true
        }
      })
      // notify other part
      await context.prisma.conversation.create({
        data: {
          members: {
            connect: [{
              id: input.targetId
            }, {
              id: context.currentUserId as string
            }]
          }
        }
      })
      return await context.prisma.interaction.create({
        data: {
          decision: input.decision,
          target: {
            connect: {
              id: input.targetId
            }
          },
          author: {
            connect: {
              id: context.currentUserId as string
            }
          },
          matched: true
        }
      })
    } else {
      return await context.prisma.interaction.create({
        data: {
          decision: input.decision,
          target: {
            connect: {
              id: input.targetId
            }
          },
          author: {
            connect: {
              id: context.currentUserId as string
            }
          },
          matched: false
        }
      })
    }
  }
  // todo: add rethindb resolver
}
