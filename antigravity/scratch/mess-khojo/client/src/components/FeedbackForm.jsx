import React, { useState } from 'react';
import { MessageSquare, Send, Mail, User, Star } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const FeedbackForm = () => {
    const { currentUser } = useAuth();
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!message.trim()) {
            alert('Please enter your feedback message.');
            return;
        }

        if (rating === 0) {
            alert('Please provide a star rating.');
            return;
        }

        // Validate email format for anonymous users if provided
        if (!currentUser && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            alert('Please enter a valid email address.');
            return;
        }

        setLoading(true);

        try {
            const feedbackData = {
                userId: currentUser?.uid || null,
                userName: currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Anonymous',
                userEmail: currentUser?.email || email || null,
                message: message.trim(),
                rating: rating,
                createdAt: serverTimestamp(),
                status: 'pending',
                operatorReply: null,
                repliedAt: null,
                repliedBy: null
            };

            await addDoc(collection(db, 'feedbacks'), feedbackData);

            // Send Telegram Notification
            import('../utils/telegramNotifier').then(({ sendTelegramNotification, telegramTemplates }) => {
                sendTelegramNotification(telegramTemplates.newFeedback(feedbackData));
            });

            setSuccess(true);
            setMessage('');
            setEmail('');
            setRating(0);

            setTimeout(() => setSuccess(false), 5000);
        } catch (error) {
            console.error('Error submitting feedback:', error);
            alert('Failed to submit feedback. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (

        <div className="w-full max-w-lg mx-auto my-8">
            <div className="uiverse-card p-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-brand-primary/10 rounded-lg">
                        <MessageSquare className="text-brand-primary" size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-brand-text-dark">Share Your Feedback</h2>
                        <p className="text-xs text-brand-text-gray">Help us improve MessKhojo</p>
                    </div>
                </div>

                {/* Success Message */}
                {success && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-xs font-medium">
                        ✓ Thank you! Your feedback has been submitted successfully.
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-3">
                    {/* User Info Display (if logged in) */}
                    {currentUser && (
                        <div className="flex items-center gap-2 p-2.5 bg-brand-light-gray rounded-lg text-xs">
                            <User size={14} className="text-brand-primary" />
                            <span className="font-medium text-brand-text-dark">
                                Submitting as: {currentUser.email}
                            </span>
                        </div>
                    )}

                    {/* Email Field (only for anonymous users) */}
                    {!currentUser && (
                        <div>
                            <label className="block text-xs font-bold text-brand-text-dark mb-1.5">
                                Email (Optional)
                            </label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-gray" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your.email@example.com"
                                    className="w-full pl-9 pr-3 py-2 border-2 border-brand-light-gray rounded-lg focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all text-xs"
                                />
                            </div>
                        </div>
                    )}

                    {/* Star Rating */}
                    <div>
                        <label className="block text-xs font-bold text-brand-text-dark mb-1.5">
                            Rate Your Experience <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    className="p-1 transition-transform hover:scale-110 focus:outline-none"
                                >
                                    <Star
                                        size={24}
                                        className={`transition-colors ${(hoverRating || rating) >= star
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-gray-300'
                                            }`}
                                    />
                                </button>
                            ))}
                            <span className="ml-2 text-xs text-brand-text-gray">
                                {rating > 0 ? `${rating} / 5` : 'Click to rate'}
                            </span>
                        </div>
                    </div>

                    {/* Message Textarea */}
                    <div>
                        <label className="block text-xs font-bold text-brand-text-dark mb-1.5">
                            Your Feedback <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => {
                                if (e.target.value.length <= 250) {
                                    setMessage(e.target.value);
                                }
                            }}
                            maxLength={250}
                            placeholder="Share your thoughts..."
                            rows={3}
                            required
                            className="w-full px-3 py-2 border-2 border-brand-light-gray rounded-lg focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all resize-none text-xs"
                        />
                        <p className="text-[10px] text-brand-text-gray mt-1 text-right">
                            {message.length}/250 characters
                        </p>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading || !message.trim()}
                        className="w-full uiverse-badge py-2.5 text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send size={16} />
                                Submit Feedback
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default FeedbackForm;
