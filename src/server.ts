import 'reflect-metadata'
import 'dotenv/config'
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

async function main (): Promise<void> {
  const schema = await buildSchema({
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
      ConversationRelationsResolver
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
    ]
  })
  await server.start()
  const app = express()
  app.use(graphqlUploadExpress())
  server.applyMiddleware({ app })
  await new Promise<void>(resolve => app.listen({ port: 3000 }, resolve))
  console.log(`🚀 Server ready at http://localhost:3000${server.graphqlPath}`)
}

main().catch(console.error)
