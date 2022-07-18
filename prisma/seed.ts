import { PrismaClient, Prisma, Identity } from '@prisma/client'
import { faker } from '@faker-js/faker'

const prisma = new PrismaClient()

function createRandomUser (): Prisma.UserCreateInput {
  return {
    name: faker.name.firstName(),
    phone: faker.internet.userName(),
    password: '$2b$10$MA.y/XTEazsYJgjd2sV4fO/mxw2pd3J3JBNhrXXYQw1chZGTu2.cO', // 1
    bio: faker.lorem.sentence(),
    dob: faker.date.birthdate(),
    identity: faker.helpers.arrayElement([Identity.FEMALE, Identity.MALE, Identity.OTHER]),
    looking: faker.helpers.arrayElement([Identity.FEMALE, Identity.MALE, Identity.OTHER]),
    role: 'USER'
  }
}

async function main (): Promise<void> {
  console.log('Start seeding ...')
  const USERS: Prisma.UserCreateInput[] = []
  Array.from({ length: 100 }).forEach(() => {
    USERS.push(createRandomUser())
  })
  for (const u of USERS) {
    const user = await prisma.user.create({
      data: u
    })
    console.log(`Created user with id: ${user.id}`)
  }
  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
