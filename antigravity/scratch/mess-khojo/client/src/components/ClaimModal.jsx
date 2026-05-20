import React, { useState } from 'react';
import { X, Phone, ShieldCheck, AlertCircle } from 'lucide-react';

const ClaimModal = ({ messName, onSubmit, onClose, loading }) => {
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        const clean = phone.replace(/\D/g, '');
        if (clean.length < 10) {
            setError('Please enter a valid 10-digit phone number.');
            return;
        }
        setError('');
        onSubmit(phone);
    };

    // Close on Escape key
    React.useEffect(() => {
        const onKey = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-[slideDown_0.25s_ease-out]">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
                    aria-label="Close"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center mb-5">
                    <div className="w-14 h-14 bg-purple-50 rounded-full flex items-center justify-center mb-3">
                        <ShieldCheck size={28} className="text-brand-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-brand-text-dark">Claim Listing</h2>
                    <p className="text-sm text-brand-text-gray mt-1">
                        Claim <strong>{messName}</strong> as your property. Provide your contact number for verification.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-brand-text-dark mb-1.5">
                            Mobile Number
                        </label>
                        <div className="relative">
                            <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => { setPhone(e.target.value); setError(''); }}
                                placeholder="+91 98765 43210"
                                className="w-full pl-9 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all text-sm"
                                autoFocus
                            />
                        </div>
                        {error && (
                            <p className="flex items-center gap-1.5 text-xs text-red-600 mt-1.5 font-medium">
                                <AlertCircle size={12} /> {error}
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !phone}
                        className="w-full py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary-hover transition-colors shadow-lg shadow-brand-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Submitting...' : 'Submit Claim Request'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ClaimModal;
