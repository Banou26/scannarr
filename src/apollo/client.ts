import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client'

import server from './server'

function iteratorToStream(iterator) {
  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await iterator.next();

      if (done) {
        controller.close();
      } else {
        controller.enqueue(value);
      }
    },
  });
}

const apolloCache = new InMemoryCache();

const fetch: (input: RequestInfo | URL, init: RequestInit) => Promise<Response> = async (_, init) => {
  if (!init.headers) throw new Error('no headers')
  if (!init.body) throw new Error('no body')
  if (typeof init.body !== 'string') throw new Error('body is not string')

  const headers = new Map<string, string>();
  for (const [key, value] of Object.entries(init.headers)) {
    if (value !== undefined) {
      headers.set(key, Array.isArray(value) ? value.join(', ') : value);
    }
  }
  const httpGraphQLRequest = {
    body: JSON.parse(init.body),
    headers,
    method: init.method,
    search: ''
  }
  const res = await server.executeHTTPGraphQLRequest({
    httpGraphQLRequest,
    context: async () => ({ req: {}, res: {} })
  })
  console.log('server res', res)
  return new Response(iteratorToStream(res.body.asyncIterator), { headers: res.headers, status: res.status })
}

export const client = new ApolloClient({
  cache: apolloCache,
  link: new HttpLink({ fetch })
})

export default client
