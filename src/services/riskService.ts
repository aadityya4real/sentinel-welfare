import type { RiskAssessment, WellnessCheckin } from '../demo/types'
import { getDemoCheckin } from '../demo/demoStore'

// Demo-only explainable scoring adapter. Replace this implementation with a vetted model/API later.
export async function getRiskAssessment(personnelId: string, checkin: WellnessCheckin = getDemoCheckin()): Promise<RiskAssessment> {
  if (personnelId.endsWith('19832')) return { score: 72, status: 'High', factors: ['Extended deployment', 'Increased fatigue', 'Reduced leave'], recommendation: 'Offer a confidential welfare check-in', explanation: 'The illustrative indicator combines a sustained deployment period with elevated fatigue reports and fewer recent recovery days.' }
  const factors = [
    ...(checkin.sleepHours < 7 ? ['Reduced sleep'] : []),
    ...(checkin.stress === 'High' || checkin.stress === 'Moderate' ? ['Elevated stress'] : []),
    ...(checkin.workload === 'Heavy' ? ['Elevated workload'] : []),
    ...(checkin.fatigue === 'High' || checkin.fatigue === 'Moderate' ? ['Increased fatigue'] : []),
  ]
  const score = Math.min(100, (checkin.sleepHours < 5 ? 22 : checkin.sleepHours < 7 ? 12 : 3) + (checkin.stress === 'High' ? 22 : checkin.stress === 'Moderate' ? 14 : 4) + (checkin.workload === 'Heavy' ? 14 : checkin.workload === 'Normal' ? 6 : 2) + (checkin.fatigue === 'High' ? 17 : checkin.fatigue === 'Moderate' ? 8 : 2) + (checkin.mood === 'Very Low' ? 18 : checkin.mood === 'Low' ? 12 : checkin.mood === 'Okay' ? 7 : 2))
  const status: RiskAssessment['status'] = score >= 70 ? 'Elevated' : score >= 45 ? 'Moderate' : score >= 25 ? 'Watch' : 'Stable'
  const recommendation = score >= 45 ? 'Consider a decompression break and a welfare check-in.' : 'Keep your usual recovery routine and check in again when it suits you.'
  return { score, status, factors: factors.length ? factors : ['No significant changes from recent baseline'], recommendation, explanation: factors.length ? `This illustrative indicator reflects ${factors.slice(0, 2).join(' and ').toLowerCase()} in your latest check-in. It is a prompt for supportive reflection, not a diagnosis.` : 'Your latest responses are close to your recent baseline.' }
}
