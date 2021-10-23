import { prisma } from '../prisma'
import { User } from '../generated/typegraphql-prisma/models'
import { IContext, RootResolver } from '../RootResolver'
import { v4 as uuidv4 } from 'uuid'
import { hash } from 'bcrypt'
import { createServer } from '../server'

afterAll(async () => {
  const deleteOTPEvents = prisma.oTPCodeEvent.deleteMany()
  const deleteSettingsConfig = prisma.settingsConfig.deleteMany()
  const deleteDevice = prisma.device.deleteMany()
  const deleteEncryptedSecrets = prisma.encryptedSecrets.deleteMany()
  const deleteUsers = prisma.user.deleteMany()

  await prisma.$transaction([
    deleteOTPEvents,
    deleteSettingsConfig,
    deleteDevice,
    deleteEncryptedSecrets,
    deleteUsers
  ])

  await prisma.$disconnect()
})

it('should create 1 new user', async () => {
  const server = createServer()
  const response = await server.inject({
    method: 'POST',
    url: '/graphql'
  })
  console.log(response)
  // The new customers details
  const input = {
    name: 'Hermione Granger',
    email: 'hermione@hogwarts.io',
    password: 'test',
    firebaseToken: 'test'
  }
  const hashedPassword = await hash(input.password, 12)

  const user: User = {
    id: uuidv4(),
    name: 'Hermione Granger',
    email: 'hermione@hogwarts.io',
    tokenVersion: 1,
    createdAt: new Date(),
    TOTPlimit: 10,
    loginCredentialsLimit: 10,
    passwordHash: hashedPassword
  }

  let resolver = new RootResolver()
  const mockCtx = {
    request: response.raw.req,
    reply: response.raw.res,
    getIpAddress: () => '127.0.0.0'
  } as unknown as IContext

  await resolver.register(
    input.email,
    input.password,
    input.firebaseToken,
    mockCtx
  )

  const newUser = await prisma.user.findUnique({
    where: {
      id: user.id
    }
  })

  // Expect the new customer to have been created and match the input
  await expect(newUser).toEqual(user)
})
