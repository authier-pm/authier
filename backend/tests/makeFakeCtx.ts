import { prismaClient } from '../prisma/prismaClient'
import { faker } from '@faker-js/faker'
import type { Device } from '@prisma/client'
import { vi } from 'vitest'

// afterAll(async () => {
//   const deleteDevices = prismaClient.device.deleteMany()
//   const deleteSettings = prismaClient.settingsConfig.deleteMany()
//   const deleteUsers = prismaClient.user.deleteMany()
//   await prismaClient.$transaction([deleteDevices, deleteSettings, deleteUsers])
//   await prismaClient.$disconnect()
// })
export const makeFakeCtx = (overload: { userId: string; device?: Device }) =>
  ({
    reply: { setCookie: vi.fn() },
    request: { headers: {} },
    jwtPayload: { userId: overload.userId },
    device: overload.device,
    prisma: prismaClient,
    getIpAddress: () => faker.internet.ip()
  }) as any
