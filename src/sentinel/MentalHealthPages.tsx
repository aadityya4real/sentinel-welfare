import { useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Activity, ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, BookOpen, Brain, CheckCircle2, ChevronRight, CircleHelp, Clock3, FileImage, FileText, HeartHandshake, Home, ImagePlus, LockKeyhole, Menu, MessageCircleHeart, Shield, ShieldCheck, Sparkles, Upload, UserRound, UsersRound, X } from 'lucide-react'
import { useSentinelAuth } from './SentinelAuth'
import { analyzePost } from '../features/social-analysis/analyzePost'
import { saveAnalysis, useAnalysisHistory, type AnalysisResult, type SavedAnalysis, type SentimentLabel } from '../features/social-analysis/history'

const navigation = [
  { label: 'Overview', path: '/dashboard', icon: Home, end: true },
  { label: 'Analyze Post', path: '/dashboard/analyze', icon: FileText },
  { label: 'Behavioral Trends', path: '/dashboard/trends', icon: Activity },
  { label: 'Analysis Insights', path: '/dashboard/insights', icon: Brain },
  { label: 'Support Center', path: '/dashboard/support', icon: HeartHandshake },
  { label: 'Community Support', path: '/dashboard/community', icon: UsersRound },
  { label: 'Privacy & Data', path: '/dashboard/privacy', icon: Shield },
  { label: 'Settings', path: '/dashboard/settings', icon: UserRound },
]

const samplePosts = [
  { id: 'S-1042', text: 'Taking things one day at a time. Grateful for the small wins.', date: '22 Nov 2026', sentiment: 'Positive', emotion: 'Hope', status: 'Analyzed' },
  { id: 'S-1041', text: 'Some days feel heavier than others, but I am still showing up.', date: '21 Nov 2026', sentiment: 'Mixed', emotion: 'Sadness', status: 'Analyzed' },
  { id: 'S-1040', text: 'A quiet morning and a long walk helped me reset.', date: '19 Nov 2026', sentiment: 'Positive', emotion: 'Calm', status: 'Analyzed' },
]

const emotionSamples = [
  { name: 'Joy', value: 31, color: 'joy' },
  { name: 'Sadness', value: 24, color: 'sadness' },
  { name: 'Neutral', value: 19, color: 'neutral' },
  { name: 'Hope', value: 15, color: 'hope' },
  { name: 'Anxiety', value: 11, color: 'anxiety' },
]

const sampleSeries = {
  positive: [43, 48, 44, 58, 55, 66, 71],
  negative: [60, 56, 62, 49, 52, 42, 38],
  neutral: [34, 38, 35, 39, 42, 38, 44],
}

function Brand() {
  return <Link className="sentinel-brand" to="/" aria-label="SENTINEL home"><span className="brand-shield"><Shield size={20} /></span><span><b>SENTINEL</b><small>MENTAL HEALTH INTELLIGENCE</small></span></Link>
}

function initials(name: string | undefined) {
  return name?.split(/\s+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'U'
}

const titles: Record<string, string> = {
  dashboard: 'Overview', analyze: 'Analyze Post', trends: 'Behavioral Trends', insights: 'Analysis Insights',
  support: 'Support Center', community: 'Community Support', privacy: 'Privacy & Data', settings: 'Settings',
}

export function SentinelAppShell() {
  const { user, logout } = useSentinelAuth()
  const [mobileNav, setMobileNav] = useState(false)
  const [authError, setAuthError] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const page = location.pathname.split('/').filter(Boolean).at(-1) || 'dashboard'
  const title = titles[page] || 'Overview'

  return <div className="sentinel-app mental-health-app">
    <aside className={`sentinel-sidebar ${mobileNav ? 'open' : ''}`}>
      <Brand />
      <div className="user-workspace"><span className="workspace-avatar">{initials(user?.name)}</span><span><b>{user?.name || 'Your account'}</b><small>PERSONAL WORKSPACE</small></span></div>
      <div className="sidebar-label">WORKSPACE</div>
      <nav aria-label="Main navigation">{navigation.map(({ label, path, icon: Icon, end }) => <NavLink key={path} to={path} end={end} onClick={() => setMobileNav(false)} className={({ isActive }) => `side-link ${isActive ? 'selected' : ''}`}><Icon size={17} />{label}</NavLink>)}</nav>
      <div className="sidebar-bottom"><div className="privacy-mini"><ShieldCheck size={16} /><span>Privacy-first<br /><small>User-focused analysis</small></span></div></div>
    </aside>
    <div className="sentinel-main">
      <header className="sentinel-topbar"><button className="mobile-menu" type="button" onClick={() => setMobileNav(!mobileNav)} aria-label="Toggle navigation">{mobileNav ? <X /> : <Menu />}</button><div className="breadcrumb"><span>SENTINEL</span><b>/</b>{title}</div><div className="topbar-right"><Link className="icon-action" to="/dashboard/support" aria-label="Support center"><CircleHelp size={18} /></Link><span className="avatar-small" title={user?.name}>{initials(user?.name)}</span><button className="auth-logout" type="button" onClick={async () => { const result = await logout(); if (result.error) setAuthError(result.error); else navigate('/login', { replace: true }) }}>Sign out</button></div></header>
      {authError && <p role="alert" className="auth-error">{authError}</p>}
      <main className="page-content"><Outlet /></main>
      <footer className="app-footer"><span><ShieldCheck size={14} /> SENTINEL · Multimodal Mental Health Monitoring</span><span>Sample insights are labeled clearly</span></footer>
    </div>
  </div>
}

function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <header className="page-heading"><div><span className="overline">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action}</header>
}

