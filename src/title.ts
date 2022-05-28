import { merge, scan, startWith } from 'rxjs'
import type { GetTitle, SearchTitles } from './targets'
import { getTarget, getTargets } from './targets'
import { TitleHandle } from './types'
import { fromUri } from './utils/uri'

const get: GetTitle = async (options) => {
  const { scheme } = 'uri' in options ? fromUri(options.uri) : options
  const target = await getTarget(scheme)
  if (!target || !target.getTitles) return
  return target.getTitles(options)
}

const search: SearchTitles = (options) => {
  const targets = getTargets()

  return merge(
    ...targets
      .filter(target => target.searchTitles)
      .map(target => target.searchTitles!(options))
  ).pipe(
    startWith([]),
    scan((acc, result) => [...acc, ...result], [] as TitleHandle[])
  )
}

export {
  get as getTitle,
  search as searchTitles
}
