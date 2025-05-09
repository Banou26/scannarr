export const makeTypedQueryFactory = (sql) => {
  return (...values) => {
    return {
      sql,
      values
    }
  }
}
