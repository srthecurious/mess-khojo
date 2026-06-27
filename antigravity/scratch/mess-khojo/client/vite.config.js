import { defineConfig } from 'vite'
// Trigger deployment
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isAnalyze = process.env.ANALYZE === 'true';
  const isProd = mode === 'production';

  return {
    plugins: [
      react(),

      // ── Sentry Source Maps ─────────────────────────────────────────────
      // Only uploads source maps when building for production AND a Sentry
      // auth token is present. No-op in local dev / CI lint+test runs.
      isProd && process.env.SENTRY_AUTH_TOKEN && sentryVitePlugin({
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        authToken: process.env.SENTRY_AUTH_TOKEN,
        release: {
          name: process.env.VITE_APP_VERSION ?? 'local',
        },
        // Automatically delete local source maps after upload
        sourcemaps: {
          filesToDeleteAfterUpload: ['dist/**/*.map'],
        },
      }),

      // ── Bundle Visualizer ──────────────────────────────────────────────
      // Run: ANALYZE=true npm run build
      // Opens dist/stats.html with an interactive treemap of all chunks.
      isAnalyze && visualizer({
        open: true,
        filename: 'dist/stats.html',
        gzipSize: true,
        brotliSize: true,
        template: 'treemap',
      }),
    ].filter(Boolean),

    // ── Build ────────────────────────────────────────────────────────────
    build: {
      // Emit source maps in production for Sentry (deleted post-upload)
      sourcemap: isProd,
      rollupOptions: {
        output: {
          // Split large vendor bundles for better caching
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            // firebase v12 uses subpath exports — reference individual modules
            'vendor-firebase': [
              'firebase/app',
              'firebase/auth',
              'firebase/firestore',
              'firebase/storage',
              'firebase/analytics',
            ],
            'vendor-motion': ['framer-motion'],
            'vendor-maps': ['@vis.gl/react-google-maps', '@googlemaps/markerclusterer'],
          },
        },
      },
    },

    // ── Test (Vitest) ────────────────────────────────────────────────────
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.js'],
      include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      exclude: ['**/e2e/**', 'node_modules/**', '**/video/**'],
    },

    // ── CSS ──────────────────────────────────────────────────────────────
    css: {
      postcss: {
        plugins: [
          tailwindcss,
          autoprefixer,
        ],
      },
    },

    // ── Dev Server Headers ────────────────────────────────────────────────
    server: {
      port: 5173,
      headers: {
        'Content-Security-Policy': [
          "default-src 'self' https://*.firebaseio.com https://*.googleapis.com https://apis.google.com https://accounts.google.com https://*.firebaseapp.com",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://*.firebaseio.com https://www.googletagmanager.com https://*.googleapis.com https://apis.google.com https://accounts.google.com https://*.firebaseapp.com https://*.google.com https://*.gstatic.com https://*.clarity.ms https://c.bing.com https://connect.facebook.net",
          "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.google-analytics.com https://*.analytics.google.com https://apis.google.com https://accounts.google.com https://*.firebaseapp.com https://*.cloudfunctions.net https://api.telegram.org https://*.nsvcs.net https://*.sentry.io https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://*.ingest.de.sentry.io https://script.google.com https://script.googleusercontent.com https://*.clarity.ms https://c.bing.com https://www.facebook.com https://fonts.gstatic.com https://fonts.googleapis.com",
          "img-src 'self' data: blob: https://*.googleapis.com https://*.gstatic.com https://*.google.com https://*.firebaseapp.com https://firebasestorage.googleapis.com http://maps.google.com https://*.googleusercontent.com https://*.clarity.ms https://c.bing.com https://www.facebook.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com https://*.google.com https://*.gstatic.com",
          "font-src 'self' https://fonts.gstatic.com",
          "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com https://*.google.com",
          "worker-src 'self' blob:"
        ].join('; ')
      }
    }
  };
})
