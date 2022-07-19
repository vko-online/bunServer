import { Context } from 'src/context'
import { Resolver, InputType, Field, Arg, Ctx, Authorized, Mutation } from 'type-graphql'
import { Decision, Interaction } from 'src/generated/type-graphql'
import { ITS_A_MATCH } from 'src/constants/topics'
import { sendOrPublish } from 'src/services/broker'

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
  async interact (
    @Arg('input', type => InteractionInput) input: InteractionInput,
      @Ctx() context: Context): Promise<Interaction> {
    const existingInteraction = await context.prisma.interaction.findFirst({
      where: {
        author: {
          id: input.targetId
        },
        target: {
          id: context.currentUserId as string
        }
      }
    })

    // tryind to interact when already interacted
    const duplicateInteraction = await context.prisma.interaction.findFirst({
      where: {
        author: {
          id: context.currentUserId as string
        },
        target: {
          id: input.targetId
        }
      }
    })

    if (duplicateInteraction != null) {
      // update existing and return
      return await context.prisma.interaction.update({
        where: {
          id: duplicateInteraction.id
        },
        data: {
          decision: input.decision
        }
      })
    }

    const currentUser = await context.prisma.user.findFirst({
      where: {
        id: context.currentUserId as string
      }
    })

    if (existingInteraction != null) {
      // matched
      const updatedInteraction = await context.prisma.interaction.update({
        where: {
          id: existingInteraction.id
        },
        data: {
          matched: true
        }
      })

      const targetUser = await context.prisma.user.findFirst({
        where: {
          id: input.targetId
        }
      })

      await sendOrPublish({
        userId: targetUser?.id as string,
        data: updatedInteraction,
        message: {
          title: 'It\'s a Match!',
          subtitle: 'Start chatting now',
          badge: 1,
          body: `You have a new Match with ${currentUser?.name as string}`
        },
        topic: ITS_A_MATCH
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
