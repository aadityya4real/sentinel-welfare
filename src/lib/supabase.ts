import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)
let rememberSession = true

export function setSupabaseSessionPersistence(remember: boolean) {
  rememberSession = remember
}

const authStorage = {
  getItem(key: string) {
    const sessionValue = window.sessionStorage.getItem(key)
    if (sessionValue !== null) {
      rememberSession = false
      return sessionValue
    }
    const localValue = window.localStorage.getItem(key)
    if (localValue !== null) rememberSession = true
    return localValue
  },
  setItem(key: string, value: string) {
    const destination = rememberSession ? window.localStorage : window.sessionStorage
    const other = rememberSession ? window.sessionStorage : window.localStorage
    other.removeItem(key)
    destination.setItem(key, value)
  },
  removeItem(key: string) {
    window.localStorage.removeItem(key)
    window.sessionStorage.removeItem(key)
  },
}

let client: SupabaseClient | null = null

function getClient() {
  if (!client && isSupabaseConfigured) {
    client = createClient(supabaseUrl, supabaseAnonKey, { auth: { storage: authStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  }
  return client
}

// Keep the existing API for the app's account features, but don't initialize
// Supabase Auth until one of those features actually uses the client.
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? new Proxy({} as SupabaseClient, {
    get(_target, property) {
      const activeClient = getClient()
      if (!activeClient) return undefined
      const value = Reflect.get(activeClient, property, activeClient) as unknown
      return typeof value === 'function' ? value.bind(activeClient) : value
    },
  })
  : null
