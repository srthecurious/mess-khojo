import React, { useEffect, useState, useRef } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import MessCard from '../components/MessCard';
import SkeletonCard from '../components/SkeletonCard';
import FilterBar from '../components/FilterBar';
import Header from '../components/Header'; // Import new Header
import FeedbackForm from '../components/FeedbackForm';
import MessExplorer from '../components/MessExplorer';
import MapLocationModal from '../components/MapLocationModal';
import { Search, MapPin, Home as HomeIcon, TrendingUp, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { trackLocationUsage, trackSearch, trackViewMore } from '../analytics';

// Helper functions moved outside component
const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const x1 = Number(lat1);
    const y1 = Number(lon1);
    const x2 = Number(lat2);
    const y2 = Number(lon2);

    if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) return null;

    const R = 6371; // Radius of earth in km
    const dLat = deg2rad(x2 - x1);
    const dLon = deg2rad(y2 - y1);

    // Haversine formula
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(x1)) * Math.cos(deg2rad(x2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    // Clamp a between 0 and 1 to prevent precision issues causing NaN in sqrt
    const c = 2 * Math.atan2(Math.sqrt(Math.max(0, Math.min(1, a))), Math.sqrt(Math.max(0, Math.min(1, 1 - a))));
    return R * c; // Distance in km
};

const Home = () => {
    const [messes, setMesses] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userLocation, setUserLocation] = useState(null); // { lat, lng, address }
    const [filters, setFilters] = useState({
        location: '',
        minPrice: '',
        maxPrice: '',
        amenities: {
            wifi: false,
            ac: false,
            food: false,
            inverter: false,
            tableChair: false
        },
        availableOnly: false,
        messType: '',
        messName: ''
    });
    const [showMapModal, setShowMapModal] = useState(false);
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [displayCount, setDisplayCount] = useState(12); // Pagination: show 12 cards initially

    const [loadingLocation, setLoadingLocation] = useState(false);


    const isScrolledRef = useRef(false);
    const bannerScrollRef = useRef(null);

    // Auto-slide community banners
    useEffect(() => {
        const scrollContainer = bannerScrollRef.current;
        if (loading || !scrollContainer) return;

        let interval;

        const startAutoScroll = () => {
            clearInterval(interval);
            interval = setInterval(() => {
                const innerContainer = scrollContainer.firstElementChild;
                if (!innerContainer || innerContainer.children.length < 2) return;

                const item1 = innerContainer.children[0];
                const item2 = innerContainer.children[1];
                const gap = 8; // gap-2 (0.5rem)

                // Width of one full set (2 items + 2 gaps)
                const singleSetWidth = item1.offsetWidth + item2.offsetWidth + (2 * gap);

                // Seamless Reset Check (if past the end of the first set)
                if (scrollContainer.scrollLeft >= singleSetWidth - 10) {
                    scrollContainer.scrollLeft -= singleSetWidth;
                }

                // Scroll to next item (current item width + gap)
                // Use scrollBy for smooth transition
                const scrollAmount = item1.offsetWidth + gap;
                scrollContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' });

            }, 2500); // 2.5s cycle (2s static + ~0.5s transition)
        };

        const stopAutoScroll = () => clearInterval(interval);

        // Interaction Handlers
        scrollContainer.addEventListener('mouseenter', stopAutoScroll);
        scrollContainer.addEventListener('mouseleave', startAutoScroll);
        scrollContainer.addEventListener('touchstart', stopAutoScroll);
        scrollContainer.addEventListener('touchend', startAutoScroll);

        startAutoScroll();

        return () => {
            stopAutoScroll();
            scrollContainer.removeEventListener('mouseenter', stopAutoScroll);
            scrollContainer.removeEventListener('mouseleave', startAutoScroll);
            scrollContainer.removeEventListener('touchstart', stopAutoScroll);
            scrollContainer.removeEventListener('touchend', startAutoScroll);
        };
    }, [loading]);

    const handleOpenMap = () => {
        window.history.pushState({ ...window.history.state, mapModalOpen: true }, "");
        setShowMapModal(true);
    };

    const handleCloseMap = () => {
        window.history.back();
    };

    // Scroll-Back Behavior Logic
    useEffect(() => {
        // Prevent browser from auto-restoring scroll on history navigation
        // This stops the "jump" when we call history.back() during manual scrolling
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
        }

        // Sync ref with initial history state on mount
        isScrolledRef.current = !!window.history.state?.scrolled;

        const handleScroll = () => {
            // If user scrolls down > 300px and we haven't marked it yet, push state
            // Don't push scroll state if a modal is open (it might clutter history or be confusing)
            // Actually, we want to know if WE are scrolled underlying the modal.
            if (window.scrollY > 300) {
                if (!isScrolledRef.current) {
                    window.history.pushState({ ...window.history.state, scrolled: true }, "");
                    isScrolledRef.current = true;
                }
            }
            // If user manually scrolls back to top (< 100px) and we have state, pop it
            // This ensures "Back" at top exits app instead of doing nothing
            else if (window.scrollY < 100) {
                // Check ACTUAL history state, not just our ref logic, to be safe
                if (window.history.state?.scrolled) {
                    // isScrolledRef.current = false; // We don't need to lock this anymore with manual restoration
                    window.history.back();
                }
            }
        };

        const handlePopState = (event) => {
            // Sync our local ref with the actual history state
            const state = event.state || {}; // Ensure state is object
            const isScrolled = !!state.scrolled;
            isScrolledRef.current = isScrolled;

            // Map Modal Close Logic (Home Hero)
            if (!state.mapModalOpen && showMapModal) {
                setShowMapModal(false);
            }

            // When back button is pressed (or we programmatically went back):
            // If we are back to base state (no 'scrolled'), scroll to top
            if (!isScrolled) {
                // Only clean up scroll if we are actually scrolled down significantly.
                // If user is already near top (started manual scroll up), don't force it.
                // Also, DON'T scroll top if we just closed a modal (which might still be 'scrolled')
                // Wait, if we closed a modal, we might have popped 'mapModalOpen' but KEPT 'scrolled' if we pushed correct state.
                // If we preserved 'scrolled' in handleOpenMap, then 'isScrolled' will be true here, so we won't scroll top. Correct.

                if (window.scrollY > 100) {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('popstate', handlePopState);
        };
    }, [showMapModal]); // Added dependency on showMapModal to access current state in listener

    const CARDS_PER_PAGE = 12;




    const handleLocationSelect = (coords) => {
        if (coords) {
            // Coordinate object provided (from MapPicker)
            trackLocationUsage('map');

            setUserLocation({
                lat: coords.lat,
                lng: coords.lng,
                address: coords.address || "Pinned Location"
            });
            setFilters(prev => ({ ...prev, location: '' }));
            return;
        }

        // GPS Logic with Retry

        setLoadingLocation(true); // Start Loading
        if (navigator.geolocation) {
            const successCallback = (position) => {
                let { latitude, longitude } = position.coords;


                // AUTO-CORRECT: If GPS places user in Bhubaneswar/Cuttack region (Lat ~19.8 - 20.8), override to Baleshwar center
                // This ensures testers in the capital see meaningful Baleshwar distances
                if (latitude > 19.8 && latitude < 20.9) {

                    latitude = 21.4934;
                    longitude = 86.9294;
                }

                setUserLocation({
                    lat: latitude,
                    lng: longitude,
                    address: "Your Location"
                });
                setFilters(prev => ({ ...prev, location: '' }));

                // Track GPS location usage
                trackLocationUsage('gps');

                setLoadingLocation(false); // Stop Loading
            };

            const errorCallback = (error, isRetry = false) => {
                console.error(`❌ Geolocation error (${isRetry ? 'Low' : 'High'} Accuracy):`, error.code, error.message);

                // If High Accuracy failed, try Low Accuracy once
                if (!isRetry) {

                    navigator.geolocation.getCurrentPosition(
                        successCallback,
                        (finalError) => errorCallback(finalError, true),
                        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
                    );
                    return;
                }

                // Final Failure Handling
                setLoadingLocation(false); // Stop Loading on Error
                let errorMessage = "Unable to get your location.\n\n";
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage += "❌ Location permission denied.\n\nPlease:\n1. Click the location icon in your browser's address bar\n2. Allow location access\n3. Try again";
                        console.error("User denied location permission");
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage += "📍 Location unavailable.\n\nPlease use 'Select on Map' instead.";
                        console.error("Position unavailable");
                        break;
                    case error.TIMEOUT:
                        errorMessage += "⏱️ Request timed out.\n\nPlease:\n1. Check your GPS/location services\n2. Try 'Select on Map' instead";
                        console.error("Geolocation timeout");
                        break;
                    default:
                        errorMessage += "Please use 'Select on Map' to choose your location.";
                        console.error("Unknown geolocation error:", error);
                }
                alert(errorMessage);
            };

            // 1. Try High Accuracy first
            console.log("📍 Attempting high accuracy GPS...");
            navigator.geolocation.getCurrentPosition(
                successCallback,
                (err) => errorCallback(err, false),
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
            );

        } else {
            console.error("❌ Geolocation not supported by browser");
            setLoadingLocation(false);
            alert("Your browser doesn't support location services.\n\nPlease use 'Select on Map' instead.");
        }
    };

    // Auto-detect location on load (optional, better UX to ask first or just button)
    // useEffect(() => { handleLocationSelect(); }, []);

    useEffect(() => {
        // Fetch Messes
        const unsubscribeMesses = onSnapshot(collection(db, "messes"), (snapshot) => {
            const messesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMesses(messesData);
        }, (error) => {
            console.error("Error fetching messes:", error);
            setLoading(false);
        });

        // Fetch Rooms
        const unsubscribeRooms = onSnapshot(collection(db, "rooms"), (snapshot) => {
            const roomsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRooms(roomsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching rooms:", error);
            setLoading(false);
        });

        return () => {
            unsubscribeMesses();
            unsubscribeRooms();
        };
    }, []);

    const handleFilterChange = React.useCallback((newFilters) => {
        setFilters(newFilters);

        // Track search if location filter (mess name) changed
        if (newFilters.location !== filters.location && newFilters.location) {
            trackSearch(newFilters.location);
        }
    }, [filters.location]);

    // Filtering & Sorting Logic - Memoized for Performance
    const filteredMesses = React.useMemo(() => {
        console.log("Recalculating with User Location:", userLocation);
        let result = messes.map(mess => {
            // Calculate Distance FIRST if userLocation exists
            // Calculate Distance FIRST if userLocation exists
            let distance = null;
            if (userLocation?.lat && userLocation?.lng && mess.latitude && mess.longitude) {
                // Strict number conversion
                const lat1 = Number(userLocation.lat);
                const lng1 = Number(userLocation.lng);
                const lat2 = Number(mess.latitude);
                const lng2 = Number(mess.longitude);

                if (!isNaN(lat1) && !isNaN(lng1) && !isNaN(lat2) && !isNaN(lng2)) {
                    distance = calculateDistance(lat1, lng1, lat2, lng2);
                } else {
                    console.warn(`Invalid coords for ${mess.name}:`, { lat1, lng1, lat2, lng2 });
                }
            }

            const messWithDist = { ...mess, distance };

            // Visibility Filter
            if (mess.hidden) return null;

            // 1. Location Filter (Mess Name Only)
            if (filters.location) {
                const searchTerm = filters.location.toLowerCase();
                const matchesName = (mess.name || '').toLowerCase().includes(searchTerm);
                if (!matchesName) return null;
            }

            // 2. Mess Type Filter (Gender)
            if (filters.messType && filters.messType !== '') {
                if (mess.messType !== filters.messType) return null;
            }



            // Get rooms for this mess
            const messRooms = rooms.filter(room => room.messId === mess.id);

            // Calculate Price Range for display (Global for Mess)
            const prices = messRooms.map(r => Number(r.price || r.rent)).filter(p => !isNaN(p) && p > 0);
            const minPrice = prices.length ? Math.min(...prices) : null;
            const maxPrice = prices.length ? Math.max(...prices) : null;

            // Helper to check amenity (Mess Level > Fallback to Room Level for legacy data)
            const checkAmenity = (key) => {
                // 1. Check new Mess-level amenities
                if (mess.amenities && mess.amenities[key] !== undefined) return mess.amenities[key];

                // 2. Fallback: Check if ANY room has this feature (Migration support)
                return messRooms.some(r => {
                    const rAm = r.amenities || r;
                    return rAm[key] === true;
                });
            };

            // 2a. Mess-Level Amenities Filter
            if (filters.amenities.food && !checkAmenity('food')) return null;
            if (filters.amenities.wifi && !checkAmenity('wifi')) return null;
            if (filters.amenities.inverter && !checkAmenity('inverter')) return null;

            // Filter Rooms based on Room Criteria for COUNTING
            const matchingRooms = messRooms.filter(room => {
                const price = Number(room.price || room.rent);
                const amenities = room.amenities || room;

                // Price
                if (filters.minPrice && price < Number(filters.minPrice)) return false;
                if (filters.maxPrice && price > Number(filters.maxPrice)) return false;

                // Room Amenities
                if (filters.amenities.ac && !amenities.ac) return false;

                // Availability
                if (filters.availableOnly && (room.availableCount === 0 || room.available === false)) return false;

                return true;
            });

            const hasRoomCriteria = filters.minPrice || filters.maxPrice || filters.availableOnly || filters.amenities.ac;

            // If filtering by room criteria, and no rooms match, exclude mess
            if (hasRoomCriteria && matchingRooms.length === 0) return null;

            // Calculate Total Matching Beds
            const matchingBeds = matchingRooms.reduce((sum, room) => sum + (room.availableCount || 0), 0);

            // Determine if we should show the "Filtered Availability" badge
            const isFiltered = filters.location || filters.minPrice || filters.maxPrice || filters.availableOnly || filters.messType || filters.maxDistance || Object.values(filters.amenities).some(Boolean);

            return {
                ...messWithDist,
                matchingBeds,
                isFiltered,
                minPrice,
                maxPrice
            };
        }).filter(Boolean); // Remove nulls

        // Sort by Distance if userLocation exists (Default Sort)
        if (userLocation) {
            result.sort((a, b) => {
                const distA = (typeof a.distance === 'number') ? a.distance : Infinity;
                const distB = (typeof b.distance === 'number') ? b.distance : Infinity;
                return distA - distB;
            });
        } else {
            // Default Sort: Priority to visual content -> Alphabetical
            result.sort((a, b) => {
                // 1. Priority: Has Poster Image
                const hasPosterA = !!a.posterUrl && a.posterUrl.length > 5;
                const hasPosterB = !!b.posterUrl && b.posterUrl.length > 5;
                if (hasPosterA !== hasPosterB) return hasPosterB ? 1 : -1;

                // 2. Priority: Total Images Available (excluding placeholders)
                const countImages = (item) => {
                    if (!Array.isArray(item.images)) return 0;
                    return item.images.filter(url => url && typeof url === 'string' && url.length > 10 && !url.includes('placeholder')).length;
                };
                const countA = countImages(a);
                const countB = countImages(b);
                if (countA !== countB) return countB - countA;

                // 3. Priority: Alphabetical Order
                return (a.name || '').localeCompare(b.name || '');
            });
        }

        return result;

    }, [messes, rooms, filters, userLocation]);

    // Paginated messes for display
    const displayedMesses = filteredMesses.slice(0, displayCount);
    const hasMore = displayCount < filteredMesses.length;

    const loadMore = () => {
        const newCount = displayCount + CARDS_PER_PAGE;
        setDisplayCount(newCount);
        trackViewMore(newCount);
    };

    // Reset pagination when filters change
    useEffect(() => {
        setDisplayCount(CARDS_PER_PAGE);
        // Force scroll to top using a slight delay to bypass mobile keyboard auto-scroll overrides
        // and safely wait for React DOM paints to shrink the page height.
        setTimeout(() => {
            window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        }, 10);
    }, [filters, userLocation]);

    const [isMainSearchVisible, setIsMainSearchVisible] = useState(true);
    const filterBarRef = React.useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                // If the filter bar is NOT intersecting (scrolled out of view), show the main header search
                // Use a slight delay or debounce if flickering occurs, but direct state setting is usually fine here
                setIsMainSearchVisible(entry.isIntersecting);
            },
            {
                threshold: 0, // Trigger as soon as one pixel leaves (or enters)
                rootMargin: "-80px 0px 0px 0px" // Offset by approx header height so it triggers when it goes under header
            }
        );

        const currentRef = filterBarRef.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, []);

    return (
        <div className="min-h-screen bg-brand-secondary font-sans text-brand-text-dark pb-20">
            {/* New Header */}
            <Header
                userLocation={userLocation}
                onLocationSelect={handleLocationSelect}
                isLocationModalOpen={isLocationModalOpen}
                setIsLocationModalOpen={setIsLocationModalOpen}
                showSearch={!isMainSearchVisible}
                searchTerm={filters.location}
                onSearchChange={(val) => setFilters(prev => ({ ...prev, location: val }))}
            />

            {/* Filter Section - Moved to Top */}
            <div ref={filterBarRef} className="pt-2 pb-6 relative z-40">
                <FilterBar onFilterChange={handleFilterChange} currentFilters={filters} />
            </div>

            {/* Mess Explorer Map Banner */}
            <MessExplorer messes={messes} userLocation={userLocation} />

            {/* Spotlight Hero Section - Only show when no filters are active (except messType) */}
            {!filters.location && !filters.minPrice && !filters.maxPrice && !filters.availableOnly && !Object.values(filters.amenities).some(Boolean) && (
                <div className="px-4 sm:px-6 lg:px-8 mb-8 max-w-7xl mx-auto">
                    <div
                        className="w-full h-[38vh] flex items-center justify-center overflow-hidden relative rounded-3xl shadow-lg"
                    >
                        {/* Brand gradient overlay for hero section */}
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/95 to-brand-primary/80 rounded-3xl"></div>

                        {/* Content positioned below spotlights */}
                        <div className="relative z-10 text-center px-6 max-w-2xl">
                            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 leading-tight">
                                Find Your Comfortable <span className="text-brand-accent-green">Stay</span>
                            </h1>
                            <p className="text-white/90 font-medium mb-6 text-base">
                                Mess Dhundo, Ghar Baithe
                            </p>


                            {!userLocation && (
                                <div className="relative max-w-xs mx-auto">
                                    <div className="grid grid-cols-2 gap-3 w-full">
                                        <button
                                            onClick={() => handleLocationSelect()}
                                            disabled={loadingLocation}
                                            className="w-full py-2.5 px-3 bg-white/20 backdrop-blur-md text-white text-sm font-medium rounded-xl border border-white/30 hover:bg-white/30 transition-all flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <MapPin size={16} className="fill-current" />
                                            <span>{loadingLocation ? 'Locating...' : 'Use GPS'}</span>
                                        </button>
                                        <button
                                            onClick={handleOpenMap}
                                            className="w-full py-2.5 px-3 bg-brand-primary text-white text-sm font-medium rounded-xl border border-transparent hover:bg-brand-primary-hover transition-all flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            <MapPin size={16} />
                                            <span>Map</span>
                                        </button>
                                    </div>
                                </div>
                            )}


                            {userLocation && (
                                <div className="mt-4 flex flex-col items-center animate-fade-in-up">
                                    <span className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Location Active</span>
                                    <button
                                        onClick={() => setIsLocationModalOpen(true)}
                                        className="px-6 py-2 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white font-bold flex items-center gap-2 shadow-lg hover:bg-white/30 transition-all hover:scale-105 active:scale-95"
                                    >
                                        <MapPin size={16} className="text-brand-accent-green" />
                                        {userLocation.address || "Using GPS Location"}
                                    </button>
                                </div>
                            )}

                            {/* Social Proof Stats - Option 3: Clean Inline Text */}
                            <div className="mt-5 flex items-center justify-center gap-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                                <div className="flex items-center gap-2 text-white/90">
                                    <div className="w-1.5 h-1.5 rounded-full bg-brand-accent-green shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                                    <span className="text-sm font-medium tracking-wide shadow-sm">{messes.length >= 10 ? (Math.floor(messes.length / 10) * 10) + "+" : messes.length} Messes Listed</span>
                                </div>
                                <div className="w-px h-4 bg-white/20"></div>
                                <div className="flex items-center gap-2 text-white/90">
                                    <span className="text-sm font-medium tracking-wide shadow-sm">✨ Free Bookings</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Mess List */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
                <div className="flex items-center justify-between mb-4 px-1">
                    {/* Category Switcher */}
                    <div className="flex bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
                        {['All', 'Boys', 'Girls'].map((type) => {
                            const isActive = (filters.messType || 'All') === type;
                            return (
                                <button
                                    key={type}
                                    onClick={() => handleFilterChange({ ...filters, messType: type === 'All' ? '' : type })}
                                    className="relative px-4 py-1.5 text-sm font-medium rounded-lg transition-colors z-10"
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId={`activeTab-${!filters.location && !filters.messType && !filters.minPrice && !filters.maxPrice && !filters.availableOnly && !Object.values(filters.amenities).some(Boolean) ? 'hero' : 'no-hero'}`}
                                            className="absolute inset-0 bg-brand-primary rounded-lg -z-10"
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        />
                                    )}
                                    <span className={isActive ? 'text-white' : 'text-gray-500 hover:text-gray-700'}>
                                        {type}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex flex-col items-end">
                        <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-lg border border-gray-100">
                            {filteredMesses.length} results
                        </span>
                        {filters.location && !userLocation && (
                            <span className="text-[10px] text-gray-400 mt-1 italic">
                                Enable "Current Location" for distances
                            </span>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                        {[...Array(6)].map((_, i) => (
                            <SkeletonCard key={i} />
                        ))}
                    </div>
                ) : filteredMesses.length > 0 ? (
                    <motion.div
                        className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
                        initial="hidden"
                        animate="visible"
                        variants={{
                            visible: {
                                transition: {
                                    staggerChildren: 0.05
                                }
                            }
                        }}
                    >
                        {/* First 4 mess cards */}
                        {displayedMesses.slice(0, 4).map((mess, index) => (
                            <MessCard key={mess.id} mess={mess} index={index} />
                        ))}


                        {/* Community Banners - Transform Carousel */}
                        {displayedMesses.length > 0 && (
                            <div className="col-span-2 lg:col-span-3 xl:col-span-4 my-8">
                                <div
                                    ref={bannerScrollRef}
                                    className="overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                                >
                                    <div className="flex gap-2">
                                        {/* WhatsApp Banner */}
                                        <a href="https://chat.whatsapp.com/LYhQ5jOBMfZItlupwWbrwx" target="_blank" rel="noopener noreferrer" className="snap-start flex-shrink-0 w-[90%] md:w-[48%]">
                                            <div className="rounded-2xl bg-[#1eaa62] p-4 flex items-center gap-3 min-h-[72px]">
                                                <div className="flex-shrink-0 w-10 h-10 bg-white rounded-full flex items-center justify-center">
                                                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#25D366] fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                                </div>
                                                <div className="flex-grow min-w-0">
                                                    <h3 className="text-white font-bold text-sm leading-tight">Join Our Community</h3>
                                                    <p className="text-white/75 text-xs mt-0.5">Connect with students, updates, offers</p>
                                                </div>
                                                <div className="flex-shrink-0 bg-white text-[#25D366] px-4 py-1.5 rounded-lg text-xs font-bold">Join</div>
                                            </div>
                                        </a>

                                        {/* Telegram Banner */}
                                        <a href="https://t.me/messkhojo" target="_blank" rel="noopener noreferrer" className="snap-start flex-shrink-0 w-[90%] md:w-[48%]">
                                            <div className="rounded-2xl bg-[#0088cc] p-4 flex items-center gap-3 min-h-[72px]">
                                                <div className="flex-shrink-0 w-10 h-10 bg-white rounded-full flex items-center justify-center">
                                                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#0088cc] fill-current"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg>
                                                </div>
                                                <div className="flex-grow min-w-0">
                                                    <h3 className="text-white font-bold text-sm leading-tight">Join Our Group</h3>
                                                    <p className="text-white/75 text-xs mt-0.5">Connect with students, updates, offers</p>
                                                </div>
                                                <div className="flex-shrink-0 bg-white text-[#0088cc] px-4 py-1.5 rounded-lg text-xs font-bold">Join</div>
                                            </div>
                                        </a>


                                        {/* Clones for Infinite Loop */}
                                        <a href="https://chat.whatsapp.com/LYhQ5jOBMfZItlupwWbrwx" target="_blank" rel="noopener noreferrer" className="snap-start flex-shrink-0 w-[90%] md:w-[48%]" tabIndex="-1" aria-hidden="true">
                                            <div className="rounded-2xl bg-[#1eaa62] p-4 flex items-center gap-3 min-h-[72px]">
                                                <div className="flex-shrink-0 w-10 h-10 bg-white rounded-full flex items-center justify-center">
                                                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#25D366] fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                                </div>
                                                <div className="flex-grow min-w-0">
                                                    <h3 className="text-white font-bold text-sm leading-tight">Join Our Community</h3>
                                                    <p className="text-white/75 text-xs mt-0.5">Connect with students, updates, offers</p>
                                                </div>
                                                <div className="flex-shrink-0 bg-white text-[#25D366] px-4 py-1.5 rounded-lg text-xs font-bold">Join</div>
                                            </div>
                                        </a>

                                        <a href="https://t.me/messkhojo" target="_blank" rel="noopener noreferrer" className="snap-start flex-shrink-0 w-[90%] md:w-[48%]" tabIndex="-1" aria-hidden="true">
                                            <div className="rounded-2xl bg-[#0088cc] p-4 flex items-center gap-3 min-h-[72px]">
                                                <div className="flex-shrink-0 w-10 h-10 bg-white rounded-full flex items-center justify-center">
                                                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#0088cc] fill-current"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg>
                                                </div>
                                                <div className="flex-grow min-w-0">
                                                    <h3 className="text-white font-bold text-sm leading-tight">Join Our Group</h3>
                                                    <p className="text-white/75 text-xs mt-0.5">Connect with students, updates, offers</p>
                                                </div>
                                                <div className="flex-shrink-0 bg-white text-[#0088cc] px-4 py-1.5 rounded-lg text-xs font-bold">Join</div>
                                            </div>
                                        </a>

                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Remaining mess cards */}
                        {displayedMesses.slice(4).map((mess, index) => (
                            <MessCard key={mess.id} mess={mess} index={index + 4} />
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4 }}
                        className="text-center py-16 px-6 bg-gradient-to-br from-white via-purple-50/30 to-white rounded-3xl border border-purple-100 shadow-lg"
                    >
                        <motion.div
                            animate={{
                                rotate: [0, 10, -10, 10, 0],
                                scale: [1, 1.1, 1, 1.1, 1]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                repeatDelay: 3
                            }}
                            className="bg-gradient-to-br from-purple-100 to-purple-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md"
                        >
                            <Search size={32} className="text-purple-400" />
                        </motion.div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">No messes found</h3>
                        <p className="text-sm text-gray-600 mb-6">Try adjusting your filters or search criteria.</p>

                        <div className="bg-purple-50/50 rounded-2xl p-4 border border-purple-100 max-w-md mx-auto">
                            <div className="flex items-center gap-2 mb-3 justify-center">
                                <TrendingUp size={16} className="text-purple-500" />
                                <span className="text-xs font-bold text-purple-700 uppercase tracking-wide">Suggestions</span>
                            </div>
                            <ul className="text-sm text-left text-gray-700 space-y-2">
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-500 mt-0.5">•</span>
                                    <span>Try removing some filters</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-500 mt-0.5">•</span>
                                    <span>Search by other mess name</span>
                                </li>
                            </ul>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* View More Button */}
            {!loading && hasMore && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
                    <div className="flex justify-center my-8">
                        <button
                            onClick={loadMore}
                            className="group px-6 py-2.5 bg-brand-primary text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg hover:bg-brand-primary/90 hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                            View More
                            <ChevronDown size={20} className="group-hover:translate-y-1 transition-transform duration-300" />
                        </button>
                    </div>
                </div>
            )}


            {/* Feedback Section */}
            <div id="feedback-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
                <FeedbackForm />
            </div>

            {/* Map Location Modal */}
            {showMapModal && (
                <MapLocationModal
                    initialLocation={userLocation}
                    onLocationSelect={(location) => {
                        setUserLocation(location);
                        // We must close carefully. If we push state to open, we must pop to close.
                        // But setting state directly to false leaves history dirty.
                        handleCloseMap();
                        // Note: handleCloseMap triggers popstate -> sets showMapModal(false)
                    }}
                    onClose={handleCloseMap}
                />
            )}

            {/* GPS Loader Overlay */}
            {loadingLocation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 flex flex-col items-center shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-primary border-t-transparent mb-4"></div>
                        <p className="text-brand-text-dark font-bold text-lg">Locating...</p>
                        <p className="text-sm text-gray-500">Getting your best position</p>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Home;
