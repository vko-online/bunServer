// import { prisma } from 'src/context'
import { Interaction, Message, User } from 'src/generated/type-graphql'
import { sendPushNotification } from './expo-push'

export async function itsAMatch (pushId: string, interaction: Interaction): Promise<void> {
  throw new Error('not implemented')
}

export async function youHaveNewMessage (pushId: string, msg: Message): Promise<void> {
  throw new Error('not implemented')
}

export async function newBunRegisteredNearYou (pushId: string, usr: User): Promise<void> {
  throw new Error('not implemented')
}

export async function peopleViewedYourProfile (pushId: string, usrs: User[]): Promise<void> {
  throw new Error('not implemented')
}

export async function weeklyDigestNearYou (pushId: string, len: number): Promise<void> {
  throw new Error('not implemented')
}

export async function currentlyOnline (items: Array<{ pushId: string, count: number }>): Promise<void> {
  await sendPushNotification(items.map((item) => ({
    to: item.pushId,
    title: `Currently there is ${item.count} online!`
  })))
}
