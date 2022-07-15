import User from './user'

export type Comment = {
  date?: Date
  message: string
  url?: string
  user: User
}
export default Comment
