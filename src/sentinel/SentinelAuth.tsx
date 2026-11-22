import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import type { AuthError, Session, User as SupabaseUser } from '@supabase/supabase-js'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Shield, UserRound } from 'lucide-react'
import { isSupabaseConfigured, setSupabaseSessionPersistence, supabase } from '../lib/supabase'

type SentinelUser = { id: string; name: string; email: string }
type AuthResult = { error?: string; requiresEmailConfirmation?: boolean }
type AuthApi = {
  user: SentinelUser | null
  loading: boolean
  configurationError: string | null
  profileError: string | null
  signUp: (name: string, email: string, password: string) => Promise<AuthResult>
  signIn: (email: string, password: string, remember: boolean) => Promise<AuthResult>
  signOut: () => Promise<AuthResult>
  logout: () => Promise<AuthResult>
  requestPasswordReset: (email: string) => Promise<AuthResult>
}

const DASHBOARD = '/dashboard'
const AuthContext = createContext<AuthApi | null>(null)
const authFailure = 'We could not complete that request. Check your details and try again.'

function getDisplayName(authUser: SupabaseUser, profileName?: string | null) {
  return profileName?.trim() || (typeof authUser.user_metadata?.display_name === 'string' ? authUser.user_metadata.display_name.trim() : '') || authUser.email?.split('@')[0] || 'SENTINEL user'
}

function safeAuthError(error: AuthError) {
  const message = error.message.toLowerCase()
  if (message.includes('already registered') || message.includes('already been registered')) return 'An account with this email already exists.'
  if (message.includes('invalid login credentials') || message.includes('email not confirmed')) return 'We could not sign you in with those details. Check your email and password, and verify your email if requested.'
  if (message.includes('password')) return 'Use a password that meets the account requirements.'
  if (message.includes('rate limit')) return 'Too many attempts. Please wait a little and try again.'
  return authFailure
}

async function readSentinelUser(authUser: SupabaseUser): Promise<SentinelUser> {
  let profileName: string | null = null
  if (supabase) {
    try {
      const { data, error } = await supabase.from('profiles').select('display_name').eq('id', authUser.id).maybeSingle()
      if (!error) profileName = data?.display_name ?? null
    } catch {
      // Auth remains valid when the optional SENTINEL profile migration is absent.
    }
  }
  return { id: authUser.id, name: getDisplayName(authUser, profileName), email: authUser.email ?? '' }
}

