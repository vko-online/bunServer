import { NEW_MESSAGE } from 'src/constants/topics'
import { Context } from 'src/context'
import { Conversation, Message } from 'src/generated/type-graphql'
import { sendOrPublish } from 'src/services/broker'
import { Arg, Authorized, Ctx, Field, InputType, Mutation, ObjectType, Query, Resolver } from 'type-graphql'

@InputType()
class ConversationInput {
  @Field()
  conversationId!: string

  @Field()
  content!: string
}

@ObjectType()
export class MessageWithTargetIds {
  @Field()
  targetId!: string

  @Field()
  conversationId!: string

  @Field()
  message!: Message
}

@ObjectType()
export class BatchPayload {
  @Field()
  count!: number
}

@Resolver()
export default class ConversationResolver {
  @Authorized()
  @Query(() => [Conversation])
  async myConversations (@Ctx() context: Context): Promise<Conversation[]> {
    return await context.prisma.conversation.findMany({
      where: {
        members: {
          some: {
            id: context.currentUserId as string
          }
        }
      },
      orderBy: {
        lastMessageDate: 'desc'
      }
    })
  }

  @Authorized()
  @Mutation(() => BatchPayload)
  async markAsRead (@Arg('messageIds', () => [String], { nullable: false }) messageIds: string[], @Ctx() context: Context): Promise<BatchPayload> {
    return await context.prisma.message.updateMany({
      where: {
        id: {
          in: messageIds
        },
        NOT: {
          readByIds: {
            hasEvery: [context.currentUserId as string]
          }
        }
      },
      data: {
        readByIds: {
          push: context.currentUserId as string
        }
      }
    })
  }

  @Authorized()
  @Mutation(() => BatchPayload)
  async markAsReceived (@Arg('messageIds', () => [String], { nullable: false }) messageIds: string[], @Ctx() context: Context): Promise<BatchPayload> {
    return await context.prisma.message.updateMany({
      where: {
        id: {
          in: messageIds
        },
        NOT: {
          receivedByIds: {
            hasEvery: [context.currentUserId as string]
          }
        }
      },
      data: {
        receivedByIds: {
          push: context.currentUserId as string
        }
      }
    })
  }

  @Authorized()
  @Mutation(() => Message)
  async sendMessage (@Arg('input') input: ConversationInput, @Ctx() context: Context): Promise<Message> {
    const currentUser = await context.prisma.user.findFirst({
      where: {
        id: context.currentUserId as string
      }
    })

    const msg = await context.prisma.message.create({
      data: {
        conversation: {
          connect: {
            id: input.conversationId
          }
        },
        content: input.content,
        author: {
          connect: {
            id: context.currentUserId as string
          }
        },
        readByIds: {
          set: [context.currentUserId as string]
        },
        receivedByIds: {
          set: [context.currentUserId as string]
        }
      }
    })
    const convo = await context.prisma.conversation.update({
      where: {
        id: input.conversationId
      },
      data: {
        lastMessageAuthor: currentUser?.name,
        lastMessageContent: msg.content,
        lastMessageDate: msg.createdAt
      },
      select: {
        members: {
          select: {
            id: true
          }
        }
      }
    })

    // todo: redundant check here
    if (convo != null) {
      const [targetId] = convo.members.map(v => v.id).filter(v => v !== context.currentUserId as string)

      const messageWithTargetIds: MessageWithTargetIds = {
        targetId: targetId,
        conversationId: input.conversationId,
        message: {
          ...msg,
          createdAt: new Date(msg.createdAt) // todo: temp hack for now while scalars not added
        }
      }
      await sendOrPublish({
        topic: NEW_MESSAGE,
        data: messageWithTargetIds,
        userId: targetId,
        message: {
          badge: 1,
          title: 'You have new message',
          subtitle: `New message from ${(currentUser?.name ?? currentUser?.phone as string)}`,
          body: 'New message'
        }
      })
    }
    return msg
  }
}
