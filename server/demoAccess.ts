export const PRESENTATION_COOKIE = 'sentinel_presentation'
export const PRESENTATION_SESSION_SECONDS = 8 * 60 * 60

export function getDemoSigningSecret() {
  return process.env.SENTINEL_DEMO_SIGNING_SECRET?.trim() || process.env.SENTINEL_DEMO_ACCESS_KEY?.trim() || ''
}

function getConfiguredCredentials() {
  return {
    username: process.env.SENTINEL_DEMO_USERNAME?.trim() ?? '',
    password: process.env.SENTINEL_DEMO_PASSWORD ?? '',
    signingSecret: getDemoSigningSecret(),
  }
}

export function isDemoAccessConfigured() {
  const { username, password, signingSecret } = getConfiguredCredentials()
  return Boolean(username && password && signingSecret.length >= 32)
}

function base64Url(bytes: Uint8Array) {
  const data = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')
  return btoa(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

async function hmac(value: string, secret: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value)))
}

function safeEqual(left: Uint8Array, right: Uint8Array) {
  let difference = left.length ^ right.length
  const length = Math.max(left.length, right.length)
  for (let index = 0; index < length; index += 1) difference |= (left[index] ?? 0) ^ (right[index] ?? 0)
  return difference === 0
}

export async function verifyDemoCredentials(username: unknown, password: unknown) {
  const expected = getConfiguredCredentials()
  if (!expected.username || !expected.password || expected.signingSecret.length < 32 || typeof username !== 'string' || typeof password !== 'string') return false
  const [providedUsername, expectedUsername, providedPassword, expectedPassword] = await Promise.all([
    hmac(username.trim(), expected.signingSecret),
    hmac(expected.username, expected.signingSecret),
    hmac(password, expected.signingSecret),
    hmac(expected.password, expected.signingSecret),
  ])
  return safeEqual(providedUsername, expectedUsername) && safeEqual(providedPassword, expectedPassword)
}

async function signature(expiresAt: number, secret: string) {
  return base64Url(await hmac(`sentinel-demo-session:${expiresAt}`, secret))
}

export async function createPresentationToken(secret: string, now = Date.now()) {
  const expiresAt = Math.floor(now / 1000) + PRESENTATION_SESSION_SECONDS
  return { token: `${expiresAt}.${await signature(expiresAt, secret)}`, expiresAt }
}

export async function isValidPresentationToken(token: string | undefined, secret: string, now = Date.now()) {
  if (!token || !secret) return false
  const [expiresText, suppliedSignature, ...extra] = token.split('.')
  if (extra.length || !/^\d+$/.test(expiresText) || !suppliedSignature) return false
  const expiresAt = Number(expiresText)
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(now / 1000)) return false
  const expected = new TextEncoder().encode(await signature(expiresAt, secret))
  const supplied = new TextEncoder().encode(suppliedSignature)
  return safeEqual(expected, supplied)
}

export function readPresentationCookie(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? ''
  for (const cookie of cookieHeader.split(';')) {
    const [name, ...value] = cookie.trim().split('=')
    if (name === PRESENTATION_COOKIE) return value.join('=')
  }
  return undefined
}

export async function hasValidPresentationSession(request: Request) {
  return isValidPresentationToken(readPresentationCookie(request), getDemoSigningSecret())
}
