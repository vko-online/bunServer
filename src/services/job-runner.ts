import { prisma } from 'src/services/prisma'
import { currentlyOnline } from './push-notifications'

export async function currentlyOnlineRunner (): Promise<void> {
  const users = await prisma.user.findMany({
    where: {
      online: true
    }
  })
  const hasPushUsers = users.filter(v => v.pushId)
  if (hasPushUsers.length > 0) {
    await currentlyOnline(hasPushUsers.map(item => ({ count: users.length - 1, pushId: item.pushId as string })))
  }
}
