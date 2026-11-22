import { handleAnalyzeRequest } from './analyze'

const recentRequests = new Map<string, number[]>()
const WINDOW_MS = 60_000
const MAX_REQUESTS_PER_WINDOW = 20

function json(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  })
}

function isSameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  if (!origin) return true
  try { return new URL(origin).origin === new URL(request.url).origin } catch { return false }
}

function requestAllowed(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const address = forwarded || request.headers.get('x-real-ip') || 'unknown'
  const now = Date.now()
  const active = (recentRequests.get(address) ?? []).filter((time) => now - time < WINDOW_MS)
  if (active.length >= MAX_REQUESTS_PER_WINDOW) return false
  active.push(now)
  recentRequests.set(address, active)
  return true
}

export default {
  async fetch(request: Request) {
    try {
      if (!isSameOrigin(request)) return json(403, 'origin_not_allowed', 'This request is not allowed from this origin.')
      if (!requestAllowed(request)) return json(429, 'demo_rate_limited', 'The demo analysis limit was reached. Wait a minute and try again.')
      return await handleAnalyzeRequest(request, false)
    } catch (error) {
      console.error('[demo-analyze] handler failure', error instanceof Error ? error.name : 'UnknownError')
      return json(500, 'internal_error', 'The demo analysis service encountered a server error. Please try again.')
    }
  },
}
