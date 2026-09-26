import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import { SentinelAuthProvider } from './sentinel/SentinelAuth'
import './sentinel/sentinel.css'
import './sentinel/features.css'
import './sentinel/auth.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode><BrowserRouter><SentinelAuthProvider><App /></SentinelAuthProvider></BrowserRouter></StrictMode>,
)
