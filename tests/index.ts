import { swAlign } from 'seal-wasm'

const arr = [
  'Mushoku Tensei: Isekai Ittara Honki Dasu',
  'Mushoku Tensei: Jobless Reincarnation',
]

const res =
  arr
  .flatMap(name =>
    arr.flatMap(_name => swAlign(name, _name, { alignment: 'local', equal: 2, align: -1, insert: -1, delete: -1 }))
  )

console.log(
  res
)
