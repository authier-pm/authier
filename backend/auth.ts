import { sign } from 'jsonwebtoken'
import { UserBase } from './models/user'

export const createAccessToken = (user: UserBase) => {
  return sign({ userId: user.id }, process.env.ACCESS_TOKEN_SECRET!, {
    expiresIn: '15m'
  })
}

export const createRefreshToken = (user: UserBase) => {
  return sign(
    { userId: user.id, tokenVersion: user.tokenVersion },
    process.env.REFRESH_TOKEN_SECRET!,
    {
      expiresIn: '7d'
    }
  )
}
