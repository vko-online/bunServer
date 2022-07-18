import 'reflect-metadata'
import 'dotenv/config'
import { init } from 'src/services/state'
import { buildSchema } from 'type-graphql'
import express from 'express'
import { ApolloServer } from 'apollo-server-express'
import { graphqlUploadExpress } from 'graphql-upload'
import {
  ApolloServerPluginLandingPageGraphQLPlayground,
  ApolloServerPluginLandingPageDisabled
} from 'apollo-server-core'
import * as path from 'path'
import { createContext } from './context'
import AuthResolver from './resolvers/AuthResolver'
import * as Scalars from 'graphql-scalars'

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
import 'src/enhancers/resolverEnhancers'
import { startJobs } from 'src/services/jobs'

async function main (): Promise<void> {
  await init()
  const schema = await buildSchema({
    scalarsMap: [{ type: Scalars.VoidMock, scalar: Scalars.VoidResolver }],
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
      StateResolver
    ],
    emitSchemaFile: path.resolve(__dirname, './generated/schema.graphql'),
    validate: false,
    authChecker
  })

  const server = new ApolloServer({
    schema,
    context: createContext,
    csrfPrevention: true,
    cache: 'bounded',
    plugins: [
      process.env.NODE_ENV === 'production'
        ? ApolloServerPluginLandingPageDisabled()
        : ApolloServerPluginLandingPageGraphQLPlayground()
    ],
    mocks: {
      Void: Scalars.VoidMock
    }
  })
  await server.start()
  const app = express()
  app.use(graphqlUploadExpress())
  server.applyMiddleware({ app })
  startJobs()

  await new Promise<void>(resolve => app.listen({ port: 3000 }, resolve))
  console.log(`🚀 Server ready at http://localhost:3000${server.graphqlPath}`)
}

main().catch(console.error)
