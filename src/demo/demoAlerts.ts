import type { WelfareAlert } from './types'
export const demoAlerts: WelfareAlert[] = [
  { id: 'PN-20481', unit: 'Unit Alpha', displayName: 'Personnel PN-20481', status: 'Elevated', priority: 'Elevated', factors: ['Reduced sleep', 'Increased workload'], detected: '18 minutes ago', recommendation: 'Welfare check-in within 24 hours' },
  { id: 'PN-19832', unit: 'Unit Bravo', displayName: 'Personnel PN-19832', status: 'High', priority: 'High Priority', factors: ['Extended deployment', 'Increased fatigue'], detected: '42 minutes ago', recommendation: 'Offer confidential welfare support' },
  { id: 'PN-21704', unit: 'Unit Charlie', displayName: 'Personnel PN-21704', status: 'Watch', priority: 'Watch', factors: ['Schedule disruption'], detected: 'Today, 08:10', recommendation: 'Monitor trend and offer resources' },
]
