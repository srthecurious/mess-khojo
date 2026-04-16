import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Footer from './components/Footer';
import { AuthProvider } from './context/AuthContext';
import { trackPageView } from './analytics';

// Route-level code splitting — only the visited page's code is downloaded
const Home = React.lazy(() => import('./pages/Home'));
const MessDetails = React.lazy(() => import('./pages/MessDetails'));
const RoomDetails = React.lazy(() => import('./pages/RoomDetails'));
const AdminLogin = React.lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const UserSignup = React.lazy(() => import('./pages/UserSignup'));
const UserLogin = React.lazy(() => import('./pages/UserLogin'));
const UserProfile = React.lazy(() => import('./pages/UserProfile'));
const OperationalLogin = React.lazy(() => import('./pages/OperationalLogin'));
const OperationalDashboard = React.lazy(() => import('./pages/OperationalDashboard'));
const BookingSuccess = React.lazy(() => import('./pages/BookingSuccess'));
const MessRegistration = React.lazy(() => import('./pages/MessRegistration'));
const BookRoomComingSoon = React.lazy(() => import('./pages/BookRoomComingSoon'));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy'));
const TermsAndConditions = React.lazy(() => import('./pages/TermsAndConditions'));
const AboutUs = React.lazy(() => import('./pages/AboutUs'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const Wishlist = React.lazy(() => import('./pages/Wishlist'));

// Branded loading fallback for route transitions
const RouteLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #e5e7eb', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  </div>
);

// Scroll to top on every route change
function ScrollToTop() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);
  return null;
}

// Analytics wrapper component to track route changes
function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    // Track page view on route change
    trackPageView(location.pathname + location.search, document.title);
  }, [location]);

  return null;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <AnalyticsTracker />
        <div className="min-h-screen bg-brand-secondary text-brand-text-dark font-sans flex flex-col">
          <Suspense fallback={<RouteLoader />}>
            <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/explorer" element={<Home />} />
            <Route path="/mess/:id" element={<MessDetails />} />
            <Route path="/room/:messId/:roomId" element={<RoomDetails />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />



            {/* Operational Interface (Single Operator) */}
            {/* Operational Interface (Single Operator) */}
            <Route path="/operational/login" element={<OperationalLogin />} />
            <Route path="/operational/dashboard" element={<OperationalDashboard />} />

            {/* User Routes */}
            <Route path="/user-signup" element={<UserSignup />} />
            <Route path="/user-login" element={<UserLogin />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/booking-success" element={<BookingSuccess />} />
            <Route path="/register-mess" element={<MessRegistration />} />
            <Route path="/find-your-room" element={<BookRoomComingSoon />} />

            {/* Legal Pages */}
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
            <Route path="/about-us" element={<AboutUs />} />

            {/* 404 Catch-all */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
