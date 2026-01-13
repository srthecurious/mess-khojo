import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Phone, X } from 'lucide-react';

const PhoneCollectionModal = ({ user, onClose, onSkip }) => {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Basic phone validation
        if (phone.length < 10) {
            setError('Please enter a valid 10-digit phone number');
            setLoading(false);
            return;
        }

        try {
            // Update user document in Firestore
            const userDocRef = doc(db, "users", user.uid);
            await updateDoc(userDocRef, {
                phone: phone
            });

            onClose(phone); // Close modal and pass phone number
        } catch (err) {
            console.error("Error updating phone:", err);
            setError('Failed to save phone number. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
                {/* Close Button */}
                <button
                    onClick={onSkip}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                    <div className="mx-auto w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Phone size={28} className="text-brand-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-brand-text-dark mb-2">
                        One More Step!
                    </h2>
                    <p className="text-brand-text-gray text-sm">
                        We need your phone number to confirm bookings and send important updates.
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm text-center">
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-brand-text-dark mb-2">
                            Phone Number
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Phone size={18} className="text-gray-400" />
                            </div>
                            <input
                                type="tel"
                                required
                                className="w-full pl-10 pr-4 py-3 border border-brand-light-gray rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
                                placeholder="+91 98765 43210"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                maxLength="13"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            This helps us send booking confirmations via SMS
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-3 rounded-lg transition-colors shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Saving...' : 'Continue'}
                    </button>
                </form>

                {/* Skip Option */}
                <button
                    onClick={onSkip}
                    className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
                >
                    Skip for now
                </button>
            </div>
        </div>
    );
};

export default PhoneCollectionModal;