export function SentinelAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SentinelUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)
  const syncGeneration = useRef(0)
  const [configurationError] = useState(() => isSupabaseConfigured ? null : 'SENTINEL authentication is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY) to continue.')

  const syncSession = useCallback(async (session: Session | null): Promise<boolean> => {
    const generation = ++syncGeneration.current
    if (!session?.user) {
      if (generation !== syncGeneration.current) return false
      setUser(null)
      setProfileError(null)
      setLoading(false)
      return true
    }
    try {
      const nextUser = await readSentinelUser(session.user)
      if (generation !== syncGeneration.current) return false
      setUser(nextUser)
      setProfileError(null)
      return true
    } catch {
      if (generation !== syncGeneration.current) return false
      setUser(null)
      setProfileError('Your account is signed in, but its profile could not be loaded. Check that the SENTINEL database migration has been applied, then try again.')
      return false
    } finally {
      if (generation === syncGeneration.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    let active = true
    const client = supabase
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      // Defer database access until after the auth callback returns.
      queueMicrotask(() => { if (active) void syncSession(session) })
    })
    void client.auth.getSession().then(({ data, error }) => {
      if (!active) return
      if (error) { setUser(null); setLoading(false); return }
      void syncSession(data.session)
    }).catch(() => { if (active) { setUser(null); setLoading(false) } })
    return () => { active = false; listener.subscription.unsubscribe() }
  }, [syncSession])

  const signUp = useCallback(async (name: string, email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return { error: configurationError ?? authFailure }
    try {
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { display_name: name.trim() }, emailRedirectTo: `${window.location.origin}/login` } })
      if (error) return { error: safeAuthError(error) }
      if (!data.user) return { error: authFailure }
      if (!data.session) return { requiresEmailConfirmation: true }
      if (!await syncSession(data.session)) return { error: 'Your account was created, but its profile could not be loaded. Please contact support.' }
      return {}
    } catch { return { error: authFailure } }
  }, [configurationError, syncSession])

  const signIn = useCallback(async (email: string, password: string, remember: boolean): Promise<AuthResult> => {
    if (!supabase) return { error: configurationError ?? authFailure }
    setSupabaseSessionPersistence(remember)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) return { error: safeAuthError(error) }
      if (!data.session) return { error: 'Please verify your email before signing in.' }
      if (!await syncSession(data.session)) return { error: 'Your account is signed in, but its profile could not be loaded. Check that the SENTINEL database migration has been applied.' }
      return {}
    } catch { return { error: authFailure } }
  }, [configurationError, syncSession])

  const signOut = useCallback(async (): Promise<AuthResult> => {
    if (!supabase) return { error: configurationError ?? authFailure }
    try {
      const { error } = await supabase.auth.signOut()
      if (error) return { error: safeAuthError(error) }
      syncGeneration.current += 1
      setUser(null)
      return {}
    } catch { return { error: authFailure } }
  }, [configurationError])

  const requestPasswordReset = useCallback(async (email: string): Promise<AuthResult> => {
    if (!supabase) return { error: configurationError ?? authFailure }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/login` })
      return error ? { error: safeAuthError(error) } : {}
    } catch { return { error: authFailure } }
  }, [configurationError])

  const value = useMemo<AuthApi>(() => ({ user, loading, configurationError, profileError, signUp, signIn, signOut, logout: signOut, requestPasswordReset }), [user, loading, configurationError, profileError, signUp, signIn, signOut, requestPasswordReset])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useSentinelAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useSentinelAuth must be inside SentinelAuthProvider')
  return value
}

function LoadingState() { return <main className="sentinel-auth" role="status" aria-live="polite"><div className="auth-form-wrap"><h2>Restoring your session</h2><p className="auth-intro">Please wait while SENTINEL checks your account.</p></div></main> }

export function SentinelProtected({ children }: { children: ReactNode }) {
  const { user, loading } = useSentinelAuth()
  const location = useLocation()
  if (loading) return <LoadingState />
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return <>{children}</>
}

function AuthFrame({ children, heading, intro }: { children: ReactNode; heading: string; intro: string }) {
  return <main className="sentinel-auth"><section className="auth-welcome"><Link className="sentinel-brand" to="/" aria-label="SENTINEL home"><span className="brand-shield"><Shield size={20}/></span><span><b>SENTINEL</b><small>MENTAL HEALTH INTELLIGENCE</small></span></Link><div className="auth-welcome-copy"><span className="overline">UNDERSTANDING EMOTIONAL PATTERNS THROUGH SOCIAL MEDIA.</span><h1>Understand emotions<br/><em>beyond the words.</em></h1><p>Explore emotional signals, sentiment and behavioral patterns through multimodal analysis of social media text and images.</p></div><div className="auth-assurance"><Shield size={16}/> Multimodal Analysis · Privacy-first · User-focused</div></section><section className="auth-form-panel"><div className="auth-form-wrap"><div className="auth-mobile-brand"><Link className="sentinel-brand" to="/"><span className="brand-shield"><Shield size={18}/></span><span><b>SENTINEL</b><small>MENTAL HEALTH INTELLIGENCE</small></span></Link></div><h2>{heading}</h2><p className="auth-intro">{intro}</p>{children}</div><footer>© 2026 SENTINEL <span>·</span> Multimodal Mental Health Monitoring</footer></section></main>
}

function AuthConfigurationNotice({ message }: { message: string | null }) { return message ? <p className="auth-error" role="alert">{message}</p> : null }

export function SentinelLoginPage() {
  const { user, loading, configurationError, profileError, signIn, requestPasswordReset } = useSentinelAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState((location.state as { message?: string } | null)?.message ?? '')
  const [busy, setBusy] = useState(false)
  const [recoveryBusy, setRecoveryBusy] = useState(false)
  if (loading) return <LoadingState />
  if (user) return <Navigate to={DASHBOARD} replace />
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setNotice('')
    if (!email.trim() || !password) { setError('Enter your email and password.'); return }
    setBusy(true)
    const result = await signIn(email, password, remember)
    setBusy(false)
    if (result.error) { setError(result.error); return }
    const state = location.state as { from?: string } | null
    navigate(state?.from ?? DASHBOARD, { replace: true })
  }
  const recover = async () => {
    setError(''); setNotice('')
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setError('Enter your account email first, then request a password reset.'); return }
    setRecoveryBusy(true)
    const result = await requestPasswordReset(email)
    setRecoveryBusy(false)
    if (result.error) setError(result.error)
    else setNotice('If an account exists for that email, a password recovery link has been sent.')
  }
  return <AuthFrame heading="Welcome back" intro="Sign in to your SENTINEL account."><AuthConfigurationNotice message={configurationError}/><AuthConfigurationNotice message={profileError}/><form className="sentinel-auth-form" onSubmit={submit} noValidate><label>Email address<span className="auth-input"><Mail size={17}/><input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} autoComplete="username" placeholder="you@example.com"/></span></label><label>Password<span className="auth-input"><LockKeyhole size={17}/><input type={show?'text':'password'} value={password} onChange={(e)=>setPassword(e.target.value)} autoComplete="current-password" placeholder="Enter your password"/><button type="button" className="auth-eye" onClick={()=>setShow(!show)} aria-label={show?'Hide password':'Show password'}>{show?<EyeOff size={17}/>:<Eye size={17}/>}</button></span></label><div className="auth-options"><label className="remember-option"><input type="checkbox" checked={remember} onChange={(e)=>setRemember(e.target.checked)}/> Remember me</label><button type="button" className="auth-forgot" onClick={()=>void recover()} disabled={recoveryBusy}>{recoveryBusy ? 'Sending…' : 'Forgot password?'}</button></div>{notice&&<p role="status" className="auth-recovery-note">{notice}</p>}{error&&<p role="alert" className="auth-error">{error}</p>}<button className="auth-submit" type="submit" disabled={busy || Boolean(configurationError)}>{busy?'Signing in…':'Sign in'} <ArrowRight size={16}/></button></form><p className="auth-switch">Don&apos;t have an account? <Link to="/signup">Create an account</Link></p></AuthFrame>
}

export function SentinelSignupPage() {
  const { user, loading, configurationError, signUp } = useSentinelAuth()
  const navigate = useNavigate()
  const [name,setName]=useState('')
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [confirm,setConfirm]=useState('')
  const [show,setShow]=useState(false)
  const [error,setError]=useState('')
  const [busy,setBusy]=useState(false)
  if (loading) return <LoadingState />
  if(user)return <Navigate to={DASHBOARD} replace/>
  const submit=async(event:FormEvent)=>{
    event.preventDefault();setError('')
    if(name.trim().length<2)return setError('Enter your full name.')
    if(!/^\S+@\S+\.\S+$/.test(email.trim()))return setError('Enter a valid email address.')
    if(password.length<8)return setError('Use at least 8 characters for your password.')
    if(password!==confirm)return setError('Passwords do not match.')
    setBusy(true)
    const result=await signUp(name,email,password)
    setBusy(false)
    if(result.error)return setError(result.error)
    if(result.requiresEmailConfirmation)navigate('/login',{state:{message:'Your account was created. Check your email to verify your address before signing in.'}})
    else navigate(DASHBOARD,{replace:true})
  }
  return <AuthFrame heading="Create your account" intro="Set up your SENTINEL account."><AuthConfigurationNotice message={configurationError}/><form className="sentinel-auth-form" onSubmit={submit} noValidate><label>Full name<span className="auth-input"><UserRound size={17}/><input value={name} onChange={(e)=>setName(e.target.value)} autoComplete="name" placeholder="Your name"/></span></label><label>Email address<span className="auth-input"><Mail size={17}/><input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com"/></span></label><label>Password<span className="auth-input"><LockKeyhole size={17}/><input type={show?'text':'password'} value={password} onChange={(e)=>setPassword(e.target.value)} autoComplete="new-password" placeholder="At least 8 characters"/><button type="button" className="auth-eye" onClick={()=>setShow(!show)} aria-label={show?'Hide password':'Show password'}>{show?<EyeOff size={17}/>:<Eye size={17}/>}</button></span></label><label>Confirm password<span className="auth-input"><LockKeyhole size={17}/><input type={show?'text':'password'} value={confirm} onChange={(e)=>setConfirm(e.target.value)} autoComplete="new-password" placeholder="Re-enter your password"/></span></label>{error&&<p role="alert" className="auth-error">{error}</p>}<button className="auth-submit" type="submit" disabled={busy || Boolean(configurationError)}>{busy?'Creating account…':'Create account'} <ArrowRight size={16}/></button></form><p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p></AuthFrame>
}
