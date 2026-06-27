import React, { useState, useEffect } from 'react';
import { Menu, MapPin, Bell, X, UserCircle, Phone, BedDouble, ChevronRight, LogIn, Home, Server, MessageSquare, Building2, Search, Info, Heart, Download, TrendingUp } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { useDistrict } from '../context/DistrictContext';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

import NotificationModal from './Header/NotificationModal';
import MobileMenu from './Header/MobileMenu';
import InstallGuideModal from './Header/InstallGuideModal';

const Header = ({ showSearch, searchTerm, onSearchChange, messes = [] }) => {
    const { districtConfig } = useDistrict();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const headerJustFocused = React.useRef(false);
    const { currentUser } = useAuth();
    const { totalCount: wishlistCount } = useWishlist();
    const { isInstallable, promptInstall, isIOS, isStandalone } = useInstallPrompt();
    const [notifications, setNotifications] = useState([]);
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const [isContactOpen, setIsContactOpen] = useState(false);
    const [showInstallGuide, setShowInstallGuide] = useState(false);

    // Memoize suggestions so we don't recalculate on every render
    const allSuggestions = React.useMemo(() => {
        const predefinedLandmarks = (districtConfig?.landmarks || []).map(l => ({
            ...l,
            icon: MapPin
        }));

        const validLandmarks = predefinedLandmarks.filter(landmark => {
            return messes.some(mess => {
                const nm = mess.name || '';
                const ad = mess.address || '';
                const q = landmark.name.toLowerCase();
                return nm.toLowerCase().includes(q) || ad.toLowerCase().includes(q);
            });
        });

        const sponsoredMesses = messes.filter(m => m.isSponsored && m.name).map(m => ({
            name: m.name,
            type: 'mess',
            icon: TrendingUp,
            label: 'Sponsored',
            posterUrl: m.posterUrl
        }));
        
        const otherMesses = [...messes].filter(m => !m.isSponsored && m.name).sort((a, b) => {
            const aScore = (a.galleryUrls?.length || 0) + (a.isUserSourced ? 0 : 5);
            const bScore = (b.galleryUrls?.length || 0) + (b.isUserSourced ? 0 : 5);
            return bScore - aScore;
        });

        const popularMesses = otherMesses.slice(0, 5).map(m => ({
            name: m.name,
            type: 'mess',
            icon: TrendingUp,
            label: 'Recommended',
            posterUrl: m.posterUrl
        }));
        
        return [...sponsoredMesses, ...validLandmarks, ...popularMesses];
    }, [messes, districtConfig]);

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


    useBodyScrollLock(isMenuOpen || isNotificationModalOpen);

    const location = useLocation();

    // Helper to check if a link is active
    const isActive = (path) => location.pathname === path;

    // Push dummy history state when an overlay opens
    const [historyPushed, setHistoryPushed] = useState(false);
    useEffect(() => {
        const overlayOpen = isMenuOpen || isNotificationModalOpen || showInstallGuide;
        if (overlayOpen && !historyPushed) {
            window.history.pushState({ modalOpen: true }, '');
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setHistoryPushed(true);
        } else if (!overlayOpen && historyPushed) {
             
            setHistoryPushed(false);
        }
    }, [isMenuOpen, isNotificationModalOpen, showInstallGuide, historyPushed]);

    // Handle back button for menu and notifications
    useEffect(() => {
        const handlePopState = () => {
            if (isMenuOpen || isNotificationModalOpen || showInstallGuide || isContactOpen) {
                setIsMenuOpen(false);
                setIsNotificationModalOpen(false);
                setShowInstallGuide(false);
                setIsContactOpen(false);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [isMenuOpen, isNotificationModalOpen, showInstallGuide, isContactOpen]);

    // Close overlays securely, popping history if we pushed it
    const closeOverlays = () => {
        if (window.history.state?.modalOpen) {
            window.history.back(); // Triggers popstate listener to close
        } else {
            setIsMenuOpen(false);
            setIsNotificationModalOpen(false);
            setShowInstallGuide(false);
            setIsContactOpen(false);
        }
    };

    // Close overlays on route change as fallback
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsMenuOpen(false);
         
        setIsNotificationModalOpen(false);
         
        setShowInstallGuide(false);
         
        setIsContactOpen(false);
         
        setHistoryPushed(false);
    }, [location.pathname, location.search]);

    return (
        <>
            <nav className="sticky top-0 z-50 bg-brand-primary shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-[61px] relative">

                        {/* Left Section: Logo */}
                        <div className="flex items-center justify-start">
                            {/* App Logo */}
                            <Link to="/" className="flex items-center gap-1 sm:gap-1.5 py-1">
                                <img
                                    src="/logo.png"
                                    alt="MessKhojo - Find Boys and Girls Hostel/Mess/PG in Odisha"
                                    className="h-11 sm:h-12 w-auto object-contain drop-shadow-sm"
                                />
                                <span className="text-[22px] sm:text-[26px] font-bold text-white tracking-normal leading-none" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                    MessKhojo
                                </span>
                            </Link>
                        </div>


                        {/* Center Section: Sticky Search Bar */}
                        <div className="flex-1 flex justify-center ml-6 mr-1.5 sm:mx-4">
                            <AnimatePresence>
                                {(showSearch || isSearchFocused) && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.15, ease: "easeOut" }}
                                        className="relative block w-full max-w-xs"
                                    >
                                        <input
                                            type="text"
                                            placeholder="Search by landmark or mess name..."
                                            value={searchTerm}
                                            onFocus={() => {
                                                setIsSearchFocused(true);
                                                headerJustFocused.current = true;
                                            }}
                                            onBlur={() => setTimeout(() => {
                                                setIsSearchFocused(false);
                                                headerJustFocused.current = false;
                                            }, 200)}
                                            onChange={(e) => onSearchChange(e.target.value)}
                                            onClick={() => {
                                                if (headerJustFocused.current) {
                                                    headerJustFocused.current = false;
                                                } else {
                                                    setIsSearchFocused(prev => !prev);
                                                }
                                            }}
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
                                        {(() => {
                                            if (!isSearchFocused) return null;

                                            const filteredSuggestions = searchTerm 
                                                ? allSuggestions.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                                : allSuggestions;

                                            if (filteredSuggestions.length === 0) return null;
                                            return (
                                                <div className="absolute z-50 w-full bg-white rounded-xl shadow-lg border border-gray-100 mt-2 overflow-hidden top-full left-0">
                                                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                                        <div className="text-xs font-semibold text-gray-500 uppercase px-4 py-3 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10 border-b border-gray-50">
                                                            <span>Suggestions</span>
                                                        </div>
                                                        <div className="p-2">
                                                            {filteredSuggestions.map((item, idx) => (
                                                            <button
                                                                key={idx}
                                                                onMouseDown={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    onSearchChange(item.name);
                                                                    setIsSearchFocused(false);
                                                                }}
                                                                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-purple-50 text-left transition-colors rounded-lg group"
                                                            >
                                                                {item.type === 'mess' && item.posterUrl ? (
                                                                    <img 
                                                                        src={item.posterUrl} 
                                                                        alt={item.name} 
                                                                        className="w-8 h-8 rounded-lg object-cover border border-purple-100 shrink-0 group-hover:scale-105 transition-transform"
                                                                    />
                                                                ) : (
                                                                    <div className="p-1.5 bg-gray-100 rounded-full group-hover:bg-purple-100 group-hover:text-purple-600 transition-colors">
                                                                        <item.icon size={14} className={item.type === 'landmark' ? 'text-gray-500 group-hover:text-purple-600' : 'text-blue-500 group-hover:text-purple-600'} />
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700 block">{item.name}</span>
                                                                    <span className="text-[10px] text-gray-400 capitalize block -mt-0.5">{item.type === 'landmark' ? 'Landmark' : (item.label || 'Recommended')}</span>
                                                                </div>
                                                            </button>
                                                        ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}
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
                                    className="p-2 text-white hover:bg-brand-primary-hover rounded-full transition-colors relative"
                                    title="Install App"
                                >
                                    <Download size={20} strokeWidth={2} />
                                </button>
                            )}

                            {/* Notifications Bell Button - hidden on homepage */}
                            {location.pathname !== '/' && location.pathname !== '/explorer' && (
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
                            )}

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
            
            <NotificationModal 
                isNotificationModalOpen={isNotificationModalOpen}
                closeOverlays={closeOverlays}
                setIsNotificationModalOpen={setIsNotificationModalOpen}
                currentUser={currentUser}
                notifications={notifications}
            />

            {/* Mobile Menu Drawer - Portal */}
            
            <MobileMenu
                isMenuOpen={isMenuOpen}
                closeOverlays={closeOverlays}
                setIsMenuOpen={setIsMenuOpen}
                isStandalone={isStandalone}
                isInstallable={isInstallable}
                isIOS={isIOS}
                promptInstall={promptInstall}
                setShowInstallGuide={setShowInstallGuide}
                currentUser={currentUser}
                wishlistCount={wishlistCount}
                isActive={isActive}
                isContactOpen={isContactOpen}
                setIsContactOpen={setIsContactOpen}
            />

            
            <InstallGuideModal 
                showInstallGuide={showInstallGuide}
                closeOverlays={closeOverlays}
            />
        </>
    );
};

export default Header;
