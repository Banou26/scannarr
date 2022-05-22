import { Category } from './category'
import { File } from './file'
import { Genre } from './genre'
import { Series } from './series'
import { Team } from './team'
import { User } from './user'


// https://newznab.readthedocs.io/en/latest/misc/api/#list-of-attributes
export type Title = {
  series: Series
  id: string
  size: number
  category: Category
  files: File
  poster: User
  // group
  team: Team
  downloads: number
  // password
  // comments
  date: Date
  // usenetdate
  // nfo
  // info
  year: number
  season: number
  episode: number
  // rageid
  // tvtitle
  // tvairdate
  video: string
  audio: string
  resolution: string
  framerate: string
  language: string
  subs: string[]
  // imdb
  // imdbscore
  // imdbtitle
  // imdbtagline
  // imdbplot
  // imdbyear
  // imdbdirector
  // imdbactors
  genre: Genre
  // artist
  // album
  publisher
  // tracks
  // coverurl
  // backdropcoverurl
  // review
  // booktitle
  // publishdate
  // author
  // pages
}
