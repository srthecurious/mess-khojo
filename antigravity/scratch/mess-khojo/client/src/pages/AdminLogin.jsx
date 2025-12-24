import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/admin/dashboard');
        } catch (err) {
            console.error("Login Error:", err);
            let errorMessage = "Failed to login";
            if (err.code === 'auth/invalid-credential') {
                errorMessage = "Invalid email or password.";
            } else if (err.code === 'auth/user-not-found') {
                errorMessage = "No user found with this email.";
            } else if (err.code === 'auth/wrong-password') {
                errorMessage = "Incorrect password.";
            } else {
                errorMessage = err.message; // Show detailed error for debugging
            }
            setError(errorMessage);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-brand-secondary px-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="bg-brand-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="text-brand-primary" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-brand-text-dark">Partner Login</h2>
                    <p className="text-brand-text-gray">Sign in to manage your mess</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-brand-text-dark mb-1">Email Address</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-2 border border-brand-light-gray rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-brand-text-dark mb-1">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-2 border border-brand-light-gray rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold py-3 rounded-lg transition-colors shadow-md hover:shadow-lg"
                    >
                        Sign In
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <a href="/" className="text-sm text-brand-primary hover:text-brand-primary-hover font-medium transition-colors">
                        ← Back to Home
                    </a>
                    <p className="text-xs text-gray-400 mt-4">
                        Project ID: {auth.app.options.projectId}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
