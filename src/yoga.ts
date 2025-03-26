import { createYoga, createSchema } from 'graphql-yoga'

const typeDefs = `
type Query {
  _: String
}
`

const schema = createSchema({
  typeDefs,
  resolvers: {

  }
})

const server = createYoga({
  maskedErrors: false,
  schema
})
