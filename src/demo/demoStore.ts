import { useSyncExternalStore } from 'react'
import { demoWellness } from './demoWellness'
import type { WellnessCheckin } from './types'

const STORAGE_KEY = 'sentinel-demo-checkin'
const listeners = new Set<() => void>()
let snapshot: WellnessCheckin = loadInitial()
function loadInitial(): WellnessCheckin {
  try { const value = localStorage.getItem(STORAGE_KEY); return value ? { ...demoWellness, ...JSON.parse(value) as WellnessCheckin } : demoWellness } catch { return demoWellness }
}
function emit() { listeners.forEach((listener) => listener()) }
export function getDemoCheckin() { return snapshot }
export function subscribeDemoCheckin(listener: () => void) { listeners.add(listener); return () => listeners.delete(listener) }
export function updateDemoCheckin(value: WellnessCheckin) { snapshot = value; try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)) } catch { /* in-memory demo still works when storage is unavailable */ }; emit() }
export function useDemoCheckin() { return useSyncExternalStore(subscribeDemoCheckin, getDemoCheckin, () => demoWellness) }
