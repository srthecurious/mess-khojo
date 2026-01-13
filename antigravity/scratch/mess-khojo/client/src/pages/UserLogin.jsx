import React, { useState } from 'react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Mail, Lock, ArrowLeft } from 'lucide-react';
import PhoneCollectionModal from '../components/PhoneCollectionModal';

const UserLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirectUrl = searchParams.get('redirect') || '/profile';

    const handleGoogleSignIn = async () => {
        setError('');
        setLoading(true);

        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Check if user document exists, if not create one
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);

            let needsPhone = false;
            if (!userDoc.exists()) {
                // New user - create document
                await setDoc(userDocRef, {
                    uid: user.uid,
                    name: user.displayName || 'User',
                    email: user.email,
                    phone: user.phoneNumber || '',
                    role: 'user',
                    createdAt: serverTimestamp()
                });
                needsPhone = !user.phoneNumber; // Check if Google provided phone
            } else {
                // Existing user - check if phone is missing
                const userData = userDoc.data();
                needsPhone = !userData.phone || userData.phone === '';
            }

            // If phone is missing, show modal; otherwise navigate
            if (needsPhone) {
                setCurrentUser(user);
                setShowPhoneModal(true);
            } else {
                navigate(redirectUrl);
            }
        } catch (err) {
            console.error("Google Sign-In Error:", err);
            let msg = "Failed to sign in with Google.";
            if (err.code === 'auth/popup-closed-by-user') msg = "Sign-in cancelled.";
            if (err.code === 'auth/popup-blocked') msg = "Popup blocked. Please allow popups.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate(redirectUrl);
        } catch (err) {
            console.error("Login Error:", err);
            let msg = "Failed to login.";
            if (err.code === 'auth/invalid-credential') msg = "Invalid email or password.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-brand-secondary px-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md relative overflow-hidden">
                <button
                    onClick={() => navigate('/')}
                    className="absolute top-4 left-4 flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-brand-primary transition-colors uppercase tracking-wider group"
                >
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Home
                </button>

                <div className="text-center mb-8 mt-4">
                    <h2 className="text-3xl font-bold text-brand-text-dark mb-2">Welcome Back</h2>
                    <p className="text-brand-text-gray">Login to access your bookings</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm text-center">
                        {error}
                    </div>
                )}

                {/* Google Sign-In Button */}
                <button
                    onClick={handleGoogleSignIn}
                    type="button"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-lg border-2 border-gray-200 transition-all shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    {loading ? 'Signing in...' : 'Continue with Google'}
                </button>

                {/* Divider */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white text-gray-500 font-medium">OR</span>
                    </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-brand-text-dark mb-1">Email Address</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail size={18} className="text-gray-400" />
                            </div>
                            <input
                                type="email"
                                required
                                className="w-full pl-10 pr-4 py-2 border border-brand-light-gray rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-brand-text-dark mb-1">Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock size={18} className="text-gray-400" />
                            </div>
                            <input
                                type="password"
                                required
                                className="w-full pl-10 pr-4 py-2 border border-brand-light-gray rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-3 rounded-lg transition-colors shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Logging In...' : 'Log In'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-600">
                    Don't have an account?{' '}
                    <Link
                        to={redirectUrl !== '/profile' ? `/user-signup?redirect=${encodeURIComponent(redirectUrl)}` : '/user-signup'}
                        className="text-brand-primary font-semibold hover:underline"
                    >
                        Sign up
                    </Link>
                </div>

                {/* Phone Collection Modal */}
                {showPhoneModal && currentUser && (
                    <PhoneCollectionModal
                        user={currentUser}
                        onClose={(phone) => {
                            setShowPhoneModal(false);
                            navigate(redirectUrl);
                        }}
                        onSkip={() => {
                            setShowPhoneModal(false);
                            navigate(redirectUrl);
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default UserLogin;
