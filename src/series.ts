import { Category } from './category'
import { File } from './file'
import { Genre } from './genre'
import { Title } from './title'
import { Team } from './team'
import { User } from './user'

// https://newznab.readthedocs.io/en/latest/misc/api/#list-of-attributes
export type Series = {
  titles: Title[]
  id: string
  category: Category
  date: Date
  language: string
  genre: Genre
  // publisher
}
