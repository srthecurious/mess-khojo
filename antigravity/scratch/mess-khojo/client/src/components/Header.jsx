import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Menu, MapPin, Download, X, UserCircle, Phone, BedDouble, ChevronRight, LogIn, Map, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import MapPicker from './MapPicker';

const Header = ({ onInstallClick, userLocation, onLocationSelect, onManualLocationChange }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [manualLocation, setManualLocation] = useState('');
    const [showMap, setShowMap] = useState(false);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    const handleManualSubmit = (e) => {
        e.preventDefault();
        onManualLocationChange(manualLocation);
        setIsLocationModalOpen(false);
    };

    const handleUseCurrentLocation = () => {
        onLocationSelect();
        setIsLocationModalOpen(false);
    };

    return (
        <>
            <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16 relative">

                        {/* Left Section: Menu & Location */}
                        <div className="flex items-center gap-3">
                            {/* Hamburger Menu - Improved */}
                            <button
                                onClick={toggleMenu}
                                className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <Menu size={24} strokeWidth={2} />
                            </button>

                            {/* Location Selector - Enhanced */}
                            <button
                                onClick={() => setIsLocationModalOpen(true)}
                                className="flex flex-col items-start py-1 px-2 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    <MapPin size={14} className="text-teal-600" strokeWidth={2.5} />
                                    <span>LOCATION</span>
                                </div>
                                <div className="text-base font-bold text-gray-900 truncate max-w-[140px] sm:max-w-xs flex items-center gap-1">
                                    {userLocation?.address || manualLocation || "Select Location"}
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-gray-400 ml-0.5">
                                        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </button>
                        </div>

                        {/* Right Section: Download & Search Icons */}
                        <div className="flex items-center gap-2">
                            {/* Download Button - Redesigned */}
                            <button
                                onClick={onInstallClick}
                                className="p-3 text-teal-600 hover:bg-teal-50 rounded-full transition-colors"
                                title="Download App"
                            >
                                <Download size={20} strokeWidth={2} />
                            </button>

                            {/* Search Button - New */}
                            <button
                                className="p-3 text-teal-600 hover:bg-teal-50 rounded-full transition-colors"
                                title="Search"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <path d="m21 21-4.35-4.35"></path>
                                </svg>
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
                                className="absolute inset-0 bg-neu-base/80 backdrop-blur-sm pointer-events-auto"
                                onClick={() => setIsLocationModalOpen(false)}
                            />

                            {/* Modal Content */}
                            <motion.div
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="bg-neu-base w-full max-w-md h-[80vh] sm:h-auto sm:rounded-3xl rounded-t-3xl overflow-hidden pointer-events-auto shadow-neu-out relative flex flex-col border border-white/40"
                            >
                                {/* Header of Modal */}
                                <div className="flex justify-between items-center p-6 border-b border-gray-200/50 shrink-0">
                                    <h3 className="text-xl font-bold text-neu-text">Select Location</h3>
                                    <button onClick={() => setIsLocationModalOpen(false)} className="p-3 text-neu-text rounded-full shadow-neu-btn active:shadow-neu-in transition-all">
                                        <X size={20} />
                                    </button>
                                </div>

                                {showMap ? (
                                    <div className="flex-1 relative min-h-[400px]">
                                        <MapPicker
                                            initialLocation={userLocation}
                                            onConfirm={(pos) => {
                                                onLocationSelect({
                                                    lat: pos.lat,
                                                    lng: pos.lng,
                                                    address: "Pinned Location"
                                                });
                                                setIsLocationModalOpen(false);
                                                setShowMap(false);
                                            }}
                                            onCancel={() => setShowMap(false)}
                                        />
                                    </div>
                                ) : (
                                    <div className="p-6 space-y-6">
                                        <button
                                            onClick={handleUseCurrentLocation}
                                            className="w-full flex items-center gap-4 px-4 py-4 bg-neu-base text-neu-accent rounded-2xl font-bold border border-white/20 shadow-neu-btn active:shadow-neu-in transition-all group"
                                        >
                                            <div className="p-3 bg-neu-base rounded-full shadow-neu-in group-hover:scale-95 transition-transform">
                                                <MapPin size={24} className="fill-current" />
                                            </div>
                                            <div className="text-left">
                                                <div className="text-lg">Use current location</div>
                                                <div className="text-xs opacity-70 font-medium">Using GPS</div>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => setShowMap(true)}
                                            className="w-full flex items-center gap-4 px-4 py-4 bg-neu-base text-gray-600 rounded-2xl font-bold border border-white/20 shadow-neu-btn active:shadow-neu-in transition-all group"
                                        >
                                            <div className="p-3 bg-neu-base rounded-full shadow-neu-in group-hover:scale-95 transition-transform">
                                                <Map size={24} className="text-gray-500" />
                                            </div>
                                            <div className="text-left">
                                                <div className="text-lg">Select on Map</div>
                                                <div className="text-xs text-gray-400 font-medium">Drag pin to location</div>
                                            </div>
                                        </button>

                                        <div className="relative pt-4">
                                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                                <div className="w-full border-t border-gray-300"></div>
                                            </div>
                                            <div className="relative flex justify-center">
                                                <span className="bg-neu-base px-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Or enter manually</span>
                                            </div>
                                        </div>

                                        <form onSubmit={handleManualSubmit}>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    placeholder="Enter area, city..."
                                                    className="w-full px-6 py-4 bg-neu-base border-none rounded-2xl text-neu-text font-medium focus:outline-none shadow-neu-in transition-all placeholder-gray-400"
                                                    value={manualLocation}
                                                    onChange={(e) => setManualLocation(e.target.value)}
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={!manualLocation.trim()}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 px-5 py-2 bg-neu-base text-neu-accent text-sm font-bold rounded-xl disabled:opacity-50 shadow-neu-btn active:shadow-neu-in transition-all"
                                                >
                                                    Done
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Mobile Menu Drawer - Portal */}
            {createPortal(
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
                                initial={{ x: '-100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '-100%' }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="fixed top-0 left-0 w-[320px] h-full bg-gradient-to-b from-black via-gray-900 to-black z-[70] shadow-2xl flex flex-col border-r border-yellow-500/20"
                            >
                                {/* Header with Logo */}
                                <div className="p-6 border-b border-gray-800 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-transparent pointer-events-none"></div>
                                    <div className="flex justify-between items-center relative z-10">
                                        <div>
                                            <h2 className="text-2xl font-bold text-white tracking-tight">MESS KHOJO</h2>
                                            <p className="text-xs text-yellow-500 font-medium mt-1">Premium Stays</p>
                                        </div>
                                        <button onClick={() => setIsMenuOpen(false)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                                            <X size={24} />
                                        </button>
                                    </div>
                                </div>

                                {/* Menu Items */}
                                <div className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                                    <Link
                                        to="/"
                                        className="group flex items-center gap-4 py-4 px-5 text-base font-semibold text-white bg-gradient-to-r from-yellow-600/30 via-yellow-500/20 to-transparent border-l-4 border-yellow-500 rounded-r-xl transition-all hover:from-yellow-600/40 relative overflow-hidden"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <Home size={20} className="relative z-10 text-yellow-400" />
                                        <span className="relative z-10">Home</span>
                                        <div className="ml-auto w-2 h-2 rounded-full bg-yellow-400 animate-pulse relative z-10"></div>
                                    </Link>

                                    <Link
                                        to="/admin/login"
                                        className="group flex items-center gap-4 py-4 px-5 text-base font-medium text-gray-400 hover:text-white hover:bg-white/5 border-l-4 border-transparent hover:border-blue-500/50 rounded-r-xl transition-all relative overflow-hidden"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <LogIn size={20} className="relative z-10 text-gray-500 group-hover:text-blue-400 transition-colors" />
                                        <span className="relative z-10">Partner Login</span>
                                        <ChevronRight size={16} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity relative z-10 text-gray-500" />
                                    </Link>

                                    <button className="group w-full flex items-center gap-4 py-4 px-5 text-base font-medium text-gray-400 hover:text-white hover:bg-white/5 border-l-4 border-transparent hover:border-green-500/50 rounded-r-xl transition-all relative overflow-hidden text-left">
                                        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <BedDouble size={20} className="relative z-10 text-gray-500 group-hover:text-green-400 transition-colors" />
                                        <span className="relative z-10">Book Room</span>
                                        <span className="ml-auto px-2 py-0.5 text-[10px] font-bold text-green-400 bg-green-500/10 rounded-full border border-green-500/20 relative z-10">SOON</span>
                                    </button>

                                    <a
                                        href="mailto:support@messkhojo.com"
                                        className="group flex items-center gap-4 py-4 px-5 text-base font-medium text-gray-400 hover:text-white hover:bg-white/5 border-l-4 border-transparent hover:border-purple-500/50 rounded-r-xl transition-all relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <Phone size={20} className="relative z-10 text-gray-500 group-hover:text-purple-400 transition-colors" />
                                        <span className="relative z-10">Contact Us</span>
                                        <ChevronRight size={16} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity relative z-10 text-gray-500" />
                                    </a>

                                    <div className="py-4">
                                        <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
                                    </div>

                                    <div className="px-5 py-2">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Quick Links</p>
                                    </div>

                                    <button className="group w-full flex items-center gap-4 py-3 px-5 text-sm font-medium text-gray-500 hover:text-gray-300 hover:bg-white/5 rounded-xl transition-all">
                                        <UserCircle size={18} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                                        <span>My Account</span>
                                    </button>
                                </div>

                                {/* Footer */}
                                <div className="p-6 border-t border-gray-800 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/5 to-transparent pointer-events-none"></div>
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></div>
                                            <p className="text-xs text-gray-400 font-bold tracking-widest">ONLINE</p>
                                        </div>
                                        <p className="text-xs text-gray-600 text-center">v1.0.0 • Made with ❤️</p>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
};

export default Header;
