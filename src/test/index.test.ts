import { describe, it, expect } from 'vitest'

import database, { users } from '../database'

describe('drizzle', () => {
  it('should work', async () => {
    const user = { id: 1, name: 'John Doe', age: 42, email: 'john@doe.com', }
    await database.insert(users).values(user)
    expect(await database.query.users.findMany()).toEqual([user])
  })
})
