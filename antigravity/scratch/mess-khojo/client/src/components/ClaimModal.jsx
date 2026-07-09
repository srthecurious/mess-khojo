import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { X, Phone, ShieldCheck, AlertCircle, User, Check, ArrowLeft } from 'lucide-react';

const ClaimModal = ({ messName, onSubmit, onClose, loading }) => {
    const [step, setStep] = useState(1);
    const [isOwner, setIsOwner] = useState(true);
    const [claimantName, setClaimantName] = useState('');
    const [phone, setPhone] = useState('');
    const [actionType, setActionType] = useState('change'); // 'change' or 'remove'
    const [feedback, setFeedback] = useState('');
    const [error, setError] = useState('');

    const handleNext = (e) => {
        e.preventDefault();
        if (!claimantName.trim()) {
            setError('Please enter your name.');
            return;
        }
        const clean = phone.replace(/\D/g, '');
        if (clean.length < 10) {
            setError('Please enter a valid 10-digit phone number.');
            return;
        }
        setError('');
        setStep(2);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            isOwner,
            claimantName: claimantName.trim(),
            phone: phone.trim(),
            actionType,
            feedback: feedback.trim()
        });
    };

    // Close on Escape key
    React.useEffect(() => {
        const onKey = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    // Validation for Step 1
    const cleanPhone = phone.replace(/\D/g, '');
    const isStep1Valid = claimantName.trim().length > 0 && cleanPhone.length >= 10;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 animate-[slideDown_0.25s_ease-out] max-h-[90vh] overflow-y-auto">
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
                    <p className="text-xs sm:text-sm text-brand-text-gray mt-1 px-2">
                        Claim <strong>{messName}</strong> and provide details for verification.
                    </p>
                </div>

                {/* Progress Indicators */}
                <div className="flex items-center justify-center gap-2 mb-6">
                    <span className={`h-2 rounded-full transition-all duration-300 ${step === 1 ? 'w-8 bg-brand-primary' : 'w-2 bg-gray-200'}`} />
                    <span className={`h-2 rounded-full transition-all duration-300 ${step === 2 ? 'w-8 bg-brand-primary' : 'w-2 bg-gray-200'}`} />
                </div>

                {step === 1 ? (
                    <form onSubmit={handleNext} className="space-y-5">
                        {/* Owner Confirmation */}
                        <div>
                            <label className="block text-sm font-bold text-brand-text-dark mb-2">
                                Are you the owner of this mess?
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsOwner(true)}
                                    className={`py-3 px-4 rounded-xl font-bold text-sm border-2 transition-all flex items-center justify-center gap-2 ${
                                        isOwner
                                            ? 'border-brand-primary bg-brand-primary/5 text-brand-primary shadow-sm shadow-brand-primary/10'
                                            : 'border-gray-200 text-brand-text-gray hover:border-gray-300'
                                    }`}
                                >
                                    {isOwner && <Check size={16} />}
                                    Yes
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsOwner(false)}
                                    className={`py-3 px-4 rounded-xl font-bold text-sm border-2 transition-all flex items-center justify-center gap-2 ${
                                        !isOwner
                                            ? 'border-brand-primary bg-brand-primary/5 text-brand-primary shadow-sm shadow-brand-primary/10'
                                            : 'border-gray-200 text-brand-text-gray hover:border-gray-300'
                                    }`}
                                >
                                    {!isOwner && <Check size={16} />}
                                    No
                                </button>
                            </div>
                        </div>

                        {/* Name Input */}
                        <div>
                            <label className="block text-sm font-bold text-brand-text-dark mb-1.5">
                                Your Name
                            </label>
                            <div className="relative">
                                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={claimantName}
                                    onChange={(e) => { setClaimantName(e.target.value); setError(''); }}
                                    placeholder="Enter your name"
                                    className="w-full pl-9 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all text-sm"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Mobile Number Input */}
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
                            disabled={!isStep1Valid}
                            className="w-full py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary-hover transition-colors shadow-lg shadow-brand-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Action Requested Selection */}
                        <div>
                            <label className="block text-sm font-bold text-brand-text-dark mb-2">
                                What action would you like to take?
                            </label>
                            <div className="space-y-3">
                                <button
                                    type="button"
                                    onClick={() => setActionType('change')}
                                    className={`w-full py-3 px-4 rounded-xl font-bold text-sm border-2 text-left transition-all flex items-center justify-between ${
                                        actionType === 'change'
                                            ? 'border-brand-primary bg-brand-primary/5 text-brand-primary shadow-sm'
                                            : 'border-gray-200 text-brand-text-gray hover:border-gray-300'
                                    }`}
                                >
                                    <span>Change the details of the mess</span>
                                    {actionType === 'change' && <Check size={16} />}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActionType('remove')}
                                    className={`w-full py-3 px-4 rounded-xl font-bold text-sm border-2 text-left transition-all flex items-center justify-between ${
                                        actionType === 'remove'
                                            ? 'border-brand-primary bg-brand-primary/5 text-brand-primary shadow-sm'
                                            : 'border-gray-200 text-brand-text-gray hover:border-gray-300'
                                    }`}
                                >
                                    <span>Remove the mess from the website</span>
                                    {actionType === 'remove' && <Check size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Optional Feedback */}
                        <div>
                            <label className="block text-sm font-bold text-brand-text-dark mb-1.5">
                                Additional Details / Feedback (Optional)
                            </label>
                            <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="E.g., Which details are incorrect or why you want it removed..."
                                rows={3}
                                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all text-sm resize-none"
                            />
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="flex-1 py-3 border-2 border-gray-200 hover:border-gray-300 font-bold rounded-xl text-brand-text-gray flex items-center justify-center gap-1.5 transition-all text-sm"
                            >
                                <ArrowLeft size={16} />
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-[2] py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary-hover transition-colors shadow-lg shadow-brand-primary/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                {loading ? 'Submitting...' : 'Submit Claim Request'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

ClaimModal.propTypes = {
    messName: PropTypes.string.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    loading: PropTypes.bool
};

export default ClaimModal;
