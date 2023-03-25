import type { TestHooksCleanupHandler, TestContext } from '@japa/core'
import type { MakeServerOptions } from '../src/server'

import { ApolloClient, InMemoryCache } from '@apollo/client/core'

import { makeServer } from '../src'

export const setupApollo = async (
  { cleanup, ...rest }: MakeServerOptions & { cleanup: (handler: TestHooksCleanupHandler<TestContext>) => void }
) => {
  const { server, link } = makeServer(rest)
  cleanup(() => server.stop())
  await server.start()
  const client = new ApolloClient({ cache: new InMemoryCache(), link })
  return {
    client,
    server,
    link
  }
}
