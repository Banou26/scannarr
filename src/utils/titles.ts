import type { AnitomyResult } from 'anitomyscript'

import anitomy from 'anitomyscript/dist/anitomyscript.bundle'

export const searchableTitles = async (titles: string[]): Promise<string[]> => {
  const anitomyResult = await Promise.all(titles.map(title => anitomy(title) as AnitomyResult))


  return ([
    ...new Set(
      titles
        .filter(Boolean)
        .filter(title => title.length > 3)
        .flatMap((title) => {
          const match1 = title.match(/(\d)(?:nd|rd|th) Season/i)
          const match2 = title.match(/Season (\d)/i)

          return ([
            title,
            ...match2
              ? [title.replace(/Season \d/i, `S${match2[1]}`)]
              : [],
            ...match1
              ? [title.replace(/(\d)(?:nd|rd|th) Season/i, `S${match1[1]}`)]
              : []
          ])
        })
        .filter(Boolean)
        // needed for series like mal:51096
        .map(title => title.replaceAll('(TV)', ''))
      )
  ])
}
