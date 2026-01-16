import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Server } from 'lucide-react';

const OperationalLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const ALLOWED_OPERATOR_EMAIL = import.meta.env.VITE_OP_EMAIL;

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (!ALLOWED_OPERATOR_EMAIL) {
            setError("Configuration Error: No Operator Email set in environment.");
            return;
        }

        if (email !== ALLOWED_OPERATOR_EMAIL) {
            setError("Access Denied: You are not authorized to access this interface.");
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/operational/dashboard');
        } catch (err) {
            console.error("Login Error:", err);
            setError("Invalid credentials or server error.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
            <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700">
                <div className="text-center mb-8">
                    <div className="bg-emerald-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500">
                        <Server size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Operational Access</h2>
                    <p className="text-slate-400">Restricted to Authorized Operators Only</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg mb-4 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Operator Email</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition-colors shadow-lg shadow-emerald-900/20"
                    >
                        Authenticate
                    </button>

                </form>

                <div className="mt-6 text-center">
                    <a href="/" className="text-xs text-slate-500 hover:text-slate-400 transition-colors">
                        ← Exit to Public Site
                    </a>
                </div>
            </div>
        </div>
    );
};

export default OperationalLogin;
