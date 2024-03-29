export const schema = `#graphql

"""Date object that allows for incomplete date values (fuzzy)"""
type FuzzyDate {
  """Numeric Day (24)"""
  day: Int

  """Numeric Month (3)"""
  month: Int

  """Numeric Year (2017)"""
  year: Int
}

"""Date object that allows for incomplete date values (fuzzy)"""
input FuzzyDateInput {
  """Numeric Day (24)"""
  day: Int

  """Numeric Month (3)"""
  month: Int

  """Numeric Year (2017)"""
  year: Int
}

"""
8 digit long date integer (YYYYMMDD). Unknown dates represented by 0. E.g. 2016: 20160000, May 1976: 19760500
"""
scalar FuzzyDateInt

`
