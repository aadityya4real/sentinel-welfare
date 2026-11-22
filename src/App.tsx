import { Navigate, Route, Routes } from 'react-router-dom'
import { SentinelLoginPage, SentinelPresentationPage, SentinelProtected, SentinelSignupPage } from './sentinel/SentinelAuth'
import { AccountSettingsPage, AnalyzePostPage, AnalysisInsightsPage, BehavioralTrendsPage, CommunitySupportPage, DashboardPage, PrivacyDataPage, SentinelAppShell, SupportCenterPage } from './sentinel/MentalHealthPages'
import { LandingPage } from './sentinel/SentinelPages'

export function App() {
  return <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<SentinelLoginPage />} />
    <Route path="/presentation" element={<SentinelPresentationPage />} />
    <Route path="/signup" element={<SentinelSignupPage />} />
    <Route path="/dashboard" element={<SentinelProtected><SentinelAppShell /></SentinelProtected>}>
      <Route index element={<DashboardPage />} />
      <Route path="analyze" element={<AnalyzePostPage />} />
      <Route path="trends" element={<BehavioralTrendsPage />} />
      <Route path="insights" element={<AnalysisInsightsPage />} />
      <Route path="support" element={<SupportCenterPage />} />
      <Route path="community" element={<CommunitySupportPage />} />
      <Route path="privacy" element={<PrivacyDataPage />} />
      <Route path="settings" element={<AccountSettingsPage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Route>
    <Route path="/personnel/*" element={<Navigate to="/dashboard" replace />} />
    <Route path="/welfare/*" element={<Navigate to="/dashboard" replace />} />
    <Route path="/commander/*" element={<Navigate to="/dashboard" replace />} />
    <Route path="/settings" element={<Navigate to="/dashboard/settings" replace />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}
