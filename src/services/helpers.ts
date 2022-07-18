import { prisma } from 'src/context'

export async function removePushId (pushIds: string[]): Promise<void> {
  for (const pushId of pushIds) {
    const user = await prisma.user.findFirst({
      where: {
        pushId
      }
    })
    if (user != null) {
      await prisma.user.update({
        where: {
          id: user.id
        },
        data: {
          pushId: null
        }
      })
    }
  }
}
