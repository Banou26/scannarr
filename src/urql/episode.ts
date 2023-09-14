import { Cache, DataFields, ResolveInfo, Variables } from '@urql/exchange-graphcache'
import { ServerContext } from '.'
import { Episode } from '../generated/graphql'
import { OriginWithResolvers } from '../server'
import { isScannarrUri, toScannarrId, toScannarrUri } from '../utils/uri2'
import { getOriginResults, getOriginResultsStreamed, groupRelatedHandles, makeArrayResolver, makeObjectResolver, makeScalarResolver, makeScannarrHandle } from './utils'
import { populateMedia } from './media'

export const populateEpisode = (episode: Episode, resolve?: (ref: any, str: string) => any) => ({
  __typename: 'Episode',
  origin: (resolve ? resolve(episode, 'origin') : episode.origin) ?? episode.origin,
  id: (resolve ? resolve(episode, 'id') : episode.id) ?? episode.id,
  uri: (resolve ? resolve(episode, 'uri') : episode.uri) ?? episode.uri,
  url: (resolve ? resolve(episode, 'url') : (episode.url ?? '')) ?? '',
  handles:
  // console.log(
  //   'populateEpisode',
  //   episode,
  //   episode.handles,
  //   episode.handles?.edges.map(edge =>
  //     typeof edge.node === 'string'
  //       ? ({ node: edge.node, __typename: 'EpisodeEdge' })
  //       : ({
  //         ...edge,
  //         node: populateEpisode(edge.node),
  //         __typename: 'EpisodeEdge'
  //       })  
  //   ) ?? []
  // ) ||
  (episode.handles ?? {
    __typename: 'EpisodeConnection',
    edges:
      typeof episode.handles?.edges === 'function'
        ? (
          async function *() {
            for await (const edge of episode.handles?.edges()) {
              yield {
                ...edge,
                node: populateEpisode(edge.node),
                __typename: 'EpisodeEdge'
              }
            }
          }
        )
        : (
          episode.handles?.edges.map(edge =>
            typeof edge.node === 'string'
              ? ({ node: edge.node, __typename: 'EpisodeEdge' })
              : ({
                ...edge,
                node: populateEpisode(edge.node),
                __typename: 'EpisodeEdge'
              })  
          ) ?? []
        )
  }),

  title: episode.title ?? {
    romanized: null,
    english: null,
    native: null,
  },

  mediaUri: resolve ? resolve(episode, 'mediaUri') : (episode.mediaUri ?? null),

  number: resolve ? resolve(episode, 'number') : (episode.number ?? null),
  description: resolve ? resolve(episode, 'description') : (episode.description ?? null),
  thumbnail: resolve ? resolve(episode, 'thumbnail') : (episode.thumbnail ?? null),
  timeUntilAiring: resolve ? resolve(episode, 'timeUntilAiring') : (episode.timeUntilAiring ?? null),
  airingAt: resolve ? resolve(episode, 'airingAt') : ( episode.airingAt ?? null)
})

export const serverResolvers = ({ origins, context }: { origins: OriginWithResolvers[], context?: () => Promise<ServerContext> }) => ({
  Page: {
    episode: async (parent, args, ctx, info) => {
      const results = await getOriginResults({ ctx, origins, context })
      const { scannarrHandles } = groupRelatedHandles({
        typename: 'Episode',
        results: (results?.flatMap(results => results.data.Page.episode ?? []) ?? []) as Episode[]
      })
      console.log('Page.episode scannarrHandles', scannarrHandles)
      return scannarrHandles.slice(0, 1).map(episode => populateEpisode(episode))
    }
  },
  Query: {
    Episode: (parent, args, ctx, info) => {
      const results = getOriginResultsStreamed({ ctx, origins, context })
      return populateEpisode({
        origin: 'scannarr',
        id: '()',
        uri: 'scannarr:()',
        handles: {
          async *edges (...args) {
            for await (const result of results) {
              if (!result.data.Episode) continue
              yield {
                __typename: 'EpisodeEdge',
                node: populateEpisode(result.data.Episode)
              }
            }
          }
        }
      })
    }
  }
})

