import { demoTrends } from '../demo/demoTrends'
import type { WellnessCheckin } from '../demo/types'
import { getDemoCheckin, updateDemoCheckin } from '../demo/demoStore'
export const getMyWellness = async () => getDemoCheckin()
export const getWellnessTrends = async () => demoTrends
export const saveCheckin = async (input: WellnessCheckin) => { updateDemoCheckin(input); return { ...input, savedAt: new Date().toISOString(), demo: true } }
