import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Inline spinner — no extra CSS dependency
const AuthLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
    <div style={{
      width: 36, height: 36,
      border: '3px solid #e5e7eb',
      borderTopColor: '#7c3aed',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

/**
 * @param {object}  props
 * @param {React.ReactNode} props.children   — The protected page component
 * @param {'admin'|'operator'|'any'}  props.requiredRole
 *   'admin'    → userRole must be 'admin' or 'operator'
 *   'operator' → userRole must be 'operator'
 *   'any'      → any authenticated user (just needs to be logged in)
 * @param {string}  props.redirectTo  — Where to send unauthenticated users (default: '/admin/login')
 */
function ProtectedRoute({ children, requiredRole = 'any', redirectTo = '/admin/login' }) {
  const { currentUser, userRole, loading } = useAuth();

  // Auth state not yet resolved — show spinner instead of dashboard flash
  if (loading) return <AuthLoader />;

  // Not logged in at all
  if (!currentUser) return <Navigate to={redirectTo} replace />;

  // Role-based guard for admin dashboard
  if (requiredRole === 'admin') {
    if (userRole !== 'admin' && userRole !== 'operator') {
      return <Navigate to="/?error=access_denied" replace />;
    }
  }

  return children;
}

export default ProtectedRoute;
