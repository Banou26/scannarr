import { merge, scan } from 'rxjs'
import type { GetTitle, SearchTitles } from './targets'
import { getTarget, getTargets } from './targets'
import { TitleHandle } from './types'
import { fromUri } from './utils/uri'

const get: GetTitle = async (options) => {
  const { scheme } = 'uri' in options ? fromUri(options.uri) : options
  const target = await getTarget(scheme)
  return target.getTitles(options)
}

const search: SearchTitles = (options) => {
  const targets = getTargets()

  return merge(
    ...targets.map(target => target.searchTitles(options))
  ).pipe(
    scan((acc, result) => [...acc, ...result], [] as TitleHandle[])
  )
}

export {
  get as getTitle,
  search as searchTitles
}
