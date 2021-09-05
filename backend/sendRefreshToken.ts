import { FastifyReply } from 'fastify'

export const sendRefreshToken = (reply: FastifyReply, token: string) => {
  reply.setCookie('jid', token, {
    httpOnly: true,
    secure: true,
    sameSite: true
  })
}
