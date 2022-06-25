
export type LinkType = 'INFO' | 'STREAMING' | 'SOCIAL'

export type Link = {
  // The url of the external link or base url of link source
  url: string
  
  // The links website site name
  site: string
  
  // The links website site id
  siteScheme?: string
  
  type?: LinkType
  // Language the site content is in. See Staff language field for values.
  language?: string
}

export default Link

