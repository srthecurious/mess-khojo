import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import ProtectedRoute from './ProtectedRoute';

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../context/AuthContext';

const Protected = () => <div>Protected Content</div>;
const Login = () => <div>Login Page</div>;

function renderWithRouter(authState) {
  useAuth.mockReturnValue(authState);
  return render(
    <MemoryRouter initialEntries={['/admin/dashboard']}>
      <Routes>
        <Route path="/admin/login" element={<Login />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRole="admin" redirectTo="/admin/login">
              <Protected />
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  it('shows spinner while auth is loading', () => {
    renderWithRouter({ loading: true, currentUser: null, userRole: null });
    // No login page, no protected content — just the spinner
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects to login when user is not authenticated', () => {
    renderWithRouter({ loading: false, currentUser: null, userRole: null });
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('redirects when user has wrong role', () => {
    renderWithRouter({ loading: false, currentUser: { uid: '123' }, userRole: 'user' });
    // Should not see protected content
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when user has admin role', () => {
    renderWithRouter({ loading: false, currentUser: { uid: '123' }, userRole: 'admin' });
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('renders children when user has operator role', () => {
    renderWithRouter({ loading: false, currentUser: { uid: '456' }, userRole: 'operator' });
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
