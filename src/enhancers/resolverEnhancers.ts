import {
  ResolversEnhanceMap,
  applyResolversEnhanceMap
} from 'src/generated/type-graphql'
import { Authorized } from 'type-graphql'

const resolversEnhanceMap: ResolversEnhanceMap = {
  User: {
    _all: [Authorized()]
  },
  Conversation: {
    _all: [Authorized()]
  },
  File: {
    _all: [Authorized()]
  },
  Interaction: {
    _all: [Authorized()]
  },
  Message: {
    _all: [Authorized()]
  }
}

applyResolversEnhanceMap(resolversEnhanceMap)
