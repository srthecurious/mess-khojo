import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Menu, MapPin, Bell, X, UserCircle, Phone, BedDouble, ChevronRight, LogIn, Home, Server } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

import { useAuth } from '../context/AuthContext';

const Header = ({ userLocation, onLocationSelect, isLocationModalOpen, setIsLocationModalOpen }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { currentUser } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);

    // Fetch Notifications
    useEffect(() => {
        if (!currentUser) {
            setNotifications([]);
            return;
        }

        const q = query(
            collection(db, "bookings"),
            where("userId", "==", currentUser.uid),
            where("status", "in", ["confirmed", "rejected"])
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Sort by respondedAt or fallback to createdAt
            data.sort((a, b) => {
                const timeA = a.respondedAt?.seconds || a.createdAt?.seconds || 0;
                const timeB = b.respondedAt?.seconds || b.createdAt?.seconds || 0;
                return timeB - timeA;
            });

            setNotifications(data);

            // Basic logic: if there are ANY confirmed/rejected bookings, show dot 
            // In a real app, you'd track 'lastSeen' timestamp in local storage or user profile
            if (data.length > 0) {
                const lastDismissed = localStorage.getItem(`notifications_last_seen_${currentUser.uid}`);
                const latestTime = data[0].respondedAt?.seconds || 0;
                if (!lastDismissed || parseInt(lastDismissed) < latestTime) {
                    setHasUnread(true);
                }
            }
        });

        return () => unsubscribe();
    }, [currentUser]);

    const handleOpenNotifications = () => {
        setIsNotificationModalOpen(true);
        setHasUnread(false);
        if (notifications.length > 0) {
            const latestTime = notifications[0].respondedAt?.seconds || 0;
            localStorage.setItem(`notifications_last_seen_${currentUser.uid}`, latestTime.toString());
        }
    };

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);



    const handleUseCurrentLocation = () => {
        onLocationSelect();
        setIsLocationModalOpen(false);
    };

    return (
        <>
            <nav className="sticky top-0 z-50 bg-brand-primary shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-28 relative">

                        {/* Left Section: Logo */}
                        <div className="flex items-center justify-start">
                            {/* App Logo */}
                            <div className="h-24 w-auto rounded-md overflow-hidden">
                                <img
                                    src="/header-logo-black.png"
                                    alt="Mess Khojo"
                                    className="h-full w-auto object-contain mix-blend-screen"
                                />
                            </div>
                        </div>

                        {/* Right Section: Menu/Notifications */}
                        <div className="flex items-center gap-1 justify-end">
                            <button
                                onClick={handleOpenNotifications}
                                className="p-2 text-white hover:bg-brand-primary-hover rounded-full transition-colors relative"
                                title="Notifications"
                            >
                                <Bell size={20} strokeWidth={2} />
                                {hasUnread && (
                                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-brand-accent-green rounded-full border-2 border-brand-primary animate-pulse"></span>
                                )}
                            </button>

                            <button
                                onClick={toggleMenu}
                                className="p-2 text-white hover:bg-brand-primary-hover rounded-lg transition-colors"
                            >
                                <Menu size={24} strokeWidth={2} />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Location Modal - Portal */}
            {createPortal(
                <AnimatePresence>
                    {isLocationModalOpen && (
                        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center pointer-events-none">
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-brand-primary/20 backdrop-blur-sm pointer-events-auto"
                                onClick={() => setIsLocationModalOpen(false)}
                            />

                            {/* Modal Content */}
                            <motion.div
                                initial={{ y: '100%', opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: '100%', opacity: 0 }}
                                transition={{ type: "tween", ease: [0.32, 0.72, 0, 1], duration: 0.4 }}
                                className="bg-brand-secondary w-full max-w-md h-[80vh] sm:h-auto sm:rounded-3xl rounded-t-3xl overflow-hidden pointer-events-auto shadow-2xl relative flex flex-col border border-white/40"
                            >
                                {/* Header of Modal */}
                                <div className="flex justify-between items-center p-6 border-b border-brand-light-gray shrink-0">
                                    <h3 className="text-xl font-bold text-brand-text-dark">Select Location</h3>
                                    <button onClick={() => setIsLocationModalOpen(false)} className="p-3 text-brand-text-dark hover:bg-brand-light-gray rounded-full transition-all">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="flex-1 shrink-0">
                                    <div className="p-6">
                                        <button
                                            onClick={handleUseCurrentLocation}
                                            className="w-full flex items-center gap-4 px-4 py-4 bg-brand-primary text-white rounded-2xl font-bold border border-white/20 shadow-lg active:scale-[0.98] transition-all group"
                                        >
                                            <div className="p-3 bg-white/10 rounded-full group-hover:scale-95 transition-transform">
                                                <MapPin size={24} className="fill-current" />
                                            </div>
                                            <div className="text-left">
                                                <div className="text-lg">Use current location</div>
                                                <div className="text-xs opacity-70 font-medium">Using GPS</div>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Notification Modal - Portal */}
            {createPortal(
                <AnimatePresence>
                    {isNotificationModalOpen && (
                        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center pointer-events-none">
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-brand-primary/20 backdrop-blur-sm pointer-events-auto"
                                onClick={() => setIsNotificationModalOpen(false)}
                            />

                            {/* Modal Content */}
                            <motion.div
                                initial={{ y: '100%', opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: '100%', opacity: 0 }}
                                transition={{ type: "tween", ease: [0.32, 0.72, 0, 1], duration: 0.4 }}
                                className="bg-brand-secondary w-full max-w-md h-[70vh] sm:h-auto sm:max-h-[80vh] sm:rounded-3xl rounded-t-3xl overflow-hidden pointer-events-auto shadow-2xl relative flex flex-col border border-white/40"
                            >
                                {/* Header */}
                                <div className="flex justify-between items-center p-6 border-b border-brand-light-gray shrink-0 bg-white/50">
                                    <h3 className="text-xl font-bold text-brand-text-dark flex items-center gap-2">
                                        <Bell size={20} className="text-brand-primary" />
                                        Notifications
                                    </h3>
                                    <button onClick={() => setIsNotificationModalOpen(false)} className="p-3 text-brand-text-dark hover:bg-brand-light-gray rounded-full transition-all">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto bg-brand-secondary p-4 space-y-3">
                                    {!currentUser ? (
                                        <div className="text-center py-12">
                                            <p className="text-brand-text-gray italic">Please login to view notifications.</p>
                                        </div>
                                    ) : notifications.length === 0 ? (
                                        <div className="text-center py-12">
                                            <p className="text-brand-text-gray italic">No new notifications.</p>
                                        </div>
                                    ) : (
                                        notifications.map(note => (
                                            <div key={note.id} className={`p-5 rounded-2xl border transition-all ${note.status === 'confirmed' ? 'bg-green-50/50 border-green-100' : 'bg-red-50/50 border-red-100'}`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${note.status === 'confirmed' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                                        {note.status === 'confirmed' ? 'Approved' : 'Rejected'}
                                                    </span>
                                                    <span className="text-[10px] text-brand-text-gray font-medium">
                                                        {note.respondedAt?.seconds ? new Date(note.respondedAt.seconds * 1000).toLocaleDateString() : ''}
                                                    </span>
                                                </div>
                                                <h4 className="font-bold text-brand-text-dark text-base mb-1">{note.messName}</h4>
                                                <p className="text-xs text-brand-text-gray mb-3">{note.roomType} Room Booking Update</p>

                                                {note.remark && (
                                                    <div className="p-3 bg-white/60 rounded-xl border border-white/50 text-sm text-brand-text-dark leading-relaxed shadow-sm">
                                                        <span className="text-[10px] font-bold text-brand-text-gray block mb-1 uppercase tracking-tight">Operator Remark:</span>
                                                        "{note.remark}"
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Mobile Menu Drawer - Portal */}
            {
                createPortal(
                    <AnimatePresence>
                        {isMenuOpen && (
                            <>
                                {/* Backdrop */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setIsMenuOpen(false)}
                                    className="fixed inset-0 bg-neu-base/80 backdrop-blur-sm z-[60]"
                                />

                                {/* Drawer - Dark Premium Design */}
                                <motion.div
                                    initial={{ x: '100%' }}
                                    animate={{ x: 0 }}
                                    exit={{ x: '100%' }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    className="fixed top-0 right-0 w-[320px] h-full bg-brand-primary z-[70] shadow-2xl flex flex-col border-l border-white/10"
                                >
                                    {/* Header with Logo */}
                                    <div className="p-6 border-b border-white/10 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-r from-brand-primary-hover to-transparent pointer-events-none"></div>
                                        <div className="flex justify-between items-center relative z-10">
                                            <div>
                                                <h2 className="text-2xl font-bold text-white tracking-tight">MESS KHOJO</h2>
                                                <p className="text-xs text-brand-secondary/70 font-medium mt-1">Premium Stays</p>
                                            </div>
                                            <button onClick={() => setIsMenuOpen(false)} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                                                <X size={24} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Menu Items */}
                                    <div className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                                        <Link
                                            to="/"
                                            className="group flex items-center gap-4 py-4 px-5 text-base font-semibold text-white bg-white/10 border-r-4 border-white rounded-l-xl transition-all hover:bg-white/20 relative overflow-hidden"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            <Home size={20} className="relative z-10" />
                                            <span className="relative z-10">Home</span>
                                            <div className="ml-auto w-2 h-2 rounded-full bg-brand-accent-green animate-pulse relative z-10"></div>
                                        </Link>

                                        <Link
                                            to="/admin/login"
                                            className="group flex items-center gap-4 py-4 px-5 text-base font-medium text-white/70 hover:text-white hover:bg-white/5 border-r-4 border-transparent hover:border-brand-accent-blue rounded-l-xl transition-all relative overflow-hidden"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            <LogIn size={20} className="relative z-10 group-hover:text-brand-accent-blue transition-colors" />
                                            <span className="relative z-10">Partner Login</span>
                                            <ChevronRight size={16} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity relative z-10" />
                                        </Link>

                                        <Link
                                            to="/operational/login"
                                            className="group flex items-center gap-4 py-4 px-5 text-base font-medium text-white/70 hover:text-white hover:bg-white/5 border-r-4 border-transparent hover:border-emerald-500 rounded-l-xl transition-all relative overflow-hidden"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            <Server size={20} className="relative z-10 group-hover:text-emerald-500 transition-colors" />
                                            <span className="relative z-10">Operator Login</span>
                                            <ChevronRight size={16} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity relative z-10" />
                                        </Link>

                                        <button className="group w-full flex items-center gap-4 py-4 px-5 text-base font-medium text-white/70 hover:text-white hover:bg-white/5 border-r-4 border-transparent hover:border-brand-accent-green rounded-l-xl transition-all relative overflow-hidden text-left">
                                            <BedDouble size={20} className="relative z-10 group-hover:text-brand-accent-green transition-colors" />
                                            <span className="relative z-10">Book Room</span>
                                            <span className="ml-auto px-2 py-0.5 text-[10px] font-bold text-brand-accent-green bg-brand-accent-green/10 rounded-full border border-brand-accent-green/20 relative z-10">SOON</span>
                                        </button>

                                        <a
                                            href="mailto:support@messkhojo.com"
                                            className="group flex items-center gap-4 py-4 px-5 text-base font-medium text-white/70 hover:text-white hover:bg-white/5 border-r-4 border-transparent hover:border-brand-secondary/50 rounded-l-xl transition-all relative overflow-hidden"
                                        >
                                            <Phone size={20} className="relative z-10 group-hover:text-brand-secondary transition-colors" />
                                            <span className="relative z-10">Contact Us</span>
                                            <ChevronRight size={16} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity relative z-10" />
                                        </a>

                                        <div className="py-4">
                                            <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
                                        </div>

                                        <div className="px-5 py-2">
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Quick Links</p>
                                        </div>

                                        <Link
                                            to={currentUser ? "/profile" : "/user-login"}
                                            className="group w-full flex items-center gap-4 py-3 px-5 text-base font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            <UserCircle size={20} className="text-white/80 group-hover:text-white transition-colors" />
                                            <span>{currentUser ? "My Profile" : "Login / Signup"}</span>
                                        </Link>
                                    </div>

                                    {/* Footer */}
                                    <div className="p-6 border-t border-white/10 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                                        <div className="relative z-10">
                                            <div className="flex items-center justify-center gap-2 mb-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-brand-accent-green shadow-lg shadow-brand-accent-green/50"></div>
                                                <p className="text-xs text-brand-secondary font-bold tracking-widest">ONLINE</p>
                                            </div>
                                            <p className="text-xs text-brand-secondary/40 text-center">v1.0.0 • Made with ❤️</p>
                                        </div>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>,
                    document.body
                )
            }
        </>
    );
};

export default Header;
