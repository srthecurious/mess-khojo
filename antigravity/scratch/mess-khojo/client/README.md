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

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👥 Contributors

- **S.R.** ([@srthecurious](https://github.com/srthecurious)) - Lead Developer & Architect
