
/**
 * Type: "iframe" | "torrent" | "custom"
 */
type Tag = {
  type:
    'score' | 'tag' | 'genre' | 'type' | 'theme' |
    'demographic' | 'status' | 'producer' | 'rated' |
    'size' | 'resolution' | 'batch' | 'type'
  value?: string
  extra?: any
}

export default Tag