function SamplePill() { return <span className="sample-pill"><Sparkles size={12} /> Illustrative sample data</span> }

function MetricCard({ icon: Icon, label, value, detail, tone, trend }: { icon: typeof Activity; label: string; value: string; detail: string; tone: string; trend?: string }) {
  return <article className="metric-card mh-metric"><span className={`metric-icon ${tone}`}><Icon size={18} /></span><span className="metric-label">{label}</span><b>{value}</b><small>{trend && <ArrowUpRight size={12} />}{detail}</small></article>
}

function SeriesChart({ compact = false, series = sampleSeries, labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }: { compact?: boolean; series?: { positive: number[]; negative: number[]; neutral: number[] }; labels?: string[] }) {
  const points = (values: number[]) => values.map((value, index) => `${28 + index * 74},${170 - value * 1.45}`).join(' ')
  return <div className={`trend-chart mh-chart ${compact ? 'compact' : ''}`}><div className="chart-y-labels"><span>High</span><span>Moderate</span><span>Low</span></div><svg viewBox="0 0 500 205" preserveAspectRatio="none" role="img" aria-label="Positive, negative, and neutral sentiment trends"><line x1="24" y1="35" x2="490" y2="35"/><line x1="24" y1="103" x2="490" y2="103"/><line x1="24" y1="171" x2="490" y2="171"/><polyline className="line-positive" points={points(series.positive)} /><polyline className="line-negative" points={points(series.negative)} /><polyline className="line-neutral" points={points(series.neutral)} /></svg><div className="chart-x-labels">{labels.map((label, index) => <span key={`${label}-${index}`}>{label}</span>)}</div></div>
}

function Legend() { return <div className="chart-legend mh-legend"><span><i className="legend-positive"/>Positive</span><span><i className="legend-negative"/>Negative</span><span><i className="legend-neutral"/>Neutral</span></div> }

function SampleInsight({ title, children, icon: Icon = Sparkles, isSample = true }: { title: string; children: ReactNode; icon?: typeof Sparkles; isSample?: boolean }) { return <article className="mh-insight"><span className="mh-insight-icon"><Icon size={16}/></span><div><div className="mh-insight-title"><b>{title}</b>{isSample && <span>Sample</span>}</div><p>{children}</p></div></article> }

