import { PrismaClient } from '@prisma/client'
import express from 'express'
import { redis } from 'src/services/redis'
import { prisma } from 'src/services/prisma'
import jwt from 'jsonwebtoken'
import { RedisPubSub } from 'graphql-redis-subscriptions'
import { Context as WsContext } from 'graphql-ws'

export interface Context {
  prisma: PrismaClient
  currentUserId: string | null
  pubsub: RedisPubSub
}

export function createContext ({ req }: { req: express.Request }): Context {
  let currentUserId = null
  // if (req.)
  const bearerToken = req.headers.authorization
  if (bearerToken != null) {
    const token = bearerToken.replace('Bearer ', '')
    const verified = jwt.verify(token, process.env.JWT_SECRET as string)
    currentUserId = verified as string
  }
  return ({
    prisma: prisma,
    pubsub: redis,
    currentUserId
  })
}

export function createWsContext (ctx: WsContext): Context {
  let currentUserId = null
  if (ctx?.connectionParams?.authentication != null) {
    const token = (ctx.connectionParams.authentication as string).replace('Bearer ', '')
    const verified = jwt.verify(token, process.env.JWT_SECRET as string)
    currentUserId = verified as string
  }
  return ({
    prisma: prisma,
    pubsub: redis,
    currentUserId
  })
}
