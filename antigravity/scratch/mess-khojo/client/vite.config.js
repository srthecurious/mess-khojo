import { defineConfig } from 'vite'
// Trigger deployment
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer,
      ],
    },
  },
  server: {
    headers: {
      'Content-Security-Policy': [
        "default-src 'self' https://*.firebaseio.com https://*.googleapis.com https://apis.google.com https://accounts.google.com https://*.firebaseapp.com",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://*.firebaseio.com https://www.googletagmanager.com https://*.googleapis.com https://apis.google.com https://accounts.google.com https://*.firebaseapp.com https://*.google.com https://*.gstatic.com",
        "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com https://*.cloudfunctions.net wss://*.firebaseio.com https://api.telegram.org https://*.nsvcs.net https://accounts.google.com https://apis.google.com https://www.google-analytics.com https://*.google.com https://*.gstatic.com",
        "img-src 'self' data: blob: https://*.googleapis.com https://*.gstatic.com https://*.google.com https://*.firebaseapp.com https://firebasestorage.googleapis.com http://maps.google.com https://*.googleusercontent.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com https://*.google.com https://*.gstatic.com",
        "font-src 'self' https://fonts.gstatic.com",
        "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com https://*.google.com",
        "worker-src 'self' blob:"
      ].join('; ')
    }
  }
})