const sentimentLabels: SentimentLabel[] = ['positive', 'negative', 'neutral']
const emotionColors = ['joy', 'sadness', 'neutral', 'hope', 'anxiety']
function percentage(value: number, total: number) { return total ? Math.round((value / total) * 100) : 0 }
function toRecentPost(entry: SavedAnalysis) {
  const date = new Date(entry.createdAt)
  const topEmotion = [...entry.analysis.emotions].sort((a, b) => b.score - a.score)[0]?.category ?? 'Unclear'
  return { id: entry.id, text: entry.text, date: date.toLocaleDateString(), sentiment: entry.analysis.sentiment.label, emotion: topEmotion, status: 'Analyzed' }
}
function sentimentCounts(entries: SavedAnalysis[]) {
  const counts: Record<SentimentLabel, number> = { positive: 0, neutral: 0, negative: 0 }
  entries.forEach((entry) => { counts[entry.analysis.sentiment.label] += 1 })
  return counts
}
function emotionDistribution(entries: SavedAnalysis[]) {
  const totals = new Map<string, number>()
  entries.forEach((entry) => entry.analysis.emotions.forEach(({ category, score }) => totals.set(category, (totals.get(category) ?? 0) + score)))
  const total = [...totals.values()].reduce((sum, value) => sum + value, 0)
  return [...totals.entries()].map(([name, value], index) => ({ name, value: percentage(value, total), color: emotionColors[index % emotionColors.length] })).sort((a, b) => b.value - a.value).slice(0, 5)
}
function weeklySentiment(entries: SavedAnalysis[]) {
  const days = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - (6 - offset))
    return { date, positive: 0, negative: 0, neutral: 0 }
  })
  entries.forEach((entry) => {
    const entryDay = new Date(entry.createdAt)
    entryDay.setHours(0, 0, 0, 0)
    const day = days.find((item) => item.date.getTime() === entryDay.getTime())
    if (day) day[entry.analysis.sentiment.label] += 1
  })
  return {
    labels: days.map((day) => day.date.toLocaleDateString(undefined, { weekday: 'short' })),
    series: {
      positive: days.map((day) => percentage(day.positive, day.positive + day.negative + day.neutral)),
      negative: days.map((day) => percentage(day.negative, day.positive + day.negative + day.neutral)),
      neutral: days.map((day) => percentage(day.neutral, day.positive + day.negative + day.neutral)),
    },
    postingFrequency: days.map((day) => day.positive + day.negative + day.neutral),
  }
}

export function DashboardPage() {
  const { user } = useSentinelAuth()
  const analyses = useAnalysisHistory(user?.id)
  const hasRealAnalyses = analyses.length > 0
  const counts = sentimentCounts(analyses)
  const realEmotions = hasRealAnalyses ? emotionDistribution(analyses) : []
  const mostCommonEmotion = realEmotions[0]?.name ?? '—'
  const realRecentPosts = analyses.slice(0, 3).map(toRecentPost)
  const latest = analyses[0]
  return <>
    <PageHeading eyebrow="MENTAL HEALTH INTELLIGENCE" title={`Welcome back, ${user?.name || 'there'}`} description="Explore emotional signals, sentiment and behavioral patterns through multimodal analysis of your social media posts." action={hasRealAnalyses ? undefined : <SamplePill />} />
    <div className="metric-grid five mh-metrics"><MetricCard icon={FileText} label="Posts analyzed" value={hasRealAnalyses ? String(analyses.length) : '128'} detail={hasRealAnalyses ? 'Saved analyses in this browser' : 'Illustrative sample posts'} tone="teal"/><MetricCard icon={ArrowUpRight} label="Positive sentiment" value={hasRealAnalyses ? `${percentage(counts.positive, analyses.length)}%` : '48%'} detail={hasRealAnalyses ? 'Your saved analyses' : 'Sample dataset'} tone="green"/><MetricCard icon={ArrowDownRight} label="Negative sentiment" value={hasRealAnalyses ? `${percentage(counts.negative, analyses.length)}%` : '22%'} detail={hasRealAnalyses ? 'Your saved analyses' : 'Sample dataset'} tone="amber"/><MetricCard icon={BarChart3} label="Neutral sentiment" value={hasRealAnalyses ? `${percentage(counts.neutral, analyses.length)}%` : '30%'} detail={hasRealAnalyses ? 'Your saved analyses' : 'Sample dataset'} tone="blue"/><MetricCard icon={Brain} label="Most detected emotion" value={hasRealAnalyses ? mostCommonEmotion : 'Joy'} detail={hasRealAnalyses ? 'Highest average emotion score' : 'Illustrative sample'} tone="purple"/></div>
    <section className="panel mh-trends-panel"><div className="panel-heading"><div><span className="overline">{hasRealAnalyses ? 'LAST 7 DAYS · YOUR SAVED ANALYSES' : 'WEEKLY VIEW · SAMPLE DATA'}</span><h2>Emotional Trends</h2></div><Link className="subtle-link" to="/dashboard/trends">View trends <ArrowRight size={14}/></Link></div>{hasRealAnalyses ? <SeriesChart compact {...weeklySentiment(analyses)} /> : <SeriesChart compact />}<Legend/></section>
    <div className="mh-dashboard-grid">
      <section className="panel recent-analysis"><div className="panel-heading"><div><span className="overline">{hasRealAnalyses ? 'YOUR RECENT RESULTS' : 'RECENT ANALYSIS · SAMPLE'}</span><h2>Recent Analysis</h2></div><Link className="subtle-link" to="/dashboard/insights">View history <ArrowRight size={14}/></Link></div><div className="recent-list">{(hasRealAnalyses ? realRecentPosts : samplePosts).map((post) => <article className="recent-post" key={post.id}><span className="recent-post-icon"><FileText size={16}/></span><div className="recent-post-copy"><b>{post.text}</b><small>{post.date} <span>·</span> {post.sentiment} sentiment <span>·</span> {post.emotion}</small></div><span className="analysis-status"><CheckCircle2 size={13}/>{post.status}</span><Link to={`/dashboard/insights?post=${post.id}`} aria-label={`View analysis ${post.id}`}><ChevronRight size={17}/></Link></article>)}</div>{hasRealAnalyses ? <p className="sample-caption">Results are saved in this browser for your signed-in account.</p> : <p className="sample-caption">Example entries only · They are not actual analyses.</p>}</section>
      <section className="panel emotion-panel"><div className="panel-heading"><div><span className="overline">{hasRealAnalyses ? 'YOUR SAVED RESULTS' : 'SAMPLE DISTRIBUTION'}</span><h2>Emotion Distribution</h2></div></div><div className="emotion-list">{(hasRealAnalyses ? realEmotions : emotionSamples).map((emotion) => <div className="emotion-row" key={emotion.name}><span>{emotion.name}</span><div className="emotion-track"><i className={`emotion-fill ${emotion.color}`} style={{ width: `${emotion.value}%` }}/></div><b>{emotion.value}%</b></div>)}</div><p className="sample-caption">{hasRealAnalyses ? 'Distribution calculated from saved emotion scores.' : 'Illustrative only · Not generated from your posts.'}</p></section>
      <section className="panel latest-insights"><div className="panel-heading"><div><span className="overline">{hasRealAnalyses ? 'LATEST RESULT' : 'SAMPLE SUMMARY'}</span><h2>Latest Insights</h2></div><Link className="subtle-link" to="/dashboard/insights">Explore <ArrowRight size={14}/></Link></div>{latest ? <SampleInsight isSample={false} title={`${latest.analysis.sentiment.label[0].toUpperCase()}${latest.analysis.sentiment.label.slice(1)} tone in the latest post`}>{latest.analysis.explanation}</SampleInsight> : <><SampleInsight title="Positive expression appears most often">In this illustrative dataset, positive sentiment is the largest category across the week.</SampleInsight><SampleInsight title="A steady midweek pattern" icon={Activity}>Emotion levels vary through the week; a single post is not enough to infer a lasting pattern.</SampleInsight></>}</section>
      <section className="panel quick-actions"><div className="panel-heading"><div><span className="overline">YOUR WORKSPACE</span><h2>Quick Actions</h2></div></div><div className="quick-action-list"><QuickAction to="/dashboard/analyze" icon={FileText} title="Analyze a New Post" text="Submit text for Gemini analysis"/><QuickAction to="/dashboard/trends" icon={Activity} title="View Behavioral Trends" text="Explore sentiment patterns over time"/><QuickAction to="/dashboard/insights" icon={Clock3} title="View Analysis History" text="Review saved results"/></div></section>
    </div>
  </>
}

