import * as Media from './media'

export const schema = `#graphql

extend type Query {
  Page(
    """Cursor from where to start"""
    at: String

    """How many pages before the cursor to return"""
    before: Int

    """How many pages after the cursor to return"""
    after: Int
  ): Page
}

type Page {
  pageInfo: PageInfo

  media(${Media.MediaParameters}): [Media!]
}

type PageInfo {
  """The current page"""
  previousPageCursor: String

  """The current page"""
  currentPageCursor: String

  """The current page"""
  nextPageCursor: String

  """The first page"""
  firstPageCursor: String

  """The last page cursor"""
  lastPageCursor: String

  """Total number of items on the current page"""
  inPage: Int

  """
  The total number of items. Note: This value is not guaranteed to be accurate, do not rely on this for logic
  """
  total: Int

  """Total number of items before the current page. Note: This value is not guaranteed to be accurate, do not rely on this for logic"""
  totalBefore: Int

  """Total number of items after the current page. Note: This value is not guaranteed to be accurate, do not rely on this for logic"""
  totalAfter: Int
}

`
