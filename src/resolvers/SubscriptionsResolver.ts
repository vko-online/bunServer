import { Args, Field, ArgsType, Resolver, Root, Subscription } from 'type-graphql'
import { redis } from 'src/services/redis'
import { ITS_A_MATCH, NEW_MESSAGE } from 'src/constants/topics'
import { withFilter } from 'graphql-subscriptions'
import { Interaction } from 'src/generated/type-graphql'
import { MessageWithTargetIds } from './ConversationResolver'

@ArgsType()
class GenericListenerArgs {
  @Field()
  currentUserId!: string
}

@Resolver()
export default class SubscriptionsResolver {
  @Subscription(() => Interaction, {
    subscribe: withFilter(() => redis.asyncIterator(ITS_A_MATCH), (payload: Interaction, variables: GenericListenerArgs) => {
      return payload.authorId === variables.currentUserId
    })
  })
  async newMatch (
    @Root() payload: Interaction,
      @Args() args: GenericListenerArgs
  ): Promise<Interaction> {
    return payload
  }

  @Subscription(() => MessageWithTargetIds, {
    subscribe: withFilter(() => redis.asyncIterator(NEW_MESSAGE), (payload: MessageWithTargetIds, variables: GenericListenerArgs) => {
      return payload.targetId === variables.currentUserId
    })
  })
  async newMessage (
    @Root() payload: MessageWithTargetIds,
      @Args() args: GenericListenerArgs
  ): Promise<MessageWithTargetIds> {
    return payload
  }
}
