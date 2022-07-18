// https://github.com/expo/expo-server-sdk-node

// TODO store receipts in db, and run cron to check error codes
// if you receive DeviceNotRegistered and keep sending
// app will be blocked, so need to remove token from user table

import { Expo, ExpoPushErrorReceipt, ExpoPushMessage, ExpoPushSuccessTicket, ExpoPushTicket } from 'expo-server-sdk'
import { removePushId } from './helpers'
// Create a new Expo SDK client
// optionally providing an access token if you have enabled push security
const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN })

// Create the messages that you want to send to clients

// The Expo push notification service accepts batches of notifications so
// that you don't need to send 1000 requests to send 1000 notifications. We
// recommend you batch your notifications to reduce the number of requests
// and to compress them (notifications with similar content will get
// compressed).
let tickets: ExpoPushTicket[] = []
export async function sendPushNotification (messages: ExpoPushMessage[]): Promise<void> {
  const chunks = expo.chunkPushNotifications(messages)
  // Send the chunks to the Expo push notification service. There are
  // different strategies you could use. A simple one is to send one chunk at a
  // time, which nicely spreads the load out over time:
  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk)
      for (const part of ticketChunk) {
        if (part.status === 'error') {
          if (part.details?.error === 'DeviceNotRegistered') {
            await removePushId(chunk.flatMap(v => v.to))
          }
        }
      }
      console.log(ticketChunk)
      tickets.push(...ticketChunk)
      // NOTE: If a ticket contains an error code in ticket.details.error, you
      // must handle it appropriately. The error codes are listed in the Expo
      // documentation:
      // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
    } catch (error) {
      console.error(error)
    }
  }
}

// Later, after the Expo push notification service has delivered the
// notifications to Apple or Google (usually quickly, but allow the the service
// up to 30 minutes when under load), a "receipt" for each notification is
// created. The receipts will be available for at least a day; stale receipts
// are deleted.
//
// The ID of each receipt is sent back in the response "ticket" for each
// notification. In summary, sending a notification produces a ticket, which
// contains a receipt ID you later use to get the receipt.
//
// The receipts may contain error codes to which you must respond. In
// particular, Apple or Google may block apps that continue to send
// notifications to devices that have blocked notifications or have uninstalled
// your app. Expo does not control this policy and sends back the feedback from
// Apple and Google so you can handle it appropriately.

export async function receiptCheck (): Promise<void> {
  const receiptIds = []
  for (const ticket of tickets) {
    // NOTE: Not all tickets have IDs; for example, tickets for notifications
    // that could not be enqueued will have error information and no receipt ID.
    if ((ticket as ExpoPushSuccessTicket).id != null) {
      receiptIds.push((ticket as ExpoPushSuccessTicket).id)
    }
  }

  const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds)
  // Like sending notifications, there are different strategies you could use
  // to retrieve batches of receipts from the Expo service.
  for (const chunk of receiptIdChunks) {
    try {
      const receipts = await expo.getPushNotificationReceiptsAsync(chunk)
      console.log(receipts)

      // The receipts specify whether Apple or Google successfully received the
      // notification and information about an error, if one occurred.
      for (const receiptId in receipts) {
        const { status, details } = receipts[receiptId]
        if (status === 'ok') {
          continue
        } else if (status === 'error') {
          console.error(
            `There was an error sending a notification: ${(receipts[receiptId] as ExpoPushErrorReceipt).message}`
          )
          if (details?.error != null) {
            if (details.error === 'DeviceNotRegistered') {
              // await removePushId(chunk.flatMap(v => v.to))
              // remove pushId from user
              // await prisma.user.update({
              //   where: {

              //   }
              // })
            }
            // The error codes are listed in the Expo documentation:
            // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
            // You must handle the errors appropriately.
            console.error(`The error code is ${details.error}`)
          }
        }
      }
    } catch (error) {
      console.error(error)
    }
  }
  tickets = []
}
