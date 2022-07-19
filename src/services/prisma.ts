import { PrismaClient } from '@prisma/client'

let _prisma: PrismaClient

if (process.env.NODE_ENV === 'production') {
  _prisma = new PrismaClient()
} else {
  if (global.prisma == null) {
    global.prisma = new PrismaClient()
  }
  _prisma = global.prisma
}

export const prisma = _prisma

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
