import { generate } from 'generate-password'

export interface IPasswordGeneratorConfig {
  numbers: boolean
  symbols: boolean
  uppercase: boolean
  lowercase: boolean
  length: number
}

export const defaultPasswordGeneratorConfig = {
  numbers: true,
  symbols: true,
  uppercase: true,
  lowercase: true,
  length: 14
}

export { generate }