function QuickAction({ to, icon: Icon, title, text }: { to: string; icon: typeof FileText; title: string; text: string }) { return <Link className="mh-quick-action" to={to}><span><Icon size={16}/></span><div><b>{title}</b><small>{text}</small></div><ArrowRight size={15}/></Link> }

export function AnalyzePostPage() {
  const { user } = useSentinelAuth()
  const [postText, setPostText] = useState('')
  const [platform, setPlatform] = useState('Instagram')
  const [imageName, setImageName] = useState('')
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [modelInfo, setModelInfo] = useState<{ provider: string; name: string; version: string } | null>(null)
  const [contentConsent, setContentConsent] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const chooseImage = (event: ChangeEvent<HTMLInputElement>) => { setImageName(event.target.files?.[0]?.name ?? ''); setError(''); setNotice('') }
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(''); setNotice(''); setAnalysis(null); setModelInfo(null)
    if (!postText.trim()) { setError('Paste post text before starting the analysis. Image analysis is not available yet.'); return }
    if (postText.trim().length > 5000) { setError('Post text must be 5,000 characters or fewer.'); return }
    if (!contentConsent) { setError('Confirm that you understand the post text will be sent to Google Gemini and saved in this browser.'); return }
    setBusy(true)
    try {
      const response = await analyzePost(postText.trim(), platform)
      const saved: SavedAnalysis = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), platform, text: postText.trim(), analysis: response.analysis, modelName: response.model.name, modelVersion: response.model.version }
      setAnalysis(response.analysis)
      setModelInfo(response.model)
      if (user?.id && saveAnalysis(user.id, saved)) setNotice('Analysis complete and saved in this browser for your account.')
      else setNotice('Analysis complete. Browser storage was unavailable, so this result will not appear in your history after you leave this page.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Analysis failed. Please try again.')
    } finally { setBusy(false) }
  }
  return <><PageHeading eyebrow="POST ANALYSIS" title="Analyze Post" description="Submit social media text for a cautious, non-diagnostic analysis."/><div className="analyze-layout"><form className="panel analyze-form" onSubmit={submit}><div className="panel-heading"><div><span className="overline">NEW ANALYSIS</span><h2>Post details</h2></div><FileText size={19}/></div><label className="mh-field">Platform<select value={platform} onChange={(event) => setPlatform(event.target.value)}><option>Instagram</option><option>Facebook</option><option>X</option><option>TikTok</option><option>Other</option></select></label><label className="mh-field">Post text<textarea rows={7} value={postText} maxLength={5000} onChange={(event) => { setPostText(event.target.value); setError(''); setNotice('') }} placeholder="Paste the social media post you want to analyze…" /></label><label className="mh-field">Image <span className="field-optional">Optional</span><span className="image-upload"><ImagePlus size={19}/><span><b>{imageName || 'Add an image'}</b><small>PNG, JPG, or WEBP · Image analysis is not available yet</small></span><Upload size={16}/><input type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseImage}/></span></label><label className="consent-choice"><input type="checkbox" checked={contentConsent} onChange={(event) => setContentConsent(event.target.checked)}/><span><b>Allow this text to be analyzed</b><small>I understand the post text is sent to Google Gemini and saved in this browser if analysis succeeds. This does not save a consent record.</small></span></label>{error && <p className="analysis-notice analysis-error" role="alert">{error}</p>}{notice && <p className="analysis-notice" role="status">{notice}</p>}<button type="submit" className="button button-primary analyze-button" disabled={busy}><Sparkles size={16}/>{busy ? 'Analyzing post…' : 'Analyze post'}</button><small className="form-footnote">Successful results and text are saved in this browser under your account. Images are not sent.</small></form><aside className="panel analysis-preview"><span className="empty-analysis-icon"><Brain size={22}/></span><span className="overline">ANALYSIS RESULTS</span>{busy ? <><h2>Analyzing your post</h2><p>Gemini is reviewing the submitted text. This can take a few seconds.</p></> : analysis && modelInfo ? <AnalysisResultCard analysis={analysis} modelInfo={modelInfo}/> : <><h2>Your results will appear here</h2><p>Analysis labels describe language in one post; they cannot establish a person’s mental state or diagnose a condition.</p><div className="preview-feature"><CheckCircle2 size={15}/>Sentiment and emotion summary</div><div className="preview-feature"><CheckCircle2 size={15}/>Quoted behavioral signals</div><div className="preview-feature"><CheckCircle2 size={15}/>Supportive suggestions</div></>}</aside></div></>
}

