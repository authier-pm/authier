import { resolve } from 'node:path'

export const dir = (...args: string[]) => resolve(__dirname, '..', ...args)
