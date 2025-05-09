import { getQueryResults, runQuery } from './database'
import { getAllMedia, insertMedia } from '../prisma/generated/sql'

console.log('exec',
  await runQuery(insertMedia, ['1', 'test'])
)

console.log('assetLatestPools', await getQueryResults(getAllMedia, ['test']))
