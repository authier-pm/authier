import type { Context as ElysiaContext, CookieOptions } from 'elysia'

export interface LegacyRequest {
  headers: Record<string, string | undefined>
  cookies: Record<string, string | undefined>
  body?: unknown
  socket: {
    remoteAddress?: string
  }
}

export interface LegacyReply {
  status: (code: number) => LegacyReply
  send: (payload?: unknown) => unknown
  setCookie: (
    name: string,
    value: string,
    options?: CookieOptions
  ) => LegacyReply
  clearCookie: (name: string) => LegacyReply
}

type ElysiaRouteContext = Pick<ElysiaContext, 'request' | 'cookie' | 'set'>
export type LegacyElysiaContext = ElysiaRouteContext

const toHeadersRecord = (
  request: Request
): Record<string, string | undefined> =>
  Object.fromEntries(
    Array.from(request.headers, ([key, value]) => [key.toLowerCase(), value])
  )

const toCookiesRecord = (ctx: ElysiaRouteContext) =>
  Object.fromEntries(
    Object.keys(ctx.cookie).map((name) => {
      const value = ctx.cookie[name].value
      return [name, value == null ? undefined : String(value)]
    })
  ) as Record<string, string | undefined>

export const createLegacyRequestFromElysia = (
  ctx: ElysiaRouteContext,
  options: {
    body?: unknown
    remoteAddress?: string
  } = {}
): LegacyRequest => {
  const headers = toHeadersRecord(ctx.request)
  const remoteAddress =
    options.remoteAddress ??
    headers['cf-connecting-ip'] ??
    headers['x-forwarded-for']

  return {
    headers,
    cookies: toCookiesRecord(ctx),
    body: options.body,
    socket: {
      remoteAddress
    }
  }
}

export class LegacyReplyAdapter implements LegacyReply {
  private payload: unknown

  constructor(
    private readonly ctx: Pick<ElysiaRouteContext, 'cookie' | 'set'>
  ) {}

  status(code: number): LegacyReplyAdapter {
    this.ctx.set.status = code
    return this
  }

  send(payload?: unknown) {
    this.payload = payload
    return payload
  }

  setCookie(name: string, value: string, options: CookieOptions = {}) {
    this.ctx.cookie[name].set({
      path: '/',
      ...options,
      value
    })

    return this
  }

  clearCookie(name: string) {
    this.ctx.cookie[name].set({
      path: '/',
      value: '',
      expires: new Date(0),
      maxAge: 0
    })

    return this
  }

  getPayload() {
    return this.payload
  }
}

export const createLegacyReplyAdapter = (
  ctx: Pick<ElysiaRouteContext, 'cookie' | 'set'>
) => new LegacyReplyAdapter(ctx)
