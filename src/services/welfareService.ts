import { demoAlerts } from '../demo/demoAlerts'
import { demoInterventions } from '../demo/demoInterventions'
export const getWelfareAlerts = async () => demoAlerts
export const getInterventions = async () => demoInterventions
export const acknowledgeDemoAlert = async (id: string) => ({ id, acknowledged: true, demo: true })
