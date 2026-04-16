import React, { useState, Suspense, useEffect } from 'react';
import { MapPin, Home, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { trackMessExplorer } from '../analytics';

// Lazy-load the heavy Google Maps component (~200KB) — only downloaded when user opens the map
const MessExplorerMap = React.lazy(() => import('./MessExplorerMap'));

const MessExplorer = ({ messes, rooms, userLocation }) => {
    const navigate = useNavigate();
    const [isMapOpen, setIsMapOpen] = useState(false);

    // Enrich messes with price data for the map
    const validMesses = React.useMemo(() => {
        if (!messes) return [];
        return messes.filter(
            mess => !mess.hidden && mess.latitude && mess.longitude &&
                !isNaN(mess.latitude) && !isNaN(mess.longitude)
        ).map(mess => {
            const messRooms = rooms ? rooms.filter(room => room.messId === mess.id) : [];
            const prices = messRooms.map(r => Number(r.price || r.rent)).filter(p => !isNaN(p) && p > 0);
            const minPrice = prices.length ? Math.min(...prices) : null;
            const maxPrice = prices.length ? Math.max(...prices) : null;
            return { ...mess, minPrice, maxPrice, messRooms };
        });
    }, [messes, rooms]);

    // Open Map with History Push
    const handleOpenMap = React.useCallback(() => {
        trackMessExplorer('opened');
        // Push state AND visually change URL to /explorer for easy sharing
        window.history.pushState({ ...window.history.state, messExplorerOpen: true }, "", "/explorer");
        setIsMapOpen(true);
    }, []);

    // Handle URL-based opens and Back button (PopState)
    useEffect(() => {
        // 1. Auto-open map if URL is /explorer or contains #explorer (Shareable Link Feature)
        if (window.location.hash === '#explorer' || window.location.pathname === '/explorer') {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            handleOpenMap();
        }

        // 2. Listen to browser Back button to close the modal properly
        const handlePopState = (event) => {
            const state = event.state || {};
            // If the state no longer has messExplorerOpen, it means we went back past the map
            if (!state.messExplorerOpen) {
                setIsMapOpen(false);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [handleOpenMap]);

    return (
        <>
            {/* Quick Actions Grid */}
            <div className="px-4 sm:px-6 lg:px-8 mb-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                    {/* Premium Mess Explorer Card */}
                    <button
                        onClick={handleOpenMap}
                        className="relative overflow-hidden flex flex-col items-start justify-between p-3.5 sm:p-5 rounded-[1.25rem] sm:rounded-[1.5rem] bg-white border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.04)] hover:shadow-[0_15px_30px_-5px_rgba(75,46,131,0.1)] hover:border-brand-primary/20 transition-all duration-500 transform hover:-translate-y-1 active:scale-[0.98] group"
                    >
                        {/* Decorative background blobs */}
                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-brand-primary/5 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700"></div>
                        <div className="absolute -bottom-8 -left-8 w-20 h-20 bg-brand-accent-blue/5 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500"></div>

                        <div className="relative z-10 w-full flex items-center justify-between mb-3 sm:mb-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-brand-primary to-[#3F256F] flex items-center justify-center shadow-lg shadow-brand-primary/20 group-hover:scale-105 transition-all duration-300">
                                <MapPin size={20} className="text-white sm:w-6 sm:h-6" strokeWidth={2.5} />
                            </div>
                            <div className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:bg-brand-primary/5 group-hover:border-brand-primary/20 transition-all duration-300 group-hover:translate-x-1">
                                <ArrowRight size={14} className="text-brand-primary" strokeWidth={2.5} />
                            </div>
                        </div>
                        
                        <div className="relative z-10 flex flex-col items-start text-left w-full">
                            <span className="text-sm sm:text-base font-bold text-brand-text-dark tracking-tight leading-tight mb-0.5 line-clamp-1 group-hover:text-brand-primary transition-colors">Mess Explorer</span>
                            <span className="text-[10px] sm:text-xs font-medium text-gray-500 line-clamp-1">View interactive map</span>
                        </div>
                    </button>

                    {/* Premium Register Your Mess Card */}
                    <button
                        onClick={() => navigate('/register-mess')}
                        className="relative overflow-hidden flex flex-col items-start justify-between p-3.5 sm:p-5 rounded-[1.25rem] sm:rounded-[1.5rem] bg-white border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.04)] hover:shadow-[0_15px_30px_-5px_rgba(75,46,131,0.1)] hover:border-brand-primary/20 transition-all duration-500 transform hover:-translate-y-1 active:scale-[0.98] group"
                    >
                        {/* Decorative background blobs */}
                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-brand-primary/5 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700"></div>
                        <div className="absolute -bottom-8 -left-8 w-20 h-20 bg-brand-accent-green/5 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500"></div>

                        <div className="relative z-10 w-full flex items-center justify-between mb-3 sm:mb-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-brand-primary to-[#3F256F] flex items-center justify-center shadow-lg shadow-brand-primary/20 group-hover:scale-105 transition-all duration-300">
                                <Home size={20} className="text-white sm:w-6 sm:h-6" strokeWidth={2.5} />
                            </div>
                            <div className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:bg-brand-primary/5 group-hover:border-brand-primary/20 transition-all duration-300 group-hover:translate-x-1">
                                <ArrowRight size={14} className="text-brand-primary" strokeWidth={2.5} />
                            </div>
                        </div>
                        
                        <div className="relative z-10 flex flex-col items-start text-left w-full">
                            <span className="text-sm sm:text-base font-bold text-brand-text-dark tracking-tight leading-tight mb-0.5 line-clamp-2 group-hover:text-brand-primary transition-colors">Register Your Mess</span>
                            <span className="text-[10px] sm:text-xs font-medium text-gray-500 line-clamp-2 leading-snug">Free registration closing soon!</span>
                        </div>
                    </button>
                </div>
            </div>

            {/* Full-Screen Map Modal — lazy-loaded */}
            {isMapOpen && (
                <Suspense fallback={
                    <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center">
                        <div className="text-center">
                            <Loader2 size={36} className="animate-spin text-brand-primary mx-auto mb-3" />
                            <p className="text-sm text-gray-500 font-medium">Loading Map...</p>
                        </div>
                    </div>
                }>
                    <MessExplorerMap
                        validMesses={validMesses}
                        userLocation={userLocation}
                        onClose={() => {
                            // If we opened this via pushState, go back to restore URL
                            if (window.history.state?.messExplorerOpen) {
                                window.history.back();
                            } else {
                                // Fallback just in case
                                setIsMapOpen(false);
                            }
                        }}
                    />
                </Suspense>
            )}
        </>
    );
};

export default MessExplorer;
