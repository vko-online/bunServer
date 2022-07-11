import { AuthChecker } from 'type-graphql'
import { Context } from 'src/context'

const authChecker: AuthChecker<Context> = async ({ context: { currentUserId } }, roles) => {
  if (roles.length === 0) {
    // if `@Authorized()`, check only if user exists
    return currentUserId != null
  }
  // there are some roles defined now

  if (currentUserId == null) {
    // and if no user, restrict access
    return false
  }

  // if (user.roles.some(role => roles.includes(role))) {
  //   // grant access if the roles overlap
  //   return true
  // }

  // no roles matched, restrict access
  return false
}

export default authChecker
