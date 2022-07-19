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

function buildContext (bearerToken: string | undefined | null): Context {
  let currentUserId = null
  console.log('bearerToken', bearerToken)
  if (bearerToken?.includes('Bearer') === true) {
    const token = bearerToken.replace('Bearer ', '')
    const verified = jwt.verify(token, process.env.JWT_SECRET as string)
    currentUserId = verified as string
  }
  return {
    prisma: prisma,
    pubsub: redis,
    currentUserId
  }
}

export function createContext ({ req }: { req: express.Request }): Context {
  return buildContext(req.headers.authorization)
}

export function createWsContext (ctx: WsContext): Context {
  return buildContext(ctx?.connectionParams?.authentication as string)
}
