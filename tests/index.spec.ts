import { test } from '@japa/runner'
import { gql, ApolloClient, InMemoryCache, ApolloLink } from "@apollo/client/core"

import { makeServer } from '../src'
import { ApolloServer } from '@apollo/server'


test.group('makeServer', () => {
  test('returns an object', ({ expect }) => {
    const result = makeServer({})
    expect(result).toBeInstanceOf(Object)
  })

  test('returns an Apollo server', ({ expect }) => {
    const { server } = makeServer({})
    expect(server).toBeInstanceOf(ApolloServer)
  })

  test('returns an Apollo link', ({ expect }) => {
    const { link } = makeServer({})
    expect(link).toBeInstanceOf(ApolloLink)
  })
})
