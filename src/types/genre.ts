import type { Handle } from './handle'

export type Genre = {
  // id?: string
  // url?: string
  name: string
  adult?: boolean
  /** number of items with that genre */
  amount?: number
  // handles?: GenreHandle[]
}

export type GenreHandle =
  Omit<Genre, 'handles'>
  & Handle

// todo: make genres dynamic, queryiable from API calls

// export type MainGenre =
//   'ACTION' |
//   'ANIME' |
//   'ASIAN' |
//   'BRITISH' |
//   'COMEDIES' |
//   'CRIME' |
//   'DOCUSERIES' |
//   'DRAMAS' |
//   'FOOD_TRAVEL' |
//   'FRENCH' |
//   'HOLIDAYS' |
//   'HORROR' |
//   'INTERNATIONAL' |
//   'KIDS' |
//   'MYSTERIES' |
//   'REALITY' |
//   'ROMANCE' |
//   'SCI_FI_FANTASY' |
//   'SCIENCE_NATURE' |
//   'STAND_UP_TALK_SHOWS' |
//   'TEEN' |
//   'THAT_FRENCH_FEELING' |
//   'THRILLER' |
//   'US'


// export type AnimeGenre =
//   'ACTION' |
//   'ADVENTURE' |
//   'AVANT_GARDE' |
//   'AWARD_WINNING' |
//   'BOYS_LOVE' |
//   'COMEDY' |
//   'DRAMA' |
//   'FANTASY' |
//   'GIRLS_LOVE' |
//   'GOURMET' |
//   'HORROR' |
//   'MYSTERY' |
//   'ROMANCE' |
//   'SCI_FI' |
//   'SLICE_OF_LIFE' |
//   'SPORTS' |
//   'SUPERNATURAL' |
//   'SUSPENSE' |
//   'WORK_LIFE'

// export type Genre = MainGenre | AnimeGenre