// import './patch'
// import * as Prisma from '../prisma/generated/edge'
// import * as Prisma from '../prisma/generated/edge'
// import { PrismaClient } from 'prisma-client-generated/edge'
// import * as Prisma from 'prisma-client-generated/generated/client'
// import * as Prisma from 'prisma-client-generated/edge'
// import * as Prisma from '../prisma/generated/edge'
// import { PrismaD1 } from '@prisma/adapter-d1'
// import { PrismaD1HTTP } from '@prisma/adapter-d1'

// const CLOUDFLARE_D1_TOKEN = import.meta.env.CLOUDFLARE_D1_TOKEN
// const CLOUDFLARE_ACCOUNT_ID = import.meta.env.CLOUDFLARE_ACCOUNT_ID
// const CLOUDFLARE_DATABASE_ID = import.meta.env.CLOUDFLARE_DATABASE_ID

// const adapter = new PrismaD1HTTP({
//   CLOUDFLARE_D1_TOKEN,
//   CLOUDFLARE_ACCOUNT_ID,
//   CLOUDFLARE_DATABASE_ID,
// })

// console.log('Prisma', Prisma)

// const Prisma = await import('../prisma/generated/edge')


import * as Prisma from 'prisma-client-generated/generated/edge'
const { PrismaClient } = Prisma
// import { PrismaClient } from 'prisma-client-generated/generated/client'

const prisma = new PrismaClient({ datasourceUrl: 'file:./dev.db' })

const op = await prisma.media.create({
  data: {
    id: '1',
    name: 'test',
  }
})

console.log('op', op)

// import './patch'
// import * as Prisma from 'prisma-client-generated'
// import { PrismaClient } from 'prisma-client-generated'

// import { getQueryResults, runQuery } from './database'
// import { getAllMedia, insertMedia } from '../prisma/generated/sql'
// import { PrismaBetterSQLite3AdapterFactory } from './adapter'

// console.log('Prisma', Prisma)

// const adapter = new PrismaBetterSQLite3AdapterFactory({ url: '' })

// const prisma = new PrismaClient({ adapter })

// const op = prisma.media.create({
//   data: {
//     id: '1',
//     name: 'test',
//   }
// })
// console.log('op', op)

// // console.log('prisma', prisma)

// // console.log('exec',
// //   await runQuery(insertMedia, ['1', 'test'])
// // )

// // console.log('assetLatestPools', await getQueryResults(getAllMedia, ['test']))
