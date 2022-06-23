import type { Series, SeriesHandle, SeriesRelation } from './series'
import type { Title, TitleHandle, TitleRelation } from './title'

export type Relationship = SeriesRelation | TitleRelation

export type Relation<T> =  {
  relation:
    T extends Series ? SeriesRelation :
    T extends SeriesHandle ? SeriesRelation :
    T extends Title ? TitleRelation :
    T extends TitleHandle ? TitleRelation :
    never
  reference: T
}

export default Relation
