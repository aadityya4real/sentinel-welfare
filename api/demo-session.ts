import { createPresentationToken, getDemoSigningSecret, isValidPresentationToken, PRESENTATION_COOKIE, PRESENTATION_SESSION_SECONDS, readPresentationCookie } from '../server/demoAccess'

const json = (status: number, body: Record<string, unknown>, headers?: HeadersInit) => Response.json(body, {
  status,
  headers: { 'Cache-Control': 'no-store', ...headers },
})

function originIsSame(request: Request) {
  const origin = request.headers.get('origin')
  if (!origin) return true
  try { return new URL(origin).origin === new URL(request.url).origin } catch { return false }
}

export default {
  async fetch(request: Request) {
    const secret = getDemoSigningSecret()
    const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : ''
    if (!['GET', 'POST', 'DELETE'].includes(request.method)) return json(405, { error: 'Method not allowed.' }, { Allow: 'GET, POST, DELETE' })
    if (request.method !== 'GET' && !originIsSame(request)) return json(403, { error: 'This request is not allowed from this origin.' })

    if (request.method === 'GET') {
      return json(200, {
        enabled: secret.length >= 32,
        authenticated: Boolean(secret && isValidPresentationToken(readPresentationCookie(request), secret)),
      })
    }

    if (request.method === 'DELETE') {
      return json(200, { authenticated: false }, {
        'Set-Cookie': `${PRESENTATION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`,
      })
    }

    if (secret.length < 32) return json(503, { error: 'Demo Access is not enabled on this deployment.' })
    const { token } = createPresentationToken(secret)
    return json(200, { authenticated: true }, {
      'Set-Cookie': `${PRESENTATION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${PRESENTATION_SESSION_SECONDS}${secure}`,
    })
  },
}