function AnalysisResultCard({ analysis, modelInfo }: { analysis: AnalysisResult; modelInfo: { provider: string; name: string; version: string } }) {
  return <div className="analysis-result"><span className="analysis-sentiment-label">{analysis.sentiment.label} sentiment</span><p className="analysis-result-score">Polarity score: {analysis.sentiment.score.toFixed(2)} <span>(−1 to +1)</span></p><h3>Emotions</h3><div className="analysis-emotion-list">{[...analysis.emotions].sort((a, b) => b.score - a.score).map((emotion, index) => <div className="analysis-emotion" key={emotion.category}><span>{emotion.category}</span><div className="emotion-track"><i className={`emotion-fill ${emotionColors[index % emotionColors.length]}`} style={{ width: `${Math.round(emotion.score * 100)}%` }}/></div><b>{Math.round(emotion.score * 100)}%</b></div>)}</div><h3>Text-based explanation</h3><p>{analysis.explanation}</p><blockquote><q>{analysis.explanationEvidence}</q><span>Quoted evidence from the submitted post</span></blockquote><h3>Potential language signals</h3>{analysis.behavioralSignals.length ? analysis.behavioralSignals.map((signal, index) => <blockquote key={`${signal.signal}-${index}`}><b>{signal.signal}</b><q>{signal.evidence}</q><span>{signal.qualification}</span></blockquote>) : <p>No distinct behavioral signal was sufficiently grounded in this post.</p>}<h3>Supportive ideas</h3><ul>{analysis.suggestions.map((suggestion, index) => <li key={`${index}-${suggestion}`}>{suggestion}</li>)}</ul><div className="analysis-confidence"><b>Model confidence estimate: {Math.round(analysis.confidence * 100)}%</b><p>Not calibrated or clinically validated.</p></div><p className="analysis-result-caveat">{analysis.caveat}</p><small className="analysis-model">{modelInfo.provider} · {modelInfo.name} · {modelInfo.version}</small></div>
}

