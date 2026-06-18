import React, { useState, Suspense, useEffect } from 'react';
import { MapPin, Home, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { trackMessExplorer } from '../analytics';

// Lazy-load the heavy Google Maps component (~200KB) — only downloaded when user opens the map
const MessExplorerMap = React.lazy(() => import('./MessExplorerMap.jsx'));

const MessExplorer = ({ messes, rooms, userLocation, cityId, compact = false }) => {
    const navigate = useNavigate();
    const [isMapOpen, setIsMapOpen] = useState(false);

    // Enrich messes with price data for the map
    const validMesses = React.useMemo(() => {
        if (!messes) return [];
        let filtered = messes.filter(
            mess => !mess.hidden && mess.latitude && mess.longitude &&
                !isNaN(mess.latitude) && !isNaN(mess.longitude)
        );
        if (cityId) {
            filtered = filtered.filter(mess => {
                const mCity = mess.city ? mess.city.trim().toLowerCase() : 'other';
                return mCity === cityId.toLowerCase();
            });
        }
        return filtered.map(mess => {
            const messRooms = rooms ? rooms.filter(room => room.messId === mess.id) : [];
            const prices = messRooms.map(r => Number(r.price || r.rent)).filter(p => !isNaN(p) && p > 0);
            const minPrice = prices.length ? Math.min(...prices) : null;
            const maxPrice = prices.length ? Math.max(...prices) : null;
            return { ...mess, minPrice, maxPrice, messRooms };
        });
    }, [messes, rooms, cityId]);

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
            {!compact && (
                <div className="px-4 sm:px-6 lg:px-8 mb-6 max-w-md mx-auto sm:max-w-7xl">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Mess Explorer Card */}
                        <button
                            onClick={handleOpenMap}
                            className="relative overflow-hidden flex items-center justify-between p-4 rounded-2xl bg-[#300868] text-white hover:bg-[#250453] active:scale-[0.98] transition-all duration-300 shadow-md text-left group"
                        >
                            <div className="flex flex-col">
                                <span className="text-sm sm:text-base font-bold tracking-tight leading-tight mb-0.5 line-clamp-1">Mess Explorer</span>
                                <span className="text-[9px] sm:text-xs font-medium text-white/80 line-clamp-1">View Interactive Map</span>
                            </div>
                            <div className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center text-white ml-2 flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                                <MapPin size={16} />
                            </div>
                        </button>

                        {/* Register Your Mess Card */}
                        <button
                            onClick={() => navigate('/register-mess')}
                            className="relative overflow-hidden flex items-center justify-between p-4 rounded-2xl bg-[#300868] text-white hover:bg-[#250453] active:scale-[0.98] transition-all duration-300 shadow-md text-left group"
                        >
                            <div className="flex flex-col">
                                <span className="text-sm sm:text-base font-bold tracking-tight leading-tight mb-0.5 line-clamp-1">Register Your Mess</span>
                                <span className="text-[9px] sm:text-xs font-medium text-white/80 line-clamp-1">Enroll Today!</span>
                            </div>
                            <div className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center text-white ml-2 flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                                <Home size={16} />
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {/* Full-Screen Map Modal — lazy-loaded */}
            {isMapOpen && (
                <Suspense fallback={
                    <div className="fixed inset-0 z-[9999] bg-brand-secondary flex flex-col items-center justify-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
                            <MapPin size={28} className="text-brand-primary animate-bounce" />
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-brand-text-dark">Loading Map...</p>
                            <p className="text-sm text-brand-text-gray mt-1">Hang tight, preparing the explorer</p>
                        </div>
                        <div className="flex gap-1.5 mt-2">
                            {[0, 1, 2].map(i => (
                                <div key={i} className="w-2 h-2 bg-brand-primary rounded-full animate-bounce"
                                     style={{ animationDelay: `${i * 150}ms` }} />
                            ))}
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
