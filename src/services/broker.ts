// send push or pubsub

import { findById } from './rethink'
import { redis } from './redis'
import { prisma } from './prisma'
import { ExpoPushMessage } from 'expo-server-sdk'
import { sendPushNotification } from './expo-push'

interface Input<T> {
  userId: string
  topic: string
  data: T
  message: Pick<ExpoPushMessage, 'badge' | 'body' | 'title' | 'subtitle'>
}

export async function sendOrPublish<T extends unknown> (input: Input<T>): Promise<void> {
  const userLive = await findById({ id: input.userId })

  if (userLive?.online === true) {
    // send sub
    const user = await prisma.user.findFirst({ where: { id: userLive.id } })
    if (user?.pushId != null) {
      await sendPushNotification([{
        to: user.pushId,
        badge: input.message.badge,
        body: input.message.body,
        data: input.data as object,
        title: input.message.title,
        subtitle: input.message.subtitle
      }])
    }
  } else {
    await redis.publish(input.topic, input.data)
  }
}
