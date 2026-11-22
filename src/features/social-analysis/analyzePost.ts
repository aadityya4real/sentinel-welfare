import { supabase } from '../../lib/supabase'
import type { AnalysisResult } from './history'

export type AnalyzePostResponse = {
  analysis: AnalysisResult
  model: { provider: string; name: string; version: string }
}

export async function analyzePost(text: string, platform: string): Promise<AnalyzePostResponse> {
  if (!supabase) throw new Error('SENTINEL is not connected to Supabase. Sign in again after configuration is complete.')
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session?.access_token) throw new Error('Your session has expired. Sign in again before analyzing a post.')

  let response: Response
  try {
    response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` },
      body: JSON.stringify({ text, platform }),
    })
  } catch {
    throw new Error('The analysis service could not be reached. Run the app with Vercel development mode and try again.')
  }

  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const message = payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'object' && payload.error && 'message' in payload.error && typeof payload.error.message === 'string'
      ? payload.error.message
      : 'Analysis failed. Please try again.'
    throw new Error(message)
  }
  if (!payload || typeof payload !== 'object' || !('analysis' in payload) || !('model' in payload)) throw new Error('The analysis service returned an invalid response. No result was saved.')
  return payload as AnalyzePostResponse
}
