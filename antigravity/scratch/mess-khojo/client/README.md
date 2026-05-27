# MessKhojo - Smart Mess & Accommodation Management

**MessKhojo** is a modern, high-performance web application designed to simplify life for students and accommodation seekers. It provides a seamless interface to explore, manage, and interact with local mess (canteen) services and student housing.

---

## 🚀 Key Features

- **🏠 Mess Explorer**: Interactive maps and gallery-style listings to find the best dining options.
- **📱 Responsive Design**: A mobile-first approach ensuring a premium experience on all devices.
- **🔑 Secure Authentication**: Full multi-provider authentication (Google & Email/Password) powered by Firebase.
- **🛠️ Admin & Partner Dashboards**: Comprehensive tools for operators to manage listings, leads, and analytics.
- **✨ Premium UI/UX**: Glassmorphism aesthetics, smooth scroll animations (Framer Motion), and branded skeleton loaders.
- **🤖 Telegram Integration**: Instant lead notifications for operators via a custom-built Telegram bot notifier.
- **🗺️ Map Integration**: Real-time location tracking for messes using the Google Maps API.
- **🔍 SEO Optimized**: Dynamic metadata, semantic HTML, and custom Netlify-driven sitemaps.

---

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Custom CSS Variables](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- **Backend / DB**: [Firebase Firestore](https://firebase.google.com/docs/firestore) & [Cloud Storage](https://firebase.google.com/docs/storage)
- **Authentication**: [Firebase Auth](https://firebase.google.com/docs/auth)
- **Analytics**: [Google Analytics 4](https://analytics.google.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Deployment**: [Netlify](https://www.netlify.com/)

---

## 🛠️ Local Development Setup

### 1. Prerequisites
- Node.js (v18+)
- npm or yarn

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/srthecurious/mess-khojo.git

# Navigate to the client directory
cd client

# Install dependencies
npm install
```

### 3. Environment Variables
Create a `.env` file in the `client/` directory and populate it with your Firebase and API credentials (see `.env.example`).

### 4. Run Development Server
```bash
npm run dev
```

---

## 🏗️ Building for Production

To generate a production-ready build:

```bash
npm run build
```

The output will be in the `dist/` directory, ready to be deployed to Netlify or any static hosting service.

---

## 🧪 Testing

```bash
# Run unit tests (watch mode)
npm run test

# Run unit tests once (CI mode)
npm run test:run

# Run E2E tests (requires dev server running)
npx playwright test
```

---

## 📊 Bundle Analysis

To inspect the production bundle and identify large dependencies:

```bash
npm run analyze
```

This opens `dist/stats.html` — an interactive treemap of every chunk, with gzip and brotli sizes.

---

## 🚨 Error Monitoring (Sentry)

Set `VITE_SENTRY_DSN` in your `.env` to activate Sentry error tracking.  
The app is a no-op without it (safe for local dev).

For source map uploads (Sentry release tracking), set these environment variables in your CI/CD secrets:

| Secret | Description |
|--------|-------------|
| `SENTRY_AUTH_TOKEN` | Sentry internal integration token |
| `SENTRY_ORG` | Your Sentry organisation slug |
| `SENTRY_PROJECT` | Your Sentry project slug |

---

## 🤖 CI/CD (GitHub Actions)

### CI Pipeline (`.github/workflows/ci.yml`)
Runs on every push and pull request to `main`/`develop`:
- ✅ ESLint
- ✅ Vitest unit tests
- ✅ Vite production build

### Deploy Pipeline (`.github/workflows/deploy.yml`)
Runs on every push to `main`:
- Builds with real production secrets
- Deploys to Firebase Hosting
- Deploys updated Firestore Security Rules

**Required GitHub Secrets** (Settings → Secrets → Actions):

| Secret | Description |
|--------|-------------|
| `VITE_FIREBASE_API_KEY` | Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase measurement ID (optional) |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps JavaScript API key |
| `VITE_GA4_MEASUREMENT_ID` | Google Analytics 4 measurement ID |
| `VITE_SENTRY_DSN` | Sentry DSN URL |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase service account JSON (for deployment) |
| `SENTRY_AUTH_TOKEN` | Sentry auth token (for source map upload) |
| `SENTRY_ORG` | Sentry organisation slug |
| `SENTRY_PROJECT` | Sentry project slug |

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👥 Contributors

- **S.R.** ([@srthecurious](https://github.com/srthecurious)) - Lead Developer & Architect
