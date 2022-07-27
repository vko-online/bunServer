import jwt from 'jsonwebtoken'
import { User } from 'src/generated/type-graphql'
import { prisma } from 'src/services/prisma'

export default async function isAuthenticated (token?: string): Promise<User | null> {
  try {
    if (token != null && token.length > 0) {
      const rawToken = token.replace('Bearer ', '')
      const id = jwt.verify(rawToken, process.env.SECRET as string) as string
      if (id != null) {
        return await prisma.user.findFirst({ where: { id } })
      }
      return null
    }
    return null
  } catch (e) {
    console.warn(e)
    throw new Error('Not Authorized!')
  }
}
