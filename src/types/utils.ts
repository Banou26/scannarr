import type { Handle } from './handle'
import type { Series, SeriesHandle } from './series'
import type { Title, TitleHandle } from './title'

export type PropertyToHandleProperty<
  T,
  T2 extends keyof T,
  T3 extends Handle = T extends { titles: any } ? SeriesHandle : TitleHandle
> =
  T[T2] extends any[]
    ? ({ handle: T3 } & T[T2][number])[]
    : ({ handle: T3 } & T[T2])[]

export type PropertiesToHandleProperties
  <T, T2 extends keyof T> =
    Omit<T, T2>
    & {
      [key in keyof Pick<T, T2>]: PropertyToHandleProperty<T, key>
    }

// export type HandleTypeToType
//   <
//     T extends SeriesHandle | TitleHandle,
//     T2 extends keyof T,
//     T3
//   > =
//     {
//       uri: string
//       uris: ({ uri: string, handle: T })[]
//       handles: T
//     } &
//     Omit<
//       Omit<
//         PropertiesToHandleProperties<T, T2>,
//         keyof Handle
//       >,
//       keyof T3
//     > &
//     T3

export type HandleTypeToType<T extends SeriesHandle | TitleHandle> =
    T extends SeriesHandle ? Series :
    T extends TitleHandle ? Title
    : never
