import { Client, fetchExchange } from 'urql';
import { cacheExchange } from '@urql/exchange-graphcache'
import { createYoga, createSchema } from 'graphql-yoga'
import { useDeferStream } from '@graphql-yoga/plugin-defer-stream'

const typeDefs = /* GraphQL */ `
  type Query {
    alphabet: [String!]!
    """
    A field that resolves fast.
    """
    fastField: String!
 
    """
    A field that resolves slowly.
    Maybe you want to @defer this field ;)
    """
    slowField(waitFor: Int! = 5000): String
  }
`

const wait = (time: number) => new Promise(resolve => setTimeout(resolve, time))

const resolvers = {
  Query: {
    async *alphabet() {
      for (const character of ['a', 'b', 'c', 'd', 'e', 'f', 'g']) {
        yield character
        await wait(1000)
      }
    },
    fastField: async () => {
      await wait(100)
      return 'I am speed'
    },
    slowField: async (_, { waitFor }, info) => {
      console.log('info', info)
      await wait(waitFor)
      return 'I am slow'
    }
  }
}

const makeScannarr = async () => {
  const cache = cacheExchange({

  })

  const schema = createSchema({
    typeDefs,
    resolvers
  })

  const yoga = createYoga({
    schema,
    plugins: [useDeferStream()]
  })

  
 
  const client = new Client({
    url: 'http://localhost:3000/graphql',
    exchanges: [cache, fetchExchange],
    fetch: async (input: RequestInfo | URL, init?: RequestInit | undefined) => {
      const req = new Request(input, init)
      console.log('req', req)
      const res = await yoga.handleRequest(req, {})
      console.log('res', res)
      return res
    }
  })

  const res =
    client
      .query(`
      query SlowAndFastFieldWithDefer {
        ... on Query @defer { slowField }
        fastField
        alphabet @stream
      }
      `)
      .subscribe(({ data }) => {
        console.log('data', data)
      })

}

makeScannarr()

export default makeScannarr
