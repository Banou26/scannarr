
/**
 * Type: "iframe" | "torrent" | "custom"
 */
type Tag = {
  type:
    'score' | 'tag' | 'genre' | 'type' | 'theme' |
    'demographic' | 'status' | 'producer' | 'rated' |
    'size' | 'resolution' | 'batch' | 'type' | 'protocol-type' | string
  value?: any
  extra?: any
}

export default Tag
