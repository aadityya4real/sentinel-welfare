import { useEffect, useState } from 'react'

export type SentimentLabel = 'positive' | 'neutral' | 'negative'
export type EmotionScore = { category: string; score: number }
export type BehavioralSignal = { signal: string; evidence: string; qualification: string }
export type AnalysisResult = {
  sentiment: { label: SentimentLabel; score: number }
  emotions: EmotionScore[]
  behavioralSignals: BehavioralSignal[]
  explanation: string
  explanationEvidence: string
  confidence: number
  suggestions: string[]
  caveat: string
}
export type SavedAnalysis = {
  id: string
  createdAt: string
  platform: string
  text: string
  analysis: AnalysisResult
  modelName: string
  modelVersion: string
}

const KEY_PREFIX = 'sentinel-analysis-history-v1:'
const UPDATED_EVENT = 'sentinel-analysis-history-updated'
const MAX_HISTORY = 50

function historyKey(userId: string) { return `${KEY_PREFIX}${userId}` }
function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value && typeof value === 'object' && !Array.isArray(value)) }
function isSavedAnalysis(value: unknown): value is SavedAnalysis {
  if (!isRecord(value)) return false
  const entry = value
  if (typeof entry.id !== 'string' || typeof entry.createdAt !== 'string' || typeof entry.platform !== 'string' || typeof entry.text !== 'string' || typeof entry.modelName !== 'string' || typeof entry.modelVersion !== 'string') return false
  if (!isRecord(entry.analysis)) return false
  const analysis = entry.analysis
  if (!isRecord(analysis.sentiment)) return false
  const sentiment = analysis.sentiment
  if (!['positive', 'neutral', 'negative'].includes(String(sentiment.label)) || typeof sentiment.score !== 'number') return false
  if (!Array.isArray(analysis.emotions) || !analysis.emotions.every((emotion) => isRecord(emotion) && typeof emotion.category === 'string' && typeof emotion.score === 'number')) return false
  if (!Array.isArray(analysis.behavioralSignals) || !Array.isArray(analysis.suggestions)) return false
  return typeof analysis.explanation === 'string' && typeof analysis.explanationEvidence === 'string' && typeof analysis.confidence === 'number' && typeof analysis.caveat === 'string'
}

export function getAnalysisHistory(userId: string): SavedAnalysis[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(historyKey(userId)) ?? '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isSavedAnalysis).slice(0, MAX_HISTORY)
  } catch { return [] }
}

export function saveAnalysis(userId: string, item: SavedAnalysis): boolean {
  try {
    const next = [item, ...getAnalysisHistory(userId)].filter((existing) => existing.id !== item.id).slice(0, MAX_HISTORY)
    window.localStorage.setItem(historyKey(userId), JSON.stringify(next))
    window.dispatchEvent(new CustomEvent(UPDATED_EVENT, { detail: { userId } }))
    return true
  } catch { return false }
}

export function useAnalysisHistory(userId: string | undefined) {
  const [items, setItems] = useState<SavedAnalysis[]>(() => userId ? getAnalysisHistory(userId) : [])
  useEffect(() => {
    if (!userId) { setItems([]); return }
    const refresh = () => setItems(getAnalysisHistory(userId))
    const onCustomUpdate = (event: Event) => {
      const detail = (event as CustomEvent<{ userId: string }>).detail
      if (detail?.userId === userId) refresh()
    }
    window.addEventListener(UPDATED_EVENT, onCustomUpdate)
    window.addEventListener('storage', refresh)
    refresh()
    return () => {
      window.removeEventListener(UPDATED_EVENT, onCustomUpdate)
      window.removeEventListener('storage', refresh)
    }
  }, [userId])
  return items
}
