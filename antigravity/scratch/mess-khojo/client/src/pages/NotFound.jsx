import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, ArrowLeft } from 'lucide-react';
import { usePageSEO } from '../hooks/usePageSEO';

function NotFound() {
    usePageSEO({
        title: 'Page Not Found | MessKhojo',
        description: 'The page you are looking for does not exist. Find affordable mess, PG, and hostel in Balasore.',
        noindex: true
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-brand-primary/10 via-brand-secondary to-brand-primary/5 flex items-center justify-center px-4">
            <div className="max-w-lg w-full text-center">
                {/* 404 Illustration */}
                <div className="mb-8">
                    <h1 className="text-9xl font-bold text-brand-primary opacity-20">404</h1>
                    <div className="relative -mt-16">
                        <div className="w-32 h-32 mx-auto bg-brand-primary/10 rounded-full flex items-center justify-center">
                            <Search className="w-16 h-16 text-brand-primary" />
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                <h2 className="text-2xl md:text-3xl font-bold text-brand-text-dark mb-4">
                    Oops! Page Not Found
                </h2>
                <p className="text-brand-text-dark/70 mb-8 leading-relaxed">
                    The page you're looking for seems to have moved or doesn't exist.
                    Don't worry, let's help you find your perfect stay!
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        to="/"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-full font-medium hover:bg-brand-primary/90 transition-all shadow-lg hover:shadow-xl"
                    >
                        <Home className="w-5 h-5" />
                        Go to Homepage
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-brand-primary text-brand-primary rounded-full font-medium hover:bg-brand-primary/10 transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Go Back
                    </button>
                </div>

                {/* Helpful Links */}
                <div className="mt-12 pt-8 border-t border-brand-primary/10">
                    <p className="text-sm text-brand-text-dark/50 mb-4">Looking for something specific?</p>
                    <div className="flex flex-wrap justify-center gap-4 text-sm">
                        <Link to="/" className="text-brand-primary hover:underline">Browse Messes</Link>
                        <span className="text-brand-text-dark/30">•</span>
                        <Link to="/register-mess" className="text-brand-primary hover:underline">Register Your Mess</Link>
                        <span className="text-brand-text-dark/30">•</span>
                        <Link to="/user-login" className="text-brand-primary hover:underline">Login</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default NotFound;
