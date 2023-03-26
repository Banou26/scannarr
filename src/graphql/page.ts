import * as Media from './media'

export const schema = `#graphql

extend type Query {
  Page: Page
}

type Page {
  pageInfo: PageInfo

  media(${Media.MediaParameters}): [Media]
}

type PageInfo {
  """The current page"""
  currentPage: Int

  """If there is another page"""
  hasNextPage: Boolean

  """The last page"""
  lastPage: Int

  """The count on a page"""
  perPage: Int

  """
  The total number of items. Note: This value is not guaranteed to be accurate, do not rely on this for logic
  """
  total: Int
}

`
