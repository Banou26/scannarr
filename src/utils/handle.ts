import { DepGraph } from 'dependency-graph'

import { Handle } from '../types'

export const groupHandles = <T extends Handle>(values: T[]): { groups: [string, T[]][], singles: T[] } => {
  const graph = new DepGraph<Handle>({ circular: true })

  for (const handle of values) {
    if (!graph.hasNode(handle.uri)) graph.addNode(handle.uri, handle)
    for (const relatedHandle of handle?.handles ?? []) {
      if (!graph.hasNode(relatedHandle.uri)) graph.addNode(relatedHandle.uri, relatedHandle)
      graph.addDependency(handle.uri, relatedHandle.uri)
      graph.addDependency(relatedHandle.uri, handle.uri)
    }
  }

  const dependencies =
    values
      .map(handle => [
        handle.uri,
        ...graph.dependenciesOf(handle.uri)
      ])
      .map(uris =>
        [uris[0], uris.map(uri => graph.getNodeData(uri))] as [string, T[]]
      )
    
  const groupedHandles =
    dependencies
      .filter(handles => handles[1].length > 1)
      .filter(([uri], i, groupedHandles) =>
        groupedHandles
          .findIndex(([, handles]) => handles.some(({ uri: _uri }) => _uri === uri)) !== i
      )

  const singleHandles =
    dependencies
      .filter(handles => handles[1].length === 1)
      .flatMap(handles => graph.getNodeData(handles[0]) as T)

  return {
    groups: groupedHandles,
    singles: singleHandles
  }
}

export const HandleEq = {
  equals: (handle: Handle, handle2: Handle) => handle.uri === handle2.uri
}

