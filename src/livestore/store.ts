import { createStorePromise } from '@livestore/livestore'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { livestoreDevtoolsPlugin } from '@livestore/devtools-vite'

import { schema } from './schema'

export const store = await createStorePromise({
  schema,
  adapter: makeInMemoryAdapter(),
  storeId: 'livestore'
})

export default store
