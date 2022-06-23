import User from './user'

export type Comment = {
  user: User
  date?: Date
  message: string
}
export default Comment
