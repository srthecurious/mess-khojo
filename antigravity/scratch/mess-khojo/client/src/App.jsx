import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import MessDetails from './pages/MessDetails';
import RoomDetails from './pages/RoomDetails';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import { AuthProvider } from './context/AuthContext';
import UserSignup from './pages/UserSignup';
import UserLogin from './pages/UserLogin';
import UserProfile from './pages/UserProfile';
import OperationalLogin from './pages/OperationalLogin';
import OperationalDashboard from './pages/OperationalDashboard';
import BookingSuccess from './pages/BookingSuccess';


function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-brand-secondary text-brand-text-dark font-sans flex flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
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
            <Route path="/booking-success" element={<BookingSuccess />} />
          </Routes>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
