import { RedisPubSub } from 'graphql-redis-subscriptions'
import Redis from 'ioredis'

let _redis: RedisPubSub

const redisOptions = {
  password: process.env.REDIS_PASSWORD,
  host: process.env.REDIS_IP,
  port: Number(process.env.REDIS_PORT),
  retryStrategy: (times: number) => {
    // reconnect after
    return Math.min(times * 50, 2000)
  }
}

if (process.env.NODE_ENV === 'production') {
  _redis = new RedisPubSub({
    publisher: new Redis(redisOptions),
    subscriber: new Redis(redisOptions)
  })
} else {
  if (global.redis == null) {
    global.redis = new RedisPubSub({
      publisher: new Redis(redisOptions),
      subscriber: new Redis(redisOptions)
    })
  }
  _redis = global.redis
}

export const redis = _redis
