import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Footer from './components/Footer';
import { AuthProvider } from './context/AuthContext';
import { DistrictProvider } from './context/DistrictContext';
import { ToastProvider } from './context/ToastContext';
import { trackPageView } from './analytics';
import DistrictSelector from './components/DistrictSelector';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';

import { WishlistProvider } from './context/WishlistContext';

// Disable browser's automatic scroll restoration globally at load time
if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

// Prevent mouse wheel from inadvertently changing values on number/numeric inputs globally
if (typeof window !== 'undefined') {
  window.addEventListener('wheel', () => {
    if (document.activeElement && (document.activeElement.type === 'number' || document.activeElement.getAttribute('inputmode') === 'numeric')) {
      document.activeElement.blur();
    }
  }, { passive: true });
}

const CityLandingPage = React.lazy(() => import('./pages/CityLandingPage'));

// Route-level code splitting — only the visited page's code is downloaded
const CityPage = React.lazy(() => import('./pages/CityPage'));
const CityExplorerPage = React.lazy(() => import('./pages/CityExplorerPage'));
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
const FindYourRoomResults = React.lazy(() => import('./pages/FindYourRoomResults'));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy'));
const TermsAndConditions = React.lazy(() => import('./pages/TermsAndConditions'));
const AboutUs = React.lazy(() => import('./pages/AboutUs'));
const TeamPage = React.lazy(() => import('./pages/TeamPage'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const Wishlist = React.lazy(() => import('./pages/Wishlist'));
const Sitemap = React.lazy(() => import('./pages/Sitemap'));

// Branded loading fallback for route transitions
const RouteLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #e5e7eb', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  </div>
);

// Scroll to top on every route change (except pages that handle their own scroll restore)
function ScrollToTop() {
  const location = useLocation();
  useEffect(() => {
    // Disable browser's built-in scroll restoration — we handle it manually
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    // These pages save/restore their own scroll position:
    //   '/'          → CityLandingPage
    //   '/district/' → CityPage (canonical route)
    //   '/city/'     → CityPage (legacy route)
    if (
      location.pathname === '/' ||
      location.pathname.startsWith('/district/') ||
      location.pathname.startsWith('/city/')
    ) return;
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

function AppContent() {
  const location = useLocation();
  const isRoomDetails = location.pathname.startsWith('/room/');
  const isMessRegistration = location.pathname === '/register-mess';
  const hideFooter = isRoomDetails || isMessRegistration;

  return (
    <div className="min-h-screen bg-brand-secondary text-brand-text-dark font-sans flex flex-col">
      <DistrictSelector />
      <ErrorBoundary>
        <Suspense fallback={<RouteLoader />}>
          <div className="flex-grow flex flex-col">
            <Routes>
              <Route path="/" element={<CityLandingPage />} />
              <Route path="/explorer" element={<Navigate to="/" replace />} />

              {/* Canonical SEO-friendly city explorer URLs */}
              <Route path="/district/:districtId/city/:cityId/explorer" element={<CityExplorerPage />} />
              {/* Legacy city explorer alias */}
              <Route path="/city/:cityId/explorer" element={<CityExplorerPage />} />

              {/* Canonical SEO-friendly city URLs */}
              <Route path="/district/:districtId/city/:cityId" element={<CityPage />} />
              {/* Legacy city alias — keeps old links alive */}
              <Route path="/city/:cityId" element={<CityPage />} />

              {/* Canonical SEO-friendly mess URLs (slug contains mess name) */}
              <Route path="/mess/:messSlug" element={<MessDetails />} />

              {/* Canonical SEO-friendly room URLs */}
              <Route path="/room/:messSlug/:roomSlug" element={<RoomDetails />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute requiredRole="admin" redirectTo="/admin/login">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Operational Interface (Single Operator) */}
              <Route path="/operational/login" element={<OperationalLogin />} />
              <Route
                path="/operational/dashboard"
                element={
                  <ProtectedRoute requiredRole="any" redirectTo="/">
                    <OperationalDashboard />
                  </ProtectedRoute>
                }
              />

              {/* User Routes */}
              <Route path="/user-signup" element={<UserSignup />} />
              <Route path="/user-login" element={<UserLogin />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/booking-success" element={<BookingSuccess />} />
              <Route path="/register-mess" element={<MessRegistration />} />
              <Route path="/find-your-room/results" element={<FindYourRoomResults />} />
              <Route path="/find-your-room" element={<BookRoomComingSoon />} />

              {/* Legal Pages & Company Info */}
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
              <Route path="/about-us" element={<AboutUs />} />
              <Route path="/team" element={<TeamPage />} />
              <Route path="/our-team" element={<TeamPage />} />
              <Route path="/sitemap" element={<Sitemap />} />

              {/* 404 Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            {!hideFooter && <Footer />}
          </div>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <DistrictProvider>
        <ToastProvider>
          <WishlistProvider>
            <Router>
              <ScrollToTop />
              <AnalyticsTracker />
              <AppContent />
            </Router>
          </WishlistProvider>
        </ToastProvider>
      </DistrictProvider>
    </AuthProvider>
  );
}

export default App;
