import { NEW_MESSAGE } from 'src/constants/topics'
import { Context } from 'src/context'
import { Message } from 'src/generated/type-graphql'
import { sendOrPublish } from 'src/services/broker'
import { Arg, Authorized, Ctx, Field, InputType, Mutation, ObjectType, Resolver } from 'type-graphql'

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

@Resolver()
export default class ConversationResolver {
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
        message: msg
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
