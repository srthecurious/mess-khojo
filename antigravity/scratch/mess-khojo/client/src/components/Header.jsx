import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Menu, MapPin, Bell, X, UserCircle, Phone, BedDouble, ChevronRight, LogIn, Home, Server, MessageSquare, Building2, Search, Info, Heart, Download } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../hooks/useWishlist';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

const Header = ({ showSearch, searchTerm, onSearchChange }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const { currentUser } = useAuth();
    const { totalCount: wishlistCount } = useWishlist();
    const { isInstallable, promptInstall, isIOS, isStandalone } = useInstallPrompt();
    const [notifications, setNotifications] = useState([]);
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const [isContactOpen, setIsContactOpen] = useState(false);
    const [showInstallGuide, setShowInstallGuide] = useState(false);

    // Fetch Notifications
    useEffect(() => {
        if (!currentUser) {
            // eslint-disable-next-line
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

    // Lock Body Scroll
    useEffect(() => {
        if (isMenuOpen || isNotificationModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        }
    }, [isMenuOpen, isNotificationModalOpen]);





    const location = useLocation();

    // Helper to check if a link is active
    const isActive = (path) => location.pathname === path;

    return (
        <>
            <nav className="sticky top-0 z-50 bg-brand-primary shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-[61px] relative">

                        {/* Left Section: Logo */}
                        <div className="flex items-center justify-start">
                            {/* App Logo */}
                            <div className="h-14 w-auto flex items-center">
                                <img
                                    src="/logo.png"
                                    alt="Mess Khojo"
                                    className="h-full w-auto object-contain scale-[1.9]"
                                />
                            </div>
                        </div>

                        {/* Center Section: Sticky Search Bar */}
                        <div className="flex-1 flex justify-center ml-6 mr-1.5 sm:mx-4">
                            <AnimatePresence>
                                {(showSearch || isSearchFocused) && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.2 }}
                                        className="relative block w-full max-w-xs"
                                    >
                                        <input
                                            type="text"
                                            placeholder="Search..."
                                            value={searchTerm}
                                            onFocus={() => setIsSearchFocused(true)}
                                            onBlur={() => setIsSearchFocused(false)}
                                            onChange={(e) => onSearchChange(e.target.value)}
                                            className="w-full pl-9 pr-7 sm:pl-10 sm:pr-10 py-1.5 sm:py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full text-white placeholder:text-white/70 focus:outline-none focus:bg-white/30 transition-all font-medium text-sm"
                                        />
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/90 pointer-events-none" size={16} />
                                        {searchTerm && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    onSearchChange('');
                                                }}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                                                title="Clear search"
                                            >
                                                <X size={14} className="sm:w-4 sm:h-4" />
                                            </button>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Right Section: Menu/Notifications */}
                        <div className="flex items-center gap-1 justify-end">
                            {/* Install PWA Button — hidden when already installed */}
                            {!isStandalone && (isInstallable || isIOS) && (
                                <button
                                    onClick={() => {
                                        if (isInstallable) {
                                            promptInstall();
                                        } else {
                                            // iOS — show manual guide
                                            setShowInstallGuide(true);
                                        }
                                    }}
                                    className="flex items-center gap-1.5 px-2 py-1.5 sm:px-3 mr-0.5 sm:mr-1 bg-brand-accent-green hover:bg-emerald-500 text-white text-sm font-bold rounded-full transition-colors shadow-sm"
                                    title="Install App"
                                >
                                    <Download size={14} strokeWidth={2.5} />
                                    <span className="hidden sm:inline">Install App</span>
                                </button>
                            )}

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

                            {/* Hamburger Menu Button */}
                            <button
                                onClick={() => setIsMenuOpen(true)}
                                className="p-2 text-white hover:bg-brand-primary-hover rounded-full transition-colors relative"
                                aria-label="Menu"
                            >
                                <Menu size={24} />
                                {wishlistCount > 0 && (
                                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-brand-primary"></span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>



            {/* Notification Modal - Portal */}
            {createPortal(
                <AnimatePresence>
                    {isNotificationModalOpen && (
                        <div className="fixed inset-0 z-[60] flex items-start justify-end pt-20 pr-4 sm:pr-8 pointer-events-none">
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-transparent pointer-events-auto"
                                onClick={() => setIsNotificationModalOpen(false)}
                            />

                            {/* Modal Content */}
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: -20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: -20 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                style={{ transformOrigin: "top right" }}
                                className="bg-brand-secondary w-full max-w-sm max-h-[70vh] rounded-3xl overflow-hidden pointer-events-auto shadow-2xl relative flex flex-col border border-white/40"
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
                                            <Link
                                                to="/user-login"
                                                onClick={() => setIsNotificationModalOpen(false)}
                                                className="text-brand-primary hover:text-brand-primary-hover font-medium underline underline-offset-4 decoration-2 italic transition-colors"
                                            >
                                                Please login to view notifications.
                                            </Link>
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
                                                <p className="text-xs text-brand-text-gray mb-3">{note.roomType} Room Call Request Update</p>

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
                                    <div className="p-4 border-b border-white/10 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-r from-brand-primary-hover to-transparent pointer-events-none"></div>
                                        <div className="flex justify-between items-center relative z-10">
                                            <div>
                                                <h2 className="text-3xl font-bold text-white">MessKhojo</h2>
                                            </div>
                                            <button onClick={() => setIsMenuOpen(false)} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                                                <X size={24} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Menu Items */}
                                    <div className="flex-1 overflow-y-auto py-4 px-2 space-y-2">
                                        {/* Install App - Prominent Mobile Banner — hide when already installed */}
                                        {!isStandalone && (isInstallable || isIOS) && <button
                                            onClick={() => {
                                                setIsMenuOpen(false);
                                                if (isInstallable) {
                                                    promptInstall();
                                                } else {
                                                    setShowInstallGuide(true);
                                                }
                                            }}
                                            className="w-full flex items-center justify-between p-4 mb-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl shadow-md transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                                                    <Download size={20} className="text-white" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-bold text-sm">Install MessKhojo App</p>
                                                    <p className="text-white/80 text-xs">Faster access, offline support</p>
                                                </div>
                                            </div>
                                            <ChevronRight size={18} className="opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                        </button>}

                                        {/* My Profile - Moved to Top */}
                                        <Link
                                            to={currentUser ? "/profile" : "/user-login"}
                                            className={`group w-full flex items-center gap-4 py-4 px-5 text-base font-semibold border-r-4 rounded-l-xl transition-all relative overflow-hidden ${isActive(currentUser ? "/profile" : "/user-login")
                                                ? "text-white bg-white/10 border-brand-accent-green"
                                                : "text-white/70 hover:text-white hover:bg-white/5 border-transparent hover:border-brand-accent-green"
                                                }`}
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            <div className="relative z-10 w-8 h-8 rounded-full bg-brand-primary-hover flex items-center justify-center border border-white/20 overflow-hidden shrink-0">
                                                {currentUser && currentUser.photoURL ? (
                                                    <img
                                                        src={currentUser.photoURL}
                                                        alt="User profile"
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextElementSibling.style.display = 'block';
                                                        }}
                                                    />
                                                ) : null}
                                                <UserCircle
                                                    className={`w-5 h-5 ${isActive(currentUser ? "/profile" : "/user-login") ? "text-brand-accent-green" : "text-white/80"}`}
                                                    style={{ display: (currentUser && currentUser.photoURL) ? 'none' : 'block' }}
                                                />
                                            </div>
                                            <div className="relative z-10 text-left">
                                                <div className="block">{currentUser ? "My Profile" : "Login / Register"}</div>
                                                {currentUser && <div className="text-xs font-normal text-white/50 truncate max-w-[160px]">{currentUser.email}</div>}
                                            </div>
                                        </Link>

                                        {/* My Wishlist - Below Profile */}
                                        <Link
                                            to={currentUser ? '/wishlist' : '/user-login'}
                                            className={`group w-full flex items-center gap-4 py-4 px-5 text-base font-semibold border-r-4 rounded-l-xl transition-all relative overflow-hidden ${isActive('/wishlist')
                                                ? 'text-white bg-white/10 border-red-400'
                                                : 'text-white/70 hover:text-white hover:bg-white/5 border-transparent hover:border-red-400'
                                                }`}
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            <Heart size={20} className={`relative z-10 transition-colors ${isActive('/wishlist') ? 'text-red-400 fill-red-400' : 'group-hover:text-red-400'}`} />
                                            <span className="relative z-10">My Wishlist</span>
                                            {wishlistCount > 0 && (
                                                <span className="ml-auto px-2 py-0.5 text-[11px] font-bold text-white bg-red-500 rounded-full shadow-sm relative z-10">
                                                    {wishlistCount}
                                                </span>
                                            )}
                                        </Link>

                                        <div className="h-px bg-white/10 my-2 mx-4"></div>

                                        <Link
                                            to="/register-mess"
                                            onClick={() => setIsMenuOpen(false)}
                                            className={`group w-full flex items-center gap-4 py-4 px-5 text-base font-medium border-r-4 rounded-l-xl transition-all relative overflow-hidden text-left ${isActive("/register-mess") || isActive("/register-mess-success")
                                                ? "text-white bg-white/10 border-blue-400"
                                                : "text-white/70 hover:text-white hover:bg-white/5 border-transparent hover:border-blue-400"
                                                }`}
                                        >
                                            <Building2 size={20} className={`relative z-10 transition-colors ${isActive("/register-mess") ? "text-blue-400" : "group-hover:text-blue-400"}`} />
                                            <span className="relative z-10">Register your mess</span>
                                            <ChevronRight size={16} className={`ml-auto transition-opacity relative z-10 ${isActive("/register-mess") ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
                                        </Link>

                                        <Link
                                            to="/"
                                            className={`group flex items-center gap-4 py-4 px-5 text-base font-medium border-r-4 rounded-l-xl transition-all relative overflow-hidden ${isActive("/")
                                                ? "text-white bg-white/10 border-brand-white"
                                                : "text-white/70 hover:text-white hover:bg-white/5 border-transparent hover:border-white"
                                                }`}
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            <Home size={20} className={`relative z-10 ${isActive("/") ? "text-white" : "group-hover:text-white transition-colors"}`} />
                                            <span className="relative z-10">Home</span>
                                            <ChevronRight size={16} className={`ml-auto transition-opacity relative z-10 ${isActive("/") ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
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

                                        <Link
                                            to="/find-your-room"
                                            onClick={() => setIsMenuOpen(false)}
                                            className={`group w-full flex items-center gap-4 py-4 px-5 text-base font-medium border-r-4 rounded-l-xl transition-all relative overflow-hidden text-left ${isActive("/find-your-room")
                                                ? "text-white bg-white/10 border-brand-accent-green"
                                                : "text-white/70 hover:text-white hover:bg-white/5 border-transparent hover:border-brand-accent-green"
                                                }`}
                                        >
                                            <BedDouble size={20} className={`relative z-10 transition-colors ${isActive("/find-your-room") ? "text-brand-accent-green" : "group-hover:text-brand-accent-green"}`} />
                                            <span className="relative z-10">Find Your Room</span>
                                            <span className="ml-auto px-2 py-0.5 text-[10px] font-bold text-brand-accent-green bg-brand-accent-green/10 rounded-full border border-brand-accent-green/20 relative z-10">NEW</span>
                                        </Link>

                                        <button
                                            onClick={() => {
                                                setIsMenuOpen(false);
                                                // Scroll to feedback section
                                                setTimeout(() => {
                                                    const feedbackSection = document.getElementById('feedback-section');
                                                    if (feedbackSection) {
                                                        feedbackSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                    }
                                                }, 100);
                                            }}
                                            className="group w-full flex items-center gap-4 py-4 px-5 text-base font-medium text-white/70 hover:text-white hover:bg-white/5 border-r-4 border-transparent hover:border-purple-400 rounded-l-xl transition-all relative overflow-hidden text-left"
                                        >
                                            <MessageSquare size={20} className="relative z-10 group-hover:text-purple-400 transition-colors" />
                                            <span className="relative z-10">Give Feedback</span>
                                            <ChevronRight size={16} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity relative z-10" />
                                        </button>

                                        {/* Community Links */}
                                        <div className="px-2 py-3 space-y-2">
                                            <div className="px-3 pb-2">
                                                <p className="text-xs font-bold text-white/50 uppercase tracking-wider">Join Our Community</p>
                                            </div>

                                            <a
                                                href="https://chat.whatsapp.com/LYhQ5jOBMfZItlupwWbrwx"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group flex items-center gap-4 py-3 px-5 text-sm font-medium text-white/90 bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#20b858] hover:to-[#0f6d5f] rounded-xl transition-all shadow-md hover:shadow-lg"
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                                </svg>
                                                <span className="relative z-10">WhatsApp Community</span>
                                            </a>

                                            <a
                                                href="https://t.me/messkhojo"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group flex items-center gap-4 py-3 px-5 text-sm font-medium text-white/90 bg-[#0088cc] hover:bg-[#0077b5] rounded-xl transition-all shadow-md hover:shadow-lg"
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                                                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                                                </svg>
                                                <span className="relative z-10">Telegram Group</span>
                                            </a>
                                        </div>


                                        <Link
                                            to="/about-us"
                                            onClick={() => setIsMenuOpen(false)}
                                            className={`group w-full flex items-center gap-4 py-4 px-5 text-base font-medium transition-all relative overflow-hidden text-left ${isActive("/about-us")
                                                ? "text-white bg-white/10"
                                                : "text-white/70 hover:text-white hover:bg-white/5"
                                                }`}
                                        >
                                            <Info size={20} className={`relative z-10 transition-colors ${isActive("/about-us") ? "text-brand-white" : "group-hover:text-brand-white"}`} />
                                            <span className="relative z-10">About Us</span>
                                            <ChevronRight size={16} className={`ml-auto transition-opacity relative z-10 ${isActive("/about-us") ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
                                        </Link>

                                        {/* Contact Us - Expandable Section */}
                                        <div className="pt-2 px-2 pb-6">
                                            <button
                                                onClick={() => setIsContactOpen(!isContactOpen)}
                                                className={`group w-full flex items-center gap-4 py-4 px-5 text-base font-medium transition-all relative overflow-hidden rounded-xl ${isContactOpen ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
                                            >
                                                <Phone size={20} className={`relative z-10 transition-colors ${isContactOpen ? 'text-brand-secondary' : 'group-hover:text-brand-secondary'}`} />
                                                <span className="relative z-10">Contact Us</span>
                                                <ChevronRight size={16} className={`ml-auto transition-transform duration-300 relative z-10 ${isContactOpen ? 'rotate-90 text-white' : 'text-white/50 group-hover:text-white'}`} />
                                            </button>

                                            <AnimatePresence>
                                                {isContactOpen && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="pl-4 pr-1 py-2 space-y-2">
                                                            <a
                                                                href="https://wa.me/919692819621?text=Hi%20MessKhojo,%20I%20need%20help..."
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-3 py-3 px-4 text-sm font-medium text-white/90 bg-green-600/20 border border-green-500/30 hover:bg-green-600 hover:text-white rounded-xl transition-all shadow-[0_0_15px_rgba(37,211,102,0.2)] hover:shadow-[0_0_20px_rgba(37,211,102,0.4)]"
                                                                onClick={() => setIsMenuOpen(false)}
                                                            >
                                                                <MessageSquare size={18} />
                                                                <span>WhatsApp Us</span>
                                                            </a>

                                                            <a
                                                                href="mailto:messkhojobalasore@gmail.com"
                                                                className="flex items-center gap-3 py-3 px-4 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-xl transition-all"
                                                            >
                                                                <div className="w-[18px] flex justify-center font-bold">@</div>
                                                                <span className="truncate">messkhojobalasore@gmail.com</span>
                                                            </a>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                    </div>

                                    {/* Footer Removed */}
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>,
                    document.body
                )
            }

            {/* Install Guide Modal */}
            <AnimatePresence>
                {showInstallGuide && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setShowInstallGuide(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden z-10"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2">
                                        <Download size={24} />
                                    </div>
                                    <button onClick={() => setShowInstallGuide(false)} className="text-gray-400 hover:text-gray-600 p-1 transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Install MessKhojo</h3>
                                <p className="text-gray-600 text-sm mb-6">Install our app for faster access, offline mode, and a better experience.</p>

                                <div className="space-y-4">
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <div className="font-bold text-gray-800 mb-1 flex items-center gap-2">
                                            <span className="text-xl">🍎</span> iOS (Safari)
                                        </div>
                                        <ol className="text-sm text-gray-600 font-medium pl-5 list-decimal space-y-1">
                                            <li>Tap the <span className="font-bold">Share</span> button</li>
                                            <li>Scroll down and tap <span className="font-bold">Add to Home Screen</span></li>
                                        </ol>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <div className="font-bold text-gray-800 mb-1 flex items-center gap-2">
                                            <span className="text-xl">🤖</span> Android (Chrome)
                                        </div>
                                        <ol className="text-sm text-gray-600 font-medium pl-5 list-decimal space-y-1">
                                            <li>Tap the <span className="font-bold">3-dots menu</span> icon</li>
                                            <li>Tap <span className="font-bold">Install app</span> or <span className="font-bold">Add to Home screen</span></li>
                                        </ol>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowInstallGuide(false)}
                                    className="w-full mt-6 bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors"
                                >
                                    Got it !
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Header;