export function BehavioralTrendsPage() {
  const { user } = useSentinelAuth()
  const analyses = useAnalysisHistory(user?.id)
  const hasRealAnalyses = analyses.length > 0
  const counts = sentimentCounts(analyses)
  const weekly = weeklySentiment(analyses)
  const maxFrequency = Math.max(1, ...weekly.postingFrequency)
  const emotionList = hasRealAnalyses ? emotionDistribution(analyses) : emotionSamples
  return <>
    <PageHeading eyebrow="BEHAVIOR OVER TIME" title="Behavioral Trends" description={hasRealAnalyses ? 'Explore patterns in your saved post analyses. These language signals do not establish ongoing behavior or mental state.' : 'Explore illustrative changes in sentiment, emotional expression and posting frequency.'} action={hasRealAnalyses ? undefined : <SamplePill />} />
    <div className="trend-summary">
      <article><span>POSITIVE SENTIMENT</span><b>{hasRealAnalyses ? `${percentage(counts.positive, analyses.length)}%` : '48%'}</b><small><ArrowUpRight size={13} /> {hasRealAnalyses ? 'Your saved analyses' : 'Sample weekly average'}</small></article>
      <article><span>NEGATIVE SENTIMENT</span><b>{hasRealAnalyses ? `${percentage(counts.negative, analyses.length)}%` : '22%'}</b><small><ArrowDownRight size={13} /> {hasRealAnalyses ? 'Your saved analyses' : 'Sample weekly average'}</small></article>
      <article><span>POSTING FREQUENCY</span><b>{hasRealAnalyses ? `${weekly.postingFrequency.reduce((sum, value) => sum + value, 0)} posts` : '18 posts'}</b><small><Clock3 size={13} /> {hasRealAnalyses ? 'Last 7 days' : 'Illustrative week'}</small></article>
    </div>
    <section className="panel mh-trends-panel">
      <div className="panel-heading"><div><span className="overline">{hasRealAnalyses ? 'LAST 7 DAYS · YOUR SAVED ANALYSES' : 'MONDAY–SUNDAY · SAMPLE DATA'}</span><h2>Sentiment trends over time</h2></div></div>
      {hasRealAnalyses ? <SeriesChart labels={weekly.labels} series={weekly.series} /> : <SeriesChart />}
      <Legend />
      <p className="sample-caption">{hasRealAnalyses ? 'Daily percentages are calculated from your saved analyses. Empty days are shown as zero.' : 'Illustrative trend lines only · No real post history is connected.'}</p>
    </section>
    <div className="mh-dashboard-grid trends-lower">
      <section className="panel emotion-panel">
        <div className="panel-heading"><div><span className="overline">{hasRealAnalyses ? 'YOUR SAVED RESULTS' : 'ILLUSTRATIVE DISTRIBUTION'}</span><h2>Emotion distribution</h2></div></div>
        <div className="emotion-list">{emotionList.length ? emotionList.map((emotion) => <div className="emotion-row" key={emotion.name}><span>{emotion.name}</span><div className="emotion-track"><i className={`emotion-fill ${emotion.color}`} style={{ width: `${emotion.value}%` }} /></div><b>{emotion.value}%</b></div>) : <p className="sample-caption">No emotion results are available yet.</p>}</div>
      </section>
      <section className="panel frequency-panel">
        <div className="panel-heading"><div><span className="overline">{hasRealAnalyses ? 'YOUR ANALYSES' : 'SAMPLE POSTS'}</span><h2>Posting frequency</h2></div></div>
        <div className="frequency-bars">{(hasRealAnalyses ? weekly.postingFrequency : [2, 3, 1, 4, 2, 3, 3]).map((value, index) => <div key={index}><span style={{ height: `${hasRealAnalyses ? Math.max(value ? 5 : 2, Math.round(value / maxFrequency * 68)) : value * 17}px` }} /><small>{hasRealAnalyses ? weekly.labels[index] : ['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</small></div>)}</div>
        <p className="sample-caption">{hasRealAnalyses ? 'Count of analyses by day · last 7 days.' : 'Example count per day · not your activity.'}</p>
      </section>
    </div>
    <div className="info-strip"><Activity size={18} /><span><b>Patterns need context.</b> Results summarize language in submitted posts and do not describe a person’s mental health.</span></div>
  </>
}

export function AnalysisInsightsPage() {
  const { user } = useSentinelAuth()
  const analyses = useAnalysisHistory(user?.id)
  if (!analyses.length) return <><PageHeading eyebrow="SUMMARY & HISTORY" title="Analysis Insights" description="Review your saved analysis results and limitations."/><section className="panel history-panel"><div className="panel-heading"><div><span className="overline">YOUR HISTORY</span><h2>No saved analyses yet</h2></div></div><div className="confidence-empty"><span><FileText size={19}/></span><div><b>Your completed analyses will appear here</b><p>Submit a post from Analyze Post. Successful results are saved in this browser for your account.</p><Link className="button button-primary" to="/dashboard/analyze">Analyze a post <ArrowRight size={14}/></Link></div></div></section><div className="info-strip"><ShieldCheck size={18}/><span>Sentiment and emotion labels describe language in one post and are not diagnoses.</span></div></>

  const latest = analyses[0]
  const emotionList = emotionDistribution(analyses)
  return <><PageHeading eyebrow="SUMMARY & HISTORY" title="Analysis Insights" description="Review saved results for your account. Analyses are linguistic signals from individual posts, not diagnoses."/><div className="insight-banner"><span><Brain size={20}/></span><div><span className="overline">LATEST SAVED RESULT · {latest.analysis.sentiment.label.toUpperCase()} SENTIMENT</span><h2>{latest.analysis.explanation}</h2><p>{latest.platform} · {new Date(latest.createdAt).toLocaleString()}</p></div></div><div className="insight-page-grid"><section className="panel"><div className="panel-heading"><div><span className="overline">AVERAGED FROM YOUR SAVED ANALYSES</span><h2>Emotion distribution</h2></div></div><div className="emotion-list">{emotionList.length ? emotionList.map((emotion) => <div className="emotion-row" key={emotion.name}><span>{emotion.name}</span><div className="emotion-track"><i className={`emotion-fill ${emotion.color}`} style={{ width: `${emotion.value}%` }}/></div><b>{emotion.value}%</b></div>) : <p className="sample-caption">No emotion scores are available.</p>}</div><SampleInsight isSample={false} title="Single-post interpretation">One post cannot establish a lasting emotional or behavioral pattern.</SampleInsight></section><section className="panel confidence-panel"><div className="panel-heading"><div><span className="overline">MODEL INFORMATION</span><h2>Confidence & limitations</h2></div></div><div className="confidence-empty"><span><BarChart3 size={19}/></span><div><b>Confidence estimate: {Math.round(latest.analysis.confidence * 100)}%</b><p>Model-reported estimate only; it is not calibrated or clinically validated. {latest.analysis.caveat}</p></div></div><ul className="limitations-list"><li>Sentiment and emotion labels can miss irony, slang and cultural context.</li><li>Behavioral signals describe wording in one post and are not diagnoses.</li><li>Support suggestions are general and do not replace professional care.</li></ul></section></div><section className="panel recent-analysis history-panel"><div className="panel-heading"><div><span className="overline">SAVED IN THIS BROWSER · {analyses.length} OF 50</span><h2>Analysis History</h2></div></div><div className="recent-list">{analyses.map((entry) => { const post = toRecentPost(entry); return <article className="recent-post" key={entry.id}><span className="recent-post-icon"><FileText size={16}/></span><div className="recent-post-copy"><b>{post.text}</b><small>{post.date} · {entry.platform} · {post.sentiment} sentiment · {post.emotion}</small><small>{entry.analysis.explanation}</small></div><span className="analysis-status"><CheckCircle2 size={13}/>Saved</span></article> })}</div><p className="sample-caption">History is stored in this browser under your account and is not synced to Supabase.</p></section></>
}

export function SupportCenterPage() {
  return <><PageHeading eyebrow="WELLNESS RESOURCES" title="Support Center" description="General mental wellness resources for reflection, connection and finding professional support."/><div className="support-resource-grid"><ResourceCard icon={HeartHandshake} title="Finding professional support" text="Consider speaking with a licensed mental health professional if emotional concerns persist or affect daily life." action="Learn about care options"/><ResourceCard icon={MessageCircleHeart} title="Reach out to someone you trust" text="A trusted friend, family member or support person can offer connection while you decide what help feels right." action="Explore ways to connect"/><ResourceCard icon={BookOpen} title="Grounding and self-care" text="Simple routines like rest, movement and grounding exercises may support day-to-day wellbeing." action="Browse self-care ideas"/></div><div className="support-note"><ShieldCheck size={18}/><p><b>If you may be in immediate danger</b>, contact local emergency services or a crisis support line in your area. SENTINEL is not an emergency service.</p></div></>
}

function ResourceCard({ icon: Icon, title, text, action }: { icon: typeof HeartHandshake; title: string; text: string; action: string }) { return <article className="support-card mh-resource"><span className="resource-icon"><Icon size={20}/></span><h2>{title}</h2><p>{text}</p><span className="resource-action">{action} <ArrowRight size={14}/></span></article> }

export function CommunitySupportPage() {
  return <><PageHeading eyebrow="CONNECTION & COMMUNITY" title="Community Support" description="Ideas for finding supportive, respectful spaces and staying connected with people you trust."/><section className="community-hero"><span className="community-icon"><UsersRound size={24}/></span><div><span className="overline">SUPPORTIVE CONNECTION</span><h2>Find spaces where you feel heard.</h2><p>Peer communities can help people feel less alone. Choose moderated spaces with clear safety and privacy guidelines.</p></div></section><div className="support-resource-grid community-grid"><ResourceCard icon={UsersRound} title="Peer-led groups" text="Look for community groups hosted by established mental wellness organizations or local providers." action="Consider a moderated group"/><ResourceCard icon={LockKeyhole} title="Protect your boundaries" text="Share only what feels comfortable, review privacy settings, and step away from conversations that do not feel supportive." action="Keep control of what you share"/><ResourceCard icon={HeartHandshake} title="Professional support" text="Community can complement care, while a qualified professional can help with individual concerns." action="Explore professional care"/></div></>
}

export function PrivacyDataPage() {
  return <><PageHeading eyebrow="PRIVACY & CONTROL" title="Privacy & Data" description="Understand how post content and analysis are handled in your SENTINEL workspace."/><div className="privacy-status"><span><LockKeyhole size={20}/></span><div><b>Text analysis sends content to Gemini</b><p>When you submit text for analysis, it is sent to Google Gemini through the authenticated server endpoint. Images are not processed in this phase.</p></div></div><section className="panel privacy-data-panel"><div className="panel-heading"><div><span className="overline">ANALYSIS & STORAGE</span><h2>Your choices and data</h2></div></div><div className="privacy-facts"><div><b>Submitted content</b><span>Text is sent to Gemini only after you confirm on Analyze Post. Selected images stay in the form and are not sent.</span></div><div><b>Analysis results</b><span>Successful results and submitted text are saved locally in this browser, with up to 50 results per account. They are not synced to Supabase.</span></div><div><b>Data deletion</b><span>Clear this browser’s site storage to remove local analysis history. An in-app deletion control is not available yet.</span></div></div></section><div className="info-strip"><ShieldCheck size={18}/><span>Each post is analyzed independently. Results describe wording and are not a diagnosis or a reliable measure of anyone’s mental health.</span></div></>
}

export function AccountSettingsPage() {
  const { user, logout } = useSentinelAuth()
  const navigate = useNavigate()
  const [authError, setAuthError] = useState('')
  return <><PageHeading eyebrow="ACCOUNT & PREFERENCES" title="Settings" description="Manage your SENTINEL account and review workspace information."/><section className="panel account-settings-panel"><div className="panel-heading"><div><span className="overline">YOUR ACCOUNT</span><h2>Sign-in details</h2></div><UserRound size={19}/></div><div className="account-setting-row"><span>Name</span><b>{user?.name || 'Not available'}</b></div><div className="account-setting-row"><span>Email address</span><b>{user?.email || 'Not available'}</b></div><div className="account-setting-row"><span>Workspace</span><b>Mental Health Intelligence</b></div><div className="settings-actions"><Link className="button button-outline" to="/dashboard/privacy">Privacy & Data <ArrowRight size={14}/></Link><button className="button button-primary" type="button" onClick={async () => { const result = await logout(); if (result.error) setAuthError(result.error); else navigate('/login', { replace: true }) }}>Sign out</button></div>{authError && <p role="alert" className="auth-error">{authError}</p>}</section><section className="panel settings-note"><span><ShieldCheck size={18}/></span><p>Profile editing and account deletion are not available in the current account setup.</p></section></>
}
