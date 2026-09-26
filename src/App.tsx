import { Navigate, Route, Routes } from 'react-router-dom'
import { LandingPage, SentinelPage, SettingsPage } from './sentinel/SentinelPages'
import { SentinelLoginPage, SentinelProtected, SentinelRole, SentinelSignupPage, useSentinelAuth } from './sentinel/SentinelAuth'
import { useSearchParams } from 'react-router-dom'

export function App() {
  return <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<SentinelLoginPage />} />
    <Route path="/signup" element={<SentinelSignupPage />} />
    {(['personnel', 'welfare', 'commander'] as SentinelRole[]).map((role) => <Route key={role} path={`/${role}/*`} element={<SentinelProtected role={role}><SentinelPage role={role} /></SentinelProtected>} />)}
    <Route path="/settings" element={<ProtectedSettings />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}

function ProtectedSettings() {
  const [params] = useSearchParams()
  const { user } = useSentinelAuth()
  const queryRole = params.get('role')
  const role: SentinelRole = queryRole === 'welfare' || queryRole === 'commander' ? queryRole : 'personnel'
  return <SentinelProtected role={user?.role ?? role}><SettingsPage /></SentinelProtected>
}
