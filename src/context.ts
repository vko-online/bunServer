import { PrismaClient } from '@prisma/client'
import express from 'express'
import jwt from 'jsonwebtoken'

export interface Context {
  prisma: PrismaClient
  currentUserId: string | null
}

let _prisma: PrismaClient

if (process.env.NODE_ENV === 'production') {
  _prisma = new PrismaClient()
} else {
  if (global.prisma == null) {
    global.prisma = new PrismaClient()
  }
  _prisma = global.prisma
}

export function createContext ({ req }: { req: express.Request }): Context {
  const bearerToken = req.headers.authorization
  if (bearerToken != null) {
    const token = bearerToken.replace('Bearer ', '')
    const verified = jwt.verify(token, process.env.JWT_SECRET as string)
    return ({
      prisma: _prisma,
      currentUserId: verified.sub as string ?? null
    })
  }
  return ({
    prisma: _prisma,
    currentUserId: null
  })
}

export const prisma = _prisma
