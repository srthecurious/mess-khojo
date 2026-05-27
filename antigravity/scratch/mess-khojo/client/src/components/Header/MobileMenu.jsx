import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserCircle, Heart, Building2, ChevronRight, Home, LogIn, Server, BedDouble, MessageSquare, Info, Phone, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

const MobileMenu = ({
    isMenuOpen,
    closeOverlays,
    setIsMenuOpen,
    isStandalone,
    isInstallable,
    isIOS,
    promptInstall,
    setShowInstallGuide,
    currentUser,
    wishlistCount,
    isActive,
    isContactOpen,
    setIsContactOpen
}) => {
    return createPortal(
        <AnimatePresence>
            {isMenuOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeOverlays}
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
                                <button onClick={closeOverlays} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div className="flex-1 overflow-y-auto py-4 px-2 space-y-2">
                            {/* Install App - Prominent Mobile Banner */}
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

                            {/* My Profile */}
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

                            {/* My Wishlist */}
                            <Link
                                to={currentUser ? '/wishlist' : '/user-login'}
                                className={`group w-full flex items-center gap-4 py-4 px-5 text-base font-semibold border-r-4 rounded-l-xl transition-all relative overflow-hidden ${isActive('/wishlist')
                                    ? 'text-white bg-white/10 border-red-400'
                                    : 'text-white/70 hover:text-white hover:bg-white/5 border-transparent hover:border-red-400'
                                    }`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <div className="w-8 flex justify-center shrink-0">
                                    <Heart size={20} className={`relative z-10 transition-colors ${isActive('/wishlist') ? 'text-red-400 fill-red-400' : 'group-hover:text-red-400'}`} />
                                </div>
                                <span className="relative z-10">My Wishlist</span>
                                {wishlistCount > 0 && (
                                    <span className="ml-auto w-[22px] h-[22px] flex items-center justify-center text-[11px] font-bold text-white bg-red-500 rounded-full shadow-sm relative z-10">
                                        {wishlistCount}
                                    </span>
                                )}
                            </Link>

                            <div className="h-px bg-white/10 my-2 mx-4"></div>

                            <Link
                                to="/register-mess"
                                onClick={() => setIsMenuOpen(false)}
                                className={`group w-full flex items-center gap-4 py-4 px-5 text-base font-bold border-r-4 rounded-l-xl transition-all relative overflow-hidden text-left ${isActive("/register-mess") || isActive("/register-mess-success")
                                    ? "text-white bg-white/10 border-blue-400"
                                    : "text-white/90 hover:text-white hover:bg-white/5 border-transparent hover:border-blue-400"
                                    }`}
                            >
                                <div className="relative z-10 w-8 h-8 flex items-center justify-center bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors shrink-0">
                                    <Building2 size={20} className="text-blue-400 group-hover:scale-110 transition-transform" />
                                </div>
                                <span className="relative z-10 leading-tight">Register your mess</span>
                                <div className="relative z-10 ml-auto flex items-center gap-2">
                                    <span className="px-2 py-0.5 text-[10px] font-bold tracking-wide text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-md shadow-sm animate-pulse">
                                        FREE
                                    </span>
                                    <ChevronRight size={16} className={`transition-opacity ${isActive("/register-mess") ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
                                </div>
                            </Link>

                            <Link
                                to="/"
                                className={`group flex items-center gap-4 py-4 px-5 text-base font-medium border-r-4 rounded-l-xl transition-all relative overflow-hidden ${isActive("/")
                                    ? "text-white bg-white/10 border-brand-white"
                                    : "text-white/70 hover:text-white hover:bg-white/5 border-transparent hover:border-white"
                                    }`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <div className="w-8 flex justify-center shrink-0">
                                    <Home size={20} className={`relative z-10 ${isActive("/") ? "text-white" : "group-hover:text-white transition-colors"}`} />
                                </div>
                                <span className="relative z-10">Home</span>
                                <ChevronRight size={16} className={`ml-auto transition-opacity relative z-10 ${isActive("/") ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
                            </Link>

                            <Link
                                to="/admin/login"
                                className="group flex items-center gap-4 py-4 px-5 text-base font-medium text-white/70 hover:text-white hover:bg-white/5 border-r-4 border-transparent hover:border-brand-accent-blue rounded-l-xl transition-all relative overflow-hidden"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <div className="w-8 flex justify-center shrink-0">
                                    <LogIn size={20} className="relative z-10 group-hover:text-brand-accent-blue transition-colors" />
                                </div>
                                <span className="relative z-10">Partner Login</span>
                                <ChevronRight size={16} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity relative z-10" />
                            </Link>

                            <Link
                                to="/operational/login"
                                className="group flex items-center gap-4 py-4 px-5 text-base font-medium text-white/70 hover:text-white hover:bg-white/5 border-r-4 border-transparent hover:border-emerald-500 rounded-l-xl transition-all relative overflow-hidden"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <div className="w-8 flex justify-center shrink-0">
                                    <Server size={20} className="relative z-10 group-hover:text-emerald-500 transition-colors" />
                                </div>
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
                                <div className="w-8 flex justify-center shrink-0">
                                    <BedDouble size={20} className={`relative z-10 transition-colors ${isActive("/find-your-room") ? "text-brand-accent-green" : "group-hover:text-brand-accent-green"}`} />
                                </div>
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
                                <div className="w-8 flex justify-center shrink-0">
                                    <MessageSquare size={20} className="relative z-10 group-hover:text-purple-400 transition-colors" />
                                </div>
                                <span className="relative z-10">Give Feedback</span>
                                <ChevronRight size={16} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity relative z-10" />
                            </button>

                            {/* Community Links */}
                            <div className="py-3 space-y-2">
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
                                    <div className="w-8 flex justify-center shrink-0">
                                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                        </svg>
                                    </div>
                                    <span className="relative z-10">WhatsApp Community</span>
                                </a>

                                <a
                                    href="https://t.me/messkhojo"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-center gap-4 py-3 px-5 text-sm font-medium text-white/90 bg-[#0088cc] hover:bg-[#0077b5] rounded-xl transition-all shadow-md hover:shadow-lg"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <div className="w-8 flex justify-center shrink-0">
                                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                                            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                                        </svg>
                                    </div>
                                    <span className="relative z-10">Telegram Group</span>
                                </a>
                            </div>

                            <Link
                                to="/about-us"
                                onClick={() => setIsMenuOpen(false)}
                                className={`group w-full flex items-center gap-4 py-4 px-5 text-base font-medium border-r-4 rounded-l-xl transition-all relative overflow-hidden text-left ${isActive("/about-us")
                                    ? "text-white bg-white/10 border-brand-white"
                                    : "text-white/70 hover:text-white hover:bg-white/5 border-transparent hover:border-white"
                                    }`}
                            >
                                <div className="w-8 flex justify-center shrink-0">
                                    <Info size={20} className={`relative z-10 transition-colors ${isActive("/about-us") ? "text-brand-white" : "group-hover:text-brand-white"}`} />
                                </div>
                                <span className="relative z-10">About Us</span>
                                <ChevronRight size={16} className={`ml-auto transition-opacity relative z-10 ${isActive("/about-us") ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
                            </Link>

                            {/* Contact Us - Expandable Section */}
                            <div className="pt-2 pb-6">
                                <button
                                    onClick={() => setIsContactOpen(!isContactOpen)}
                                    className={`group w-full flex items-center gap-4 py-4 px-5 text-base font-medium border-r-4 transition-all relative overflow-hidden rounded-l-xl ${isContactOpen ? 'bg-white/10 text-white border-brand-secondary' : 'text-white/70 hover:text-white hover:bg-white/5 border-transparent hover:border-brand-secondary'}`}
                                >
                                    <div className="w-8 flex justify-center shrink-0">
                                        <Phone size={20} className={`relative z-10 transition-colors ${isContactOpen ? 'text-brand-secondary' : 'group-hover:text-brand-secondary'}`} />
                                    </div>
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
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default MobileMenu;
