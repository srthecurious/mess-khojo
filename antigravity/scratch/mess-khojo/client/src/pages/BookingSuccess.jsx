import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, MessageCircle, Home, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const BookingSuccess = () => {
    const navigate = useNavigate();
    const whatsappNumber = "+919692819621";
    const whatsappLink = `https://wa.me/${whatsappNumber.replace('+', '')}?text=${encodeURIComponent("Hello Mess Khojo, I just sent a booking request. Can you please help me with the next steps?")}`;

    return (
        <div className="min-h-screen bg-brand-secondary flex flex-col items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-md w-full bg-white rounded-[32px] p-8 shadow-2xl border border-white text-center"
            >
                {/* Success Icon */}
                <div className="relative mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="w-24 h-24 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto text-brand-primary"
                    >
                        <CheckCircle size={48} strokeWidth={2.5} />
                    </motion.div>

                    {/* Decorative elements */}
                    <div className="absolute top-0 right-1/4 w-3 h-3 bg-brand-primary rounded-full animate-bounce"></div>
                    <div className="absolute bottom-0 left-1/4 w-2 h-2 bg-brand-accent-blue rounded-full animate-pulse"></div>
                </div>

                <h1 className="text-3xl font-black text-brand-text-dark mb-4">Request Sent!</h1>

                <div className="space-y-4 mb-8">
                    <p className="text-gray-600 font-medium">
                        Mess Khojo team will contact you within <span className="text-brand-primary font-bold">24 hours</span>.
                    </p>

                    <div className="p-4 bg-brand-secondary rounded-2xl border border-brand-light-gray">
                        <p className="text-sm text-brand-text-dark font-bold mb-1">Want to speed things up?</p>
                        <p className="text-xs text-brand-text-gray">Reach us directly on WhatsApp for faster verification.</p>
                    </div>
                </div>

                {/* WhatsApp Button */}
                <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-4 rounded-2xl transition-all shadow-[0_4px_14px_0_rgba(37,211,102,0.39)] hover:shadow-[0_6px_20px_rgba(37,211,102,0.23)] hover:-translate-y-1 mb-4 group"
                >
                    <MessageCircle size={24} className="group-hover:rotate-12 transition-transform" />
                    Chat with us on WhatsApp
                </a>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold rounded-xl transition-colors text-sm"
                    >
                        <Home size={18} />
                        Home
                    </button>
                    <button
                        onClick={() => navigate('/profile')}
                        className="flex items-center justify-center gap-2 py-3 px-4 bg-brand-primary/5 hover:bg-brand-primary/10 text-brand-primary font-bold rounded-xl transition-colors text-sm"
                    >
                        <Calendar size={18} />
                        My Requests
                    </button>
                </div>

            </motion.div>

            <p className="mt-8 text-sm text-brand-text-gray font-medium">
                Thank you for choosing <span className="text-brand-primary font-black italic">Mess Khojo</span>
            </p>
        </div>
    );
};

export default BookingSuccess;
