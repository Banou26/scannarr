import './patch'
import * as Prisma from 'prisma-client-generated'
import { PrismaClient } from 'prisma-client-generated'

import { getQueryResults, runQuery } from './database'
import { getAllMedia, insertMedia } from '../prisma/generated/sql'
import { PrismaBetterSQLite3AdapterFactory } from './adapter'

console.log('Prisma', Prisma)

const adapter = new PrismaBetterSQLite3AdapterFactory({ url: '' })

const prisma = new PrismaClient({ adapter })

const op = prisma.media.create({
  data: {
    id: '1',
    name: 'test',
  }
})
console.log('op', op)

// console.log('prisma', prisma)

// console.log('exec',
//   await runQuery(insertMedia, ['1', 'test'])
// )

// console.log('assetLatestPools', await getQueryResults(getAllMedia, ['test']))
