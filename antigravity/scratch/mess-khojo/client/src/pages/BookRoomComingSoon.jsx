import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, CheckCircle, BedDouble, MapPin, Phone, User, Banknote, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const BookRoomComingSoon = () => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        contactMethod: 'whatsapp',
        budget: '',
        location: '',
        occupancy: 'single',
        requirements: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            await addDoc(collection(db, "room_inquiries"), {
                ...formData,
                createdAt: serverTimestamp(),
                status: 'new'
            });
            setIsSuccess(true);
            setFormData({
                name: '',
                phone: '',
                contactMethod: 'whatsapp',
                budget: '',
                location: '',
                occupancy: 'single',
                requirements: ''
            });
        } catch (err) {
            console.error("Error submitting inquiry:", err);
            setError("Something went wrong. Please try again or contact us directly on WhatsApp.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-secondary pb-20">
            {/* Header / Back Button */}
            <div className="bg-brand-primary p-4 sticky top-0 z-10 shadow-md">
                <div className="max-w-3xl mx-auto flex items-center gap-4">
                    <Link to="/" className="text-white/80 hover:text-white transition-colors">
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className="text-xl font-bold text-white">Book a Room</h1>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-8">

                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10"
                >
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-accent-green/10 rounded-full mb-4">
                        <BedDouble size={40} className="text-brand-accent-green" />
                    </div>
                    <h2 className="text-3xl font-bold text-brand-text-dark mb-3">Room Booking is Coming Soon!</h2>
                    <p className="text-brand-text-gray text-lg max-w-lg mx-auto leading-relaxed">
                        We are building the best room booking experience for you.
                        <br className="hidden sm:block" />
                        Tell us what you need, and we'll manually find the perfect room for you.
                    </p>
                </motion.div>

                {/* Success Message */}
                {isSuccess ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-green-50 border border-green-200 rounded-3xl p-8 text-center shadow-sm"
                    >
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-brand-text-dark mb-2">Request Received!</h3>
                        <p className="text-brand-text-gray mb-6">
                            Thanks for sharing your preferences. Our team will contact you shortly with the best available options that match your needs.
                        </p>
                        <Link
                            to="/"
                            className="inline-flex items-center justify-center px-8 py-3 bg-brand-primary text-white font-semibold rounded-xl hover:bg-brand-primary-hover transition-colors shadow-lg shadow-brand-primary/20"
                        >
                            Return to Home
                        </Link>
                    </motion.div>
                ) : (
                    /* Preference Form */
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
                    >
                        <div className="p-6 sm:p-8">
                            <h3 className="text-xl font-bold text-brand-text-dark mb-6 flex items-center gap-2">
                                <span className="w-1 h-6 bg-brand-primary rounded-full"></span>
                                Share Your Preferences
                            </h3>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Name & Phone Row */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-brand-text-dark flex items-center gap-2">
                                            <User size={16} className="text-brand-primary" />
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="e.g. Rahul Sharma"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-brand-text-dark flex items-center gap-2">
                                            <Phone size={16} className="text-brand-primary" />
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            required
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="e.g. 98765 43210"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Contact Method */}
                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-brand-text-dark">Preferred Contact Method</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setFormData(getHeader => ({ ...getHeader, contactMethod: 'whatsapp' }))}
                                            className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${formData.contactMethod === 'whatsapp' ? 'bg-green-50 border-green-200 text-green-700 font-medium ring-1 ring-green-200' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                                        >
                                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                            WhatsApp
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData(getHeader => ({ ...getHeader, contactMethod: 'call' }))}
                                            className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${formData.contactMethod === 'call' ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium ring-1 ring-blue-200' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                                        >
                                            <Phone size={14} />
                                            Phone Call
                                        </button>
                                    </div>
                                </div>

                                {/* Location & Budget Row */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-brand-text-dark flex items-center gap-2">
                                            <MapPin size={16} className="text-brand-primary" />
                                            Preferred Area
                                        </label>
                                        <input
                                            type="text"
                                            name="location"
                                            value={formData.location}
                                            onChange={handleChange}
                                            placeholder="e.g. Near Bus Stand, Remuna..."
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-brand-text-dark flex items-center gap-2">
                                            <Banknote size={16} className="text-brand-primary" />
                                            Budget (Monthly)
                                        </label>
                                        <select
                                            name="budget"
                                            value={formData.budget}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all appearance-none"
                                        >
                                            <option value="">Select Range</option>
                                            <option value="<2000">Below ₹2000</option>
                                            <option value="2000-3000">₹2000 - ₹3000</option>
                                            <option value="3000-5000">₹3000 - ₹5000</option>
                                            <option value="5000+">Above ₹5000</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Occupancy */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-brand-text-dark flex items-center gap-2">
                                        <Users size={16} className="text-brand-primary" />
                                        Occupancy Preference
                                    </label>
                                    <div className="flex flex-wrap gap-3">
                                        {['single', 'double', 'shared', 'any'].map((type) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, occupancy: type }))}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all capitalized ${formData.occupancy === type ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
                                            >
                                                {type.charAt(0).toUpperCase() + type.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Additional Requirements */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-brand-text-dark">Any Specific Requirements?</label>
                                    <textarea
                                        name="requirements"
                                        value={formData.requirements}
                                        onChange={handleChange}
                                        rows="3"
                                        placeholder="e.g. Need attached washroom, parking space, ground floor..."
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all resize-none"
                                    ></textarea>
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                                        {error}
                                    </div>
                                )}

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-4 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary-hover shadow-lg shadow-brand-primary/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={18} />
                                            Submit Preferences
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default BookRoomComingSoon;