export const cacheResolvers = ({ origins, context }: { origins: OriginWithResolvers[], context?: () => Promise<ServerContext> }) => ({
  Episode: {
    uri: (parent: DataFields, args: Variables, cache: Cache, info: ResolveInfo) => {
      const parentUri = parent.uri === 'scannarr:()' ? info.parentKey.replace('Episode:', '') : parent.uri as string | undefined
      if (!parentUri) return parent.uri
      const isScannarr = parentUri && isScannarrUri(parentUri)
      const handleUris =
        isScannarr &&
        cache.resolve(
          cache.resolve({ __typename: 'Episode', uri: parentUri }, 'handles') as string,
          'edges'
        )
        ?.map(edge => cache.resolve(cache.resolve(edge, 'node'), 'uri'))

      return (
        isScannarr
          ? toScannarrUri(handleUris)
          : parent.uri
      )
    },
    id: (parent: DataFields, args: Variables, cache: Cache, info: ResolveInfo) => {
      const parentUri = parent.origin === 'scannarr' ? info.parentKey.replace('Episode:', '') : parent.uri as string | undefined
      if (!parentUri) return parent.id
      const isScannarr = parentUri && isScannarrUri(parentUri)
      const handleUris =
        isScannarr &&
        cache.resolve(
          cache.resolve({ __typename: 'Episode', uri: parentUri }, 'handles') as string,
          'edges'
        )
        ?.map(edge => cache.resolve(cache.resolve(edge, 'node'), 'uri'))

      return (
        isScannarr
          ? `(${toScannarrId(handleUris)})`
          : parent.id
      )
    },
    title: makeObjectResolver({
      __typename: 'Episode',
      fieldName: 'title',
      objectTypename: 'MediaTitle',
      fields: ['romanized', 'english', 'native'],
      defaultValue: {
        romanized: null,
        english: null,
        native: null,
      }
    }),

    // mediaUri: (parent: DataFields, args: Variables, cache: Cache, info: ResolveInfo) => {
    //   const parentUri = parent.origin === 'scannarr' ? info.parentKey.replace('Episode:', '') : parent.uri as string | undefined
    //   if (!parentUri) return parent.mediaUri
    //   const isScannarr = parentUri && isScannarrUri(parentUri)
    //   const handleUris =
    //     isScannarr &&
    //     cache.resolve(
    //       cache.resolve({ __typename: 'Episode', uri: parentUri }, 'handles') as string,
    //       'edges'
    //     )
    //     ?.map(edge => cache.resolve(cache.resolve(edge, 'node'), 'mediaUri'))

    //   return (
    //     isScannarr
    //       ? toScannarrUri(handleUris)
    //       : parent.mediaUri
    //   )
    // },



    media: (parent: DataFields, args: Variables, cache: Cache, info: ResolveInfo) => {
      console.log(
        'Episode.media resolver', parent, args, cache, {...info},
        Object.fromEntries(
          cache
            .inspectFields(info.parentKey)
            .map(item => [
              item.fieldName,
              item.fieldName === 'media'
                ? (
                  Object.fromEntries(
                    cache
                      .inspectFields(cache.resolve(info.parentKey, item.fieldName))
                      .map(item2 => [
                        item2.fieldName,
                        cache.resolve(cache.resolve(info.parentKey, item.fieldName), item2.fieldName)
                      ])
                  )
                )
                : cache.resolve(info.parentKey, item.fieldName)
            ])
        )
      )
      const parentUri = parent.origin === 'scannarr' ? info.parentKey.replace('Episode:', '') : parent.uri as string | undefined
      if (!parentUri) return parent.media ?? cache.resolve(info.parentKey, 'media')
      const isScannarr = parentUri && isScannarrUri(parentUri)
      if (!isScannarr) return parent.media ?? cache.resolve(info.parentKey, 'media')
      const handles =
        isScannarr &&
        cache.resolve(
          cache.resolve({ __typename: 'Episode', uri: parentUri }, 'handles') as string,
          'edges'
        )
        ?.map(edge => cache.resolve(cache.resolve(edge, 'node'), 'media'))
      const handleUris = handles?.flatMap(handle => cache.resolve(handle, 'uri')) ?? []
      const id = toScannarrId(handleUris)
      const uri = toScannarrUri(handleUris)

      const handleNodes = handles?.map(mediaRef => populateMedia(mediaRef, cache.resolve.bind(cache))) ?? []
      console.log('Episode.media handles', handles, parent.handles, handleNodes)
      
      const res = populateMedia({
        origin: 'scannarr',
        id,
        uri,
        url: '',
        handles: {
          edges: handleNodes.map(node => ({ node, __typename: 'MediaEdge' })),
          nodes: handleNodes
        }
      }, cache.resolve.bind(cache))

      console.log('res', res, id, uri)

      return res

      // if (!handles[0]) return parent.media
      // return cache.keyOfEntity({ __typename: 'Media', uri: handles[0]?.replace('Media:', '') })
      // return handles[0]
      // const handleUris = handles?.flatMap(handle => cache.resolve(handle, 'uri')) ?? []
      // // const id = toScannarrId(handleUris)
      // const uri = toScannarrUri(handleUris)
      // return cache.keyOfEntity({ __typename: 'Media', uri })
    },


    // media: (parent, args, cache, info) => {
    //   const parentUri = parent.origin === 'scannarr' ? info.parentKey.replace('Episode:', '') : parent.uri as string | undefined
    //   if (!parentUri) return parent.media
    //   const isScannarr = parentUri && isScannarrUri(parentUri)
    //   if (!isScannarr) return parent.media
    //   console.log('Episode.media resolver', parent, args, cache, {...info})
    //   const handles =
    //     isScannarr &&
    //     cache.resolve(
    //       cache.resolve({ __typename: 'Episode', uri: parentUri }, 'handles') as string,
    //       'edges'
    //     )
    //     ?.map(edge => cache.resolve(cache.resolve(edge, 'node'), 'media'))
    //   const handleUris = handles?.flatMap(handle => cache.resolve(handle, 'uri')) ?? []
    //   // const id = toScannarrId(handleUris)
    //   const uri = toScannarrUri(handleUris)
    //   return cache.keyOfEntity({ __typename: 'Media', uri })
    // },

    // media: (parent, args, cache, info) => {
    //   console.log('Episode.media resolver', parent, args, cache, {...info})
    //   const parentUri = parent.origin === 'scannarr' ? info.parentKey.replace('Episode:', '') : parent.uri as string | undefined
    //   if (!parentUri) return parent.media
    //   const isScannarr = parentUri && isScannarrUri(parentUri)
    //   if (!isScannarr) return parent.media

    //   // return parent.media

    //   const handles =
    //     isScannarr &&
    //     cache.resolve(
    //       cache.resolve({ __typename: 'Episode', uri: parentUri }, 'handles') as string,
    //       'edges'
    //     )
    //     ?.map(edge => cache.resolve(cache.resolve(edge, 'node'), 'media'))

    //   const handleUris = handles?.flatMap(handle => cache.resolve(handle, 'uri')) ?? []

    //   // const getRecursiveHandles = (handle: Handle) => {
    //   //   const identicalHandles = getEdges(handle.handles) ?? []
    //   //   return [
    //   //     handle,
    //   //     ...identicalHandles.flatMap(handle => getRecursiveHandles(handle.node))
    //   //   ]
    //   // }

    //   // const handleUris = handles.flatMap(handle => getRecursiveHandles(handle)).map(handle => handle.uri)
    //   const id = toScannarrId(handleUris)
    //   const uri = toScannarrUri(handleUris)

    //   return cache.resolve({ __typename: 'Media', uri }, 'media')

    //   // const res = populateMedia({
    //   //   __typename: 'Media',
    //   //   id,
    //   //   uri
    //   // })

    //   // console.log('Episode.media res', res)

    //   // return res


    //   // return {
    //   //   __typename: 'Media',
    //   //   id,
    //   //   uri,
    //   //   title: {
    //   //     romanized: null,
    //   //     english: null,
    //   //     native: null,
    //   //   },
    //   //   thumbnail: null,
    //   //   description: null,
    //   //   episodes: {
    //   //     __typename: 'EpisodeConnection',
    //   //     edges: []
    //   //   },
    //   //   playbackSources: {
    //   //     __typename: 'PlaybackSourceConnection',
    //   //     edges: []
    //   //   }
    //   // }
    // },

    number: makeScalarResolver({ __typename: 'Episode', fieldName: 'number', defaultValue: null }),
    thumbnail: makeScalarResolver({ __typename: 'Episode', fieldName: 'thumbnail', defaultValue: null }),
    timeUntilAiring: makeScalarResolver({ __typename: 'Episode', fieldName: 'timeUntilAiring', defaultValue: null }),
    airingAt: makeScalarResolver({ __typename: 'Episode', fieldName: 'airingAt', defaultValue: null }),
    description: makeScalarResolver({ __typename: 'Episode', fieldName: 'description', defaultValue: null }),
  }
})
