import type { Genre } from '../types/genre'
import Name from '../types/name'

export const GenreEq = {
  equals: (genre: Genre, genre2: Genre) => genre.name === genre2.name
}

export const NameEq = {
  equals: (name: Name, name2: Name) => name.name === name2.name
}

