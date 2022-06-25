import type { Genre } from '../types/genre'

export const GenreEq = {
  equals: (genre: Genre, genre2: Genre) => genre.name === genre2.name
}
