import { createHmac, timingSafeEqual } from 'node:crypto'

export const PRESENTATION_COOKIE = 'sentinel_presentation'
export const PRESENTATION_SESSION_SECONDS = 8 * 60 * 60

function signature(expiresAt: number, secret: string) {
  return createHmac('sha256', secret).update(`sentinel-presentation:${expiresAt}`).digest('base64url')
}

export function isValidPresentationKey(candidate: unknown, secret: string) {
  if (typeof candidate !== 'string' || !secret) return false
  const expected = Buffer.from(createHmac('sha256', secret).update(secret).digest())
  const actual = Buffer.from(createHmac('sha256', secret).update(candidate).digest())
  return timingSafeEqual(expected, actual)
}

export function createPresentationToken(secret: string, now = Date.now()) {
  const expiresAt = Math.floor(now / 1000) + PRESENTATION_SESSION_SECONDS
  return { token: `${expiresAt}.${signature(expiresAt, secret)}`, expiresAt }
}

export function isValidPresentationToken(token: string | undefined, secret: string, now = Date.now()) {
  if (!token || !secret) return false
  const [expiresText, suppliedSignature, ...extra] = token.split('.')
  if (extra.length || !/^\d+$/.test(expiresText) || !suppliedSignature) return false
  const expiresAt = Number(expiresText)
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(now / 1000)) return false
  const expected = Buffer.from(signature(expiresAt, secret))
  const supplied = Buffer.from(suppliedSignature)
  return expected.length === supplied.length && timingSafeEqual(expected, supplied)
}

export function readPresentationCookie(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? ''
  for (const cookie of cookieHeader.split(';')) {
    const [name, ...value] = cookie.trim().split('=')
    if (name === PRESENTATION_COOKIE) return value.join('=')
  }
  return undefined
}

export function hasValidPresentationSession(request: Request, secret = process.env.SENTINEL_DEMO_ACCESS_KEY ?? '') {
  return isValidPresentationToken(readPresentationCookie(request), secret)
}
