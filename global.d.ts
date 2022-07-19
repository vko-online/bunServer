import { PrismaClient } from '@prisma/client'
import { RedisPubSub } from 'graphql-redis-subscriptions'

declare global {
  var prisma: PrismaClient
  var redis: RedisPubSub
}
