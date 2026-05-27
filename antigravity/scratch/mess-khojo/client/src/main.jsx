import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initializeAnalytics } from './analytics';
import { validateEnv } from './utils/env';
import { initSentry } from './sentry';

// ── Startup validation ────────────────────────────────────────────────────────
// Fail fast if required environment variables are missing.
validateEnv();

// ── Error monitoring ──────────────────────────────────────────────────────────
// No-op if VITE_SENTRY_DSN is not set (safe for local dev without a DSN).
initSentry();

// ── Google Analytics ──────────────────────────────────────────────────────────
initializeAnalytics();

// ── Render ────────────────────────────────────────────────────────────────────
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
