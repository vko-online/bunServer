import { Upload, FileUpload } from 'graphql-upload'
import { Context } from 'src/context'
import { File, User } from 'src/generated/type-graphql'
import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import shortId from 'shortid'
import { createWriteStream, unlink } from 'fs'
import path from 'path'
import { UPLOADS_URL } from 'src/constants/uploads'
import { ApolloError } from 'apollo-server-core'

// should upload by 1 or batch?

@Resolver()
export default class ProfileResolver {
  @Authorized()
  @Mutation(() => [File])
  async uploadImage (
    @Arg('input', () => [Upload]) input: FileUpload[],
      @Ctx() context: Context
  ): Promise<File[]> {
    const returningFiles: File[] = []
    for (const item of input) {
      const { createReadStream, mimetype, filename } = await item
      const stream = createReadStream()
      const storedFileName = `${shortId.generate()}-${filename}`
      // const storedFileUrl = new URL(storedFileName, base)
      const storedFileUrl = path.join(process.cwd(), process.env.UPLOADS_DIR as string, storedFileName)
      let fileSize = 0
      try {
        await new Promise((resolve, reject) => {
          // Create a stream to which the upload will be written.
          const writeStream = createWriteStream(storedFileUrl)

          // When the upload is fully written, resolve the promise.
          writeStream.on('finish', resolve)

          stream.on('data', (chunk) => {
            fileSize += Buffer.from(chunk).byteLength
          })

          // If there's an error writing the file, remove the partially written file
          // and reject the promise.
          writeStream.on('error', (error) => {
            unlink(storedFileUrl, () => {
              fileSize = 0
              reject(error)
            })
          })

          // In Node.js <= v13, errors are not automatically propagated between piped
          // streams. If there is an error receiving the upload, destroy the write
          // stream with the corresponding error.
          stream.on('error', (error) => writeStream.destroy(error))

          // Pipe the upload into the write stream.
          stream.pipe(writeStream)
        })
      } catch {
        throw new ApolloError('Failed to upload file')
      }
      const dbFile = await context.prisma.file.create({
        data: {
          name: storedFileName,
          path: UPLOADS_URL(storedFileName),
          size: fileSize,
          type: mimetype,
          user: {
            connect: {
              id: context.currentUserId as string
            }
          }
        }
      })
      returningFiles.push(dbFile)
    }
    return returningFiles
  }

  @Authorized()
  @Query(() => User, { nullable: true })
  async me (@Ctx() context: Context): Promise<User | null> {
    return await context.prisma.user.findFirst({
      where: {
        id: context.currentUserId as string
      }
    })
  }
}
