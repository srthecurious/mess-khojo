import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '../firebase';
import { setDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { User, Mail, Lock, Phone, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import PhoneCollectionModal from '../components/PhoneCollectionModal';
import { trackSignupAttempt } from '../analytics';

const UserSignup = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirectUrl = searchParams.get('redirect') || '/profile';

    console.log('🔗 UserSignup redirectUrl:', redirectUrl);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

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
                // New user - create document with Google profile data
                await setDoc(userDocRef, {
                    uid: user.uid,
                    name: user.displayName || 'User',
                    email: user.email,
                    phone: user.phoneNumber || '',
                    role: 'user',
                    createdAt: serverTimestamp()
                });
                needsPhone = !user.phoneNumber;
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

            // Track successful signup
            trackSignupAttempt(true);
        } catch (err) {
            console.error("Google Sign-In Error:", err);
            let msg = "Failed to sign in with Google.";
            if (err.code === 'auth/popup-closed-by-user') msg = "Sign-in cancelled.";
            if (err.code === 'auth/popup-blocked') msg = "Popup blocked. Please allow popups.";
            setError(msg);

            // Track failed signup
            trackSignupAttempt(false);
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // 1. Create Auth User
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            // 2. Create User Document in Firestore
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                role: 'user',
                createdAt: serverTimestamp()
            });

            // 3. Navigate to redirect URL or Profile
            console.log('✅ Signup successful! Redirecting to:', redirectUrl);
            navigate(redirectUrl);

            // Track successful signup
            trackSignupAttempt(true);

        } catch (err) {
            console.error("Signup Error:", err);
            let msg = "Failed to sign up.";
            if (err.code === 'auth/email-already-in-use') msg = "Email is already in use.";
            if (err.code === 'auth/weak-password') msg = "Password should be at least 6 characters.";
            setError(msg);

            // Track failed signup
            trackSignupAttempt(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-brand-secondary px-4 py-12">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md relative overflow-hidden">
                <button
                    onClick={() => navigate('/')}
                    className="absolute top-4 left-4 flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-brand-primary transition-colors uppercase tracking-wider group"
                >
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Home
                </button>

                <div className="text-center mb-8 mt-4">
                    <h2 className="text-3xl font-bold text-brand-text-dark mb-2">Create Account</h2>
                    <p className="text-brand-text-gray">Join MessKhojo to book your stay</p>
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
                    {loading ? 'Signing up...' : 'Sign up with Google'}
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

                <form onSubmit={handleSignup} className="space-y-5">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-brand-text-dark mb-1">Full Name</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User size={18} className="text-gray-400" />
                            </div>
                            <input
                                name="name"
                                type="text"
                                required
                                className="w-full pl-10 pr-4 py-2 border border-brand-light-gray rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium text-brand-text-dark mb-1">Phone Number</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Phone size={18} className="text-gray-400" />
                            </div>
                            <input
                                name="phone"
                                type="tel"
                                required
                                className="w-full pl-10 pr-4 py-2 border border-brand-light-gray rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
                                placeholder="+91 98765 43210"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-brand-text-dark mb-1">Email Address</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail size={18} className="text-gray-400" />
                            </div>
                            <input
                                name="email"
                                type="email"
                                required
                                className="w-full pl-10 pr-4 py-2 border border-brand-light-gray rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
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
                                name="password"
                                type={showPassword ? "text" : "password"}
                                required
                                className="w-full pl-10 pr-12 py-2 border border-brand-light-gray rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="text-xs text-gray-500 text-center px-4 mb-4 leading-relaxed">
                        By creating an account, you agree to our <a href="/terms-and-conditions" target="_blank" className="text-brand-primary hover:underline">Terms of Service</a> and <a href="/privacy-policy" target="_blank" className="text-brand-primary hover:underline">Privacy Policy</a>.
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-3 rounded-lg transition-colors shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link to="/user-login" className="text-brand-primary font-semibold hover:underline">
                        Log in
                    </Link>
                </div>

                {/* Phone Collection Modal */}
                {showPhoneModal && currentUser && (
                    <PhoneCollectionModal
                        user={currentUser}
                        onClose={() => {
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

export default UserSignup;
