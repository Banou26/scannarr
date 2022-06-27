export const findMostCommon = <T>(arr: T[]): T | undefined => {
  const instances = [
    ...arr
      .filter(val => val !== undefined || val !== null)
      .reduce(
        (map, val) => map.set(val, (map.get(val) ?? 0) + 1),
        new Map()
      )
      .entries()
  ]
  const max = Math.max(...instances.map(([, instances]) => instances))
  return instances.filter(([, instances]) => instances === max).map(([num]) => num).at(0)
}
