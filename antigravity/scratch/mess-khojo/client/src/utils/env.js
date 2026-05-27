/**
 * env.js — Runtime environment variable validator
 *
 * Checks all required VITE_* variables are present at app startup.
 * Throws a clear descriptive error in dev; silently logs in prod to
 * avoid leaking config details to end users.
 */

const REQUIRED_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_GOOGLE_MAPS_API_KEY',
];

const OPTIONAL_VARS = [
  'VITE_FIREBASE_MEASUREMENT_ID',
  'VITE_GA4_MEASUREMENT_ID',
  'VITE_SENTRY_DSN',
  'VITE_APP_VERSION',
  'VITE_APP_ENV',
];

/**
 * Validates that all required environment variables are present.
 * Call once at app startup (before rendering).
 */
export function validateEnv() {
  const missing = REQUIRED_VARS.filter(
    (key) => !import.meta.env[key]
  );

  if (missing.length > 0) {
    const message = [
      '⚠️  MessKhojo — Missing required environment variables:',
      ...missing.map((k) => `  • ${k}`),
      '',
      'Copy .env.example to .env and fill in the values.',
    ].join('\n');

    if (import.meta.env.DEV) {
      // Throw hard in development so the developer notices immediately
      throw new Error(message);
    } else {
      // In production, log a warning — don't crash the page for users
      console.warn(message);
    }
  }

  // Warn about optional vars that are missing (informational only)
  const missingOptional = OPTIONAL_VARS.filter(
    (key) => !import.meta.env[key]
  );
  if (missingOptional.length > 0 && import.meta.env.DEV) {
    console.info(
      '💡 MessKhojo — Optional env vars not set (non-critical):',
      missingOptional.join(', ')
    );
  }
}

/**
 * Returns the current app environment.
 * Defaults to 'development' if VITE_APP_ENV is not set.
 */
export const appEnv = import.meta.env.VITE_APP_ENV ?? 'development';

/**
 * Returns the current app version for release tracking (e.g. Sentry).
 * Defaults to 'local' if VITE_APP_VERSION is not set.
 */
export const appVersion = import.meta.env.VITE_APP_VERSION ?? 'local';
