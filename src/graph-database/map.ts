import { Observable, combineLatest, map, of, switchMap } from 'rxjs'
import { InternalNode, NodeData } from '.'
import { getObservables, replaceObservablePairs } from '../urql/graph'

export const mapNode = <T extends (nodeData: Node, node: InternalNode<NodeData>) => Node>(node: InternalNode<NodeData>, fn: T): Observable<NodeData> =>
  node
    .$
    .pipe(
      switchMap(data => {
        const result = fn(data, node)
        const observables = getObservables(result)
        if (!observables?.length) return of(result)
        return (
          combineLatest(observables)
            .pipe(
              map(results =>
                replaceObservablePairs(
                  result,
                  results.map((result, i) => [
                    (observables as Observable<any>[])[i]!,
                    result
                  ])
                )
              )
            )
        )
      })
    )