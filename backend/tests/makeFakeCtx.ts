import { db } from '../prisma/prismaClient'
import { faker } from '@faker-js/faker'
import type { Device } from '../models/types/ContextTypes'
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
    db,
    getIpAddress: () => faker.internet.ip()
  }) as any
