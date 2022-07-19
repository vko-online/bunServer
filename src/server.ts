import 'reflect-metadata'
import 'dotenv/config'
import { initRethinkDB } from 'src/services/rethink'
import { buildSchema } from 'type-graphql'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import { useServer } from 'graphql-ws/lib/use/ws'
import express from 'express'
import { ApolloServer } from 'apollo-server-express'
import { graphqlUploadExpress } from 'graphql-upload'
import {
  ApolloServerPluginLandingPageGraphQLPlayground,
  ApolloServerPluginLandingPageDisabled,
  ApolloServerPluginDrainHttpServer
} from 'apollo-server-core'
import * as path from 'path'
import { createContext, createWsContext } from './context'
import { redis } from 'src/services/redis'
import AuthResolver from './resolvers/AuthResolver'
// import * as Scalars from 'graphql-scalars'

import {
  UserCrudResolver,
  UserRelationsResolver,
  FileCrudResolver,
  FileRelationsResolver,
  MessageCrudResolver,
  MessageRelationsResolver,
  InteractionCrudResolver,
  InteractionRelationsResolver,
  ConversationCrudResolver,
  ConversationRelationsResolver
} from './generated/type-graphql'
import authChecker from './resolvers/authChecker'
import DiscoverResolver from './resolvers/DiscoverResolver'
import StateResolver from './resolvers/StateResolver'
import SubscriptionsResolver from './resolvers/SubscriptionsResolver'
import MatchmakingResolver from './resolvers/MatchmakingResolver'
import ConversationResolver from './resolvers/ConversationResolver'
import 'src/enhancers/resolverEnhancers'
import { startJobs } from 'src/services/jobs'

async function main (): Promise<void> {
  await initRethinkDB()

  const schema = await buildSchema({
    // scalarsMap: [{ type: Scalars.VoidMock, scalar: Scalars.VoidResolver }],
    resolvers: [
      UserCrudResolver,
      UserRelationsResolver,
      FileCrudResolver,
      FileRelationsResolver,
      MessageCrudResolver,
      MessageRelationsResolver,
      InteractionCrudResolver,
      InteractionRelationsResolver,
      ConversationCrudResolver,
      ConversationRelationsResolver,
      AuthResolver,
      DiscoverResolver,
      StateResolver,
      SubscriptionsResolver,
      MatchmakingResolver,
      ConversationResolver
    ],
    emitSchemaFile: path.resolve(__dirname, './generated/schema.graphql'),
    validate: false,
    authChecker,
    pubSub: redis
  })

  const app = express()
  app.use(graphqlUploadExpress())
  app.get('/ws', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'graphql-over-ws.html'))
  })
  const httpServer = createServer(app)
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql'
  })
  const serverCleanup = useServer({
    schema,
    context: createWsContext
  }, wsServer)

  const server = new ApolloServer({
    schema,
    context: createContext,
    csrfPrevention: true,
    cache: 'bounded',
    plugins: [
      process.env.NODE_ENV === 'production'
        ? ApolloServerPluginLandingPageDisabled()
        : ApolloServerPluginLandingPageGraphQLPlayground({
          subscriptionEndpoint: 'ws://localhost:3001/graphql'
        }),
      // Proper shutdown for the HTTP server.
      ApolloServerPluginDrainHttpServer({ httpServer }),

      // Proper shutdown for the WebSocket server.
      {
        async serverWillStart () {
          return {
            async drainServer () {
              await serverCleanup.dispose()
            }
          }
        }
      }
    ]
    // mocks: {
    //   Void: Scalars.VoidMock
    // }
  })
  await server.start()
  server.applyMiddleware({ app })
  startJobs()

  await new Promise<void>(resolve => app.listen({ port: 3000 }, resolve))
  console.log(`🚀 Server ready at http://localhost:3000${server.graphqlPath}`)
  await new Promise<void>(resolve => httpServer.listen(3001, resolve))
  console.log('🚀 Subscriptions ready at ws://localhost:3001/graphql')
}

main().catch(console.error)
