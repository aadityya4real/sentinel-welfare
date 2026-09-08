import { supabase } from '../../lib/supabase'

export type HealthSnapshot = { activeTreatments: number; upcomingAppointments: number; healthRecords: number; careTeamMembers: number }

function client() { if (!supabase) throw new Error('Supabase is not configured yet.'); return supabase }
function countOrThrow(result: { count: number | null; error: { message: string } | null }, label: string) { if (result.error) throw new Error(`Unable to load ${label}: ${result.error.message}`); return result.count ?? 0 }

export async function fetchHealthSnapshot(patientId: string): Promise<HealthSnapshot> {
  const now = new Date().toISOString()
  const [treatments, appointments, healthRecords, careTeamMembers] = await Promise.all([
    client().from('treatments').select('id', { count: 'exact', head: true }).eq('patient_id', patientId).eq('status', 'active'),
    client().from('appointments').select('id', { count: 'exact', head: true }).eq('patient_id', patientId).gt('appointment_at', now).neq('status', 'Cancelled'),
    client().from('health_records').select('id', { count: 'exact', head: true }).eq('patient_id', patientId),
    client().from('doctor_patient_connections').select('id', { count: 'exact', head: true }).eq('patient_id', patientId).eq('status', 'approved'),
  ])

  return {
    activeTreatments: countOrThrow(treatments, 'active treatments'),
    upcomingAppointments: countOrThrow(appointments, 'upcoming appointments'),
    healthRecords: countOrThrow(healthRecords, 'health records'),
    careTeamMembers: countOrThrow(careTeamMembers, 'care team members'),
  }
}
