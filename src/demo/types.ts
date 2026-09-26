export type Personnel = { id: string; unit: string; displayName: string; status: 'Stable' | 'Watch' | 'Elevated' | 'High'; factors: string[] }
export type WellnessCheckin = { mood: string; stress: string; sleepHours: number; fatigue: string; workload: string; note?: string }
export type RiskAssessment = { score: number; status: 'Stable' | 'Watch' | 'Moderate' | 'Elevated' | 'High'; factors: string[]; recommendation: string; explanation: string }
export type WelfareAlert = Personnel & { detected: string; recommendation: string; priority: 'High Priority' | 'Elevated' | 'Watch' }
export type Intervention = { title: string; detail: string; status: string; due: string }
export type Unit = { name: string; status: string; personnel: number; readiness: number }
export type WellnessTrend = { day: string; stress: number; sleep: number; fatigue: number; workload: number }
