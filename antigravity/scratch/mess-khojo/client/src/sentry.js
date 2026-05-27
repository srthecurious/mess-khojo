/**
 * sentry.js — Sentry error monitoring initialisation
 *
 * Call initSentry() once at the very start of main.jsx, BEFORE rendering.
 * Sentry is only activated when VITE_SENTRY_DSN is present, so the app
 * works identically in local dev without any Sentry account.
 */

import * as Sentry from '@sentry/react';
import { appEnv, appVersion } from './utils/env';

/**
 * Initialises Sentry with sensible production defaults.
 * Safe to call in any environment — is a no-op if VITE_SENTRY_DSN is absent.
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    if (import.meta.env.DEV) {
      console.info('ℹ️  Sentry not initialised — VITE_SENTRY_DSN is not set.');
    }
    return;
  }

  Sentry.init({
    dsn,
    release: `mess-khojo@${appVersion}`,
    environment: appEnv,

    // Send performance traces for 10% of sessions in production,
    // 100% in dev/staging so you can verify instrumentation quickly.
    tracesSampleRate: appEnv === 'production' ? 0.1 : 1.0,

    // Capture 10% of sessions for replay in production; always in dev.
    replaysSessionSampleRate: appEnv === 'production' ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0, // Always capture replays on error

    integrations: [
      // Automatically instruments React Router for navigation tracing
      Sentry.browserTracingIntegration(),
      // Session replay — records DOM snapshots on error for debugging
      Sentry.replayIntegration({
        // Mask all text and block all media by default for privacy
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Don't send events for known non-actionable errors
    ignoreErrors: [
      // Firebase auth cancellations (user closed popup)
      'auth/popup-closed-by-user',
      'auth/cancelled-popup-request',
      // Network blips
      'NetworkError',
      'Failed to fetch',
      // Browser extension noise
      /^chrome-extension:\/\//,
    ],

    // Strip sensitive query params from breadcrumb URLs
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.category === 'navigation' && breadcrumb.data?.to) {
        breadcrumb.data.to = breadcrumb.data.to.replace(/([?&])(key|token|apiKey)=[^&]*/gi, '$1[REDACTED]');
      }
      return breadcrumb;
    },
  });
}

/**
 * Re-export Sentry so other modules can call Sentry.captureException()
 * or Sentry.setUser() without importing the full package again.
 */
export { Sentry };
