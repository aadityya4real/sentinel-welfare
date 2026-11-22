import { createPresentationToken, getDemoSigningSecret, isDemoAccessConfigured, isValidPresentationToken, PRESENTATION_COOKIE, PRESENTATION_SESSION_SECONDS, readPresentationCookie, verifyDemoCredentials } from '../server/demoAccess'

const json = (status: number, body: Record<string, unknown>, headers?: HeadersInit) => Response.json(body, {
  status,
  headers: { 'Cache-Control': 'no-store', ...headers },
})

function originIsSame(request: Request) {
  const origin = request.headers.get('origin')
  if (!origin) return true
  try { return new URL(origin).origin === new URL(request.url).origin } catch { return false }
}

async function handle(request: Request) {
    const secret = getDemoSigningSecret()
    const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : ''
    if (!['GET', 'POST', 'DELETE'].includes(request.method)) return json(405, { error: 'Method not allowed.' }, { Allow: 'GET, POST, DELETE' })
    if (request.method !== 'GET' && !originIsSame(request)) return json(403, { error: 'This request is not allowed from this origin.' })

    if (request.method === 'GET') {
      return json(200, {
        enabled: isDemoAccessConfigured(),
        authenticated: secret ? await isValidPresentationToken(readPresentationCookie(request), secret) : false,
      })
    }

    if (request.method === 'DELETE') {
      return json(200, { authenticated: false }, {
        'Set-Cookie': `${PRESENTATION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`,
      })
    }

    if (!isDemoAccessConfigured()) return json(503, { error: 'Demo Access is not configured on this deployment.' })
    let body: unknown
    try { body = await request.json() } catch { return json(400, { error: 'Enter your demo username and password, then try again.' }) }
    const username = body && typeof body === 'object' && 'username' in body ? body.username : undefined
    const password = body && typeof body === 'object' && 'password' in body ? body.password : undefined
    if (!await verifyDemoCredentials(username, password)) return json(401, { error: 'The demo username or password is incorrect.' })

    const { token } = await createPresentationToken(secret)
    return json(200, { authenticated: true }, {
      'Set-Cookie': `${PRESENTATION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${PRESENTATION_SESSION_SECONDS}${secure}`,
    })
}

export default {
  async fetch(request: Request) {
    try {
      return await handle(request)
    } catch (error) {
      console.error('[demo-session] handler failure', error instanceof Error ? error.name : 'UnknownError')
      return json(500, { error: 'Demo Access encountered a server error. Please try again in a moment.' })
    }
  },
}
