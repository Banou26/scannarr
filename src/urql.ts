import { Client, fetchExchange } from 'urql';
import { cacheExchange } from '@urql/exchange-graphcache'
import { createYoga, createSchema } from 'graphql-yoga'
import { useDeferStream } from '@graphql-yoga/plugin-defer-stream'

const typeDefs = /* GraphQL */ `
  type Test {
    uri: String!
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
  type Query {
    test: Test
  }
`

const wait = (time: number) => new Promise(resolve => setTimeout(resolve, time))

const resolvers = {
  Query: {
    test: () => ({
      uri: 'foo',
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
      slowField: async ({ waitFor }, info) => {
        // console.log('info', waitFor, info)
        await wait(waitFor)
        return 'I am slow'
      }
    })
  }
}

const makeScannarr = async () => {
  const cache = cacheExchange({
    keys: {
      Test: (data) => data.uri
    },
    // updates: {
    //   Test: {
    //     slowField: (parent, args, cache, info) => {
    //       console.log('update slowField', parent, args, cache, info)
    //       return `I am slow, and modified, ${parent.alphabet?.length ?? 0}`
    //     }
    //   }
    // },
    resolvers: {
      Test: {
        fastField: (parent, args, cache, info) => {
          // console.log('read slowField', parent, args, cache, info)
          return `I am speed, and modified, and there is ${cache.resolve({ __typename: 'Test', uri: 'foo' }, 'alphabet')?.length ?? 0} alphabet elements`
        }
      }
    }
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
        test {
          uri
          ... on Test @defer { slowField }
          fastField
          alphabet @stream
        }
      }
      `)
      .subscribe(({ data, error }) => {
        console.log('data', data?.test, error)
      })

}

makeScannarr()

export default makeScannarr
