import { Context } from 'src/context'
import { User } from 'src/generated/type-graphql'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { Resolver, Mutation, InputType, ObjectType, Field, Arg, Ctx } from 'type-graphql'
import { AuthenticationError } from 'apollo-server-core'
// import { VoidMock } from 'graphql-scalars'

const saltRounds = 10

@ObjectType()
class AuthPayload {
  @Field()
  token!: string

  @Field(() => User)
  user!: User
}

@InputType()
class AuthInput {
  @Field({ nullable: false })
  phone!: string

  @Field({ nullable: false })
  password!: string
}

@Resolver()
export default class AuthResolver {
  @Mutation(() => AuthPayload)
  async signIn (@Arg('input') input: AuthInput, @Ctx() context: Context): Promise<AuthPayload> {
    const user = await context.prisma.user.findFirst({ where: { phone: input.phone } })

    if (user != null) {
      const isSame = await bcrypt.compare(input.password, user.password)
      if (isSame) {
        return {
          token: jwt.sign(user.id, process.env.JWT_SECRET as string),
          user
        }
      } else {
        throw new AuthenticationError('Incorrect password')
      }
    }
    const hash = await bcrypt.hash(input.password, saltRounds)
    const dbUser = await context.prisma.user.create({
      data: {
        password: hash,
        phone: input.phone
      }
    })
    return {
      token: jwt.sign(dbUser.id, process.env.JWT_SECRET as string, { expiresIn: '1800s' }),
      user: dbUser
    }
  }

  @Mutation(() => Boolean, { nullable: true })
  async signOut (@Ctx() context: Context): Promise<boolean> {
    await context.prisma.user.update({
      where: {
        id: context.currentUserId as string
      },
      data: {
        online: false,
        longitude: null,
        latitude: null,
        pushId: null
      }
    })
    return true
  }
}
