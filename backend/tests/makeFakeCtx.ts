import { prismaClient } from '../prismaClient'
import faker from 'faker'

// afterAll(async () => {
//   const deleteDevices = prismaClient.device.deleteMany()
//   const deleteSettings = prismaClient.settingsConfig.deleteMany()
//   const deleteUsers = prismaClient.user.deleteMany()
//   await prismaClient.$transaction([deleteDevices, deleteSettings, deleteUsers])
//   await prismaClient.$disconnect()
// })
export const makeFakeCtx = (userId: string) =>
  ({
    reply: { setCookie: jest.fn() },
    request: { headers: {} },
    jwtPayload: { userId: userId },
    prisma: prismaClient,
    getIpAddress: () => faker.internet.ip()
  } as any)
