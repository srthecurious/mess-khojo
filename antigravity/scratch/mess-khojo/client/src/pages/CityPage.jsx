import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Search, ChevronRight } from 'lucide-react';

import Header from '../components/Header';
import MessCard from '../components/MessCard';
import SkeletonCard from '../components/SkeletonCard';
import FilterBar from '../components/FilterBar';
import RoomCard from '../components/RoomCard';
import { getCleanOccupancy } from '../utils/occupancy';
import MessExplorer from '../components/MessExplorer';


const MapLocationModal = React.lazy(() => import('../components/MapLocationModal'));
import { PAGINATION } from '../constants';
import { useDistrict, DISTRICTS_CONFIG } from '../context/DistrictContext';
import { useWishlist } from '../hooks/useWishlist';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePageSEO } from '../hooks/usePageSEO';
import useMesses from '../hooks/useMesses';
import { createSearchIndex, searchMesses } from '../utils/search';
import { trackLocationUsage } from '../analytics';

const CITY_NAMES = Object.values(DISTRICTS_CONFIG).reduce((acc, district) => {
    (district.cities || []).forEach(city => {
        acc[city.id] = city.name;
    });
    return acc;
}, { other: "Other Localities" });

// Helper functions for distance calculations moved outside component
const deg2rad = (deg) => deg * (Math.PI / 180);

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const x1 = Number(lat1);
    const y1 = Number(lon1);
    const x2 = Number(lat2);
    const y2 = Number(lon2);
    if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) return null;

    const R = 6371;
    const dLat = deg2rad(x2 - x1);
    const dLon = deg2rad(y2 - y1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(deg2rad(x1)) * Math.cos(deg2rad(x2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const CityPage = () => {
    // Support both:
    //   New canonical route: /district/:districtId/city/:cityId
    //   Legacy route:        /city/:cityId
    const { cityId, districtId: routeDistrictId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { isMessWishlisted, toggleMessWishlist, isRoomWishlisted, toggleRoomWishlist } = useWishlist();
    const { error: toastError } = useToast();
    const { selectedDistrict, setSelectedDistrict } = useDistrict();

    // 1. Resolve district for this city (prefer route param, fall back to config lookup)
    const resolvedDistrictId = useMemo(() => {
        if (routeDistrictId && DISTRICTS_CONFIG[routeDistrictId]) return routeDistrictId;
        for (const distId in DISTRICTS_CONFIG) {
            const cities = DISTRICTS_CONFIG[distId].cities || [];
            if (cities.some(c => c.id === cityId)) return distId;
        }
        return 'balasore'; // default fallback
    }, [cityId, routeDistrictId]);

    // Update selected district in context to match this city's district
    useEffect(() => {
        if (resolvedDistrictId && selectedDistrict !== resolvedDistrictId) {
            setSelectedDistrict(resolvedDistrictId);
        }
    }, [resolvedDistrictId, selectedDistrict, setSelectedDistrict]);

    const cityName = CITY_NAMES[cityId] || cityId.charAt(0).toUpperCase() + cityId.slice(1);

    // 2. SEO setup
    usePageSEO({
        title: `Messes in ${cityName} | MessKhojo`,
        description: `Browse verified boys and girls messes, PGs and hostel accommodations in ${cityName}. Filter by price, amenities, availability and direct contact owners.`,
        keywords: `mess in ${cityName}, hostels in ${cityName}, PGs in ${cityName}, student rooms in ${cityName}, messkhojo`,
        canonicalUrl: `https://messkhojo.com/district/${resolvedDistrictId}/city/${cityId}`,
    });

    // 3. Load data for this district
    const { messes, rooms, loading } = useMesses(resolvedDistrictId);

    // 4. State variables for filters, pagination, location
    const seaterRowRef = useRef(null);
    const [showScrollHint, setShowScrollHint] = useState(false);
    const [displayCount, setDisplayCount] = useState(PAGINATION.MESSES_PER_PAGE);
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

    useEffect(() => {
        const el = seaterRowRef.current;
        if (!el) return;

        const checkScroll = () => {
            const canScroll = el.scrollWidth > el.clientWidth;
            const isAtEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 10;
            setShowScrollHint(canScroll && !isAtEnd);
        };

        checkScroll();
        el.addEventListener('scroll', checkScroll);
        window.addEventListener('resize', checkScroll);

        // Check on delay for DOM/loading transitions
        const timer = setTimeout(checkScroll, 300);

        return () => {
            el.removeEventListener('scroll', checkScroll);
            window.removeEventListener('resize', checkScroll);
            clearTimeout(timer);
        };
    }, [loading, messes, rooms]);

    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [userLocation, setUserLocation] = useState(() => {
        try {
            const stored = sessionStorage.getItem('messkhojo_userLocation');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    const [filters, setFilters] = useState(() => {
        try {
            const stored = sessionStorage.getItem(`messkhojo_filters_${cityId}`);
            if (stored) return JSON.parse(stored);
        } catch { /* ignore */ }
        return {
            location: '',
            minPrice: '',
            maxPrice: '',
            amenities: {
                wifi: false,
                ac: false,
                food: false,
                inverter: false
            },
            availableOnly: false,
            messType: '', // 'Boys', 'Girls', or '' (All)
            occupancy: '' // '' (All), '1', '2', '3', '4', '5', '6'
        };
    });

    useEffect(() => {
        if (userLocation) {
            sessionStorage.setItem('messkhojo_userLocation', JSON.stringify(userLocation));
        } else {
            sessionStorage.removeItem('messkhojo_userLocation');
        }
    }, [userLocation]);

    useEffect(() => {
        sessionStorage.setItem(`messkhojo_filters_${cityId}`, JSON.stringify(filters));
    }, [filters, cityId]);

    // Reset display count when filters change
    useEffect(() => {
        setDisplayCount(PAGINATION.MESSES_PER_PAGE);
    }, [filters]);

    // 5. Interaction Handlers for GPS & Map modal
    const handleLocationSelect = (coords) => {
        if (coords) {
            trackLocationUsage('map');
            setUserLocation({
                lat: coords.lat,
                lng: coords.lng,
                address: coords.address || "Pinned Location"
            });
            setFilters(prev => ({ ...prev, location: '' }));
            setIsLocationModalOpen(false);
        }
    };

    const handleGps = () => {
        setLoadingLocation(true);
        if (navigator.geolocation) {
            const successCallback = (position) => {
                let { latitude, longitude } = position.coords;

                // Capital fallback override for testing
                if (latitude > 19.8 && latitude < 20.9) {
                    const gpsCenter = DISTRICTS_CONFIG[resolvedDistrictId]?.gpsCenter;
                    if (gpsCenter) {
                        latitude = gpsCenter.lat;
                        longitude = gpsCenter.lng;
                    }
                }

                setUserLocation({
                    lat: latitude,
                    lng: longitude,
                    address: "Your Location"
                });
                setFilters(prev => ({ ...prev, location: '' }));
                trackLocationUsage('gps');
                setLoadingLocation(false);
            };

            const errorCallback = (error, isRetry = false) => {
                console.error(`❌ Geolocation error:`, error.code, error.message);
                if (!isRetry) {
                    navigator.geolocation.getCurrentPosition(
                        successCallback,
                        (finalError) => errorCallback(finalError, true),
                        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
                    );
                    return;
                }
                setLoadingLocation(false);
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        toastError('Location permission denied. Allow access in your browser settings.');
                        break;
                    case error.POSITION_UNAVAILABLE:
                        toastError('Location unavailable. Please use Map button instead.');
                        break;
                    case error.TIMEOUT:
                        toastError('Location request timed out. Try again.');
                        break;
                    default:
                        toastError('Failed to get location.');
                }
            };

            navigator.geolocation.getCurrentPosition(
                successCallback,
                (err) => errorCallback(err, false),
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
            );
        } else {
            setLoadingLocation(false);
            toastError('Geolocation is not supported by your browser.');
        }
    };

    const handleMessWishlistToggle = async (messId) => {
        if (!currentUser) {
            setShowLoginPrompt(true);
            return;
        }
        await toggleMessWishlist(messId);
    };

    const handleRoomWishlistToggle = async (roomId) => {
        if (!currentUser) {
            setShowLoginPrompt(true);
            return;
        }
        await toggleRoomWishlist(roomId);
    };

    // 6. Filtering & Sorting Logic
    const filteredMessesList = useMemo(() => {
        let searchResultsMap = new Map();

        // Filter and scope messes to current city + filter hidden
        const cityMesses = messes.filter(m => {
            if (m.hidden) return false;
            // Check if city matches
            const currentCity = m.city ? m.city.trim().toLowerCase() : 'other';
            return currentCity === cityId.toLowerCase();
        });

        // Search location filter
        if (filters.location) {
            const fuse = createSearchIndex(cityMesses);
            const searched = searchMesses(fuse, filters.location);
            const highConfidenceMatches = searched.filter(m => m.searchScore >= 96);
            let finalSearchList = highConfidenceMatches.length > 0 ? highConfidenceMatches : searched.slice(0, 10);
            
            finalSearchList.forEach(item => {
                searchResultsMap.set(item.id, item.searchScore);
            });
        }

        // Apply filters & enrich details
        let result = cityMesses.map(mess => {
            // Location Search filter
            let searchScore = 0;
            if (filters.location) {
                if (!searchResultsMap.has(mess.id)) return null;
                searchScore = searchResultsMap.get(mess.id);
            }

            // Distance calculations
            let distance = null;
            if (userLocation?.lat && userLocation?.lng && mess.latitude && mess.longitude) {
                distance = calculateDistance(userLocation.lat, userLocation.lng, mess.latitude, mess.longitude);
            }

            // Gender filtering
            if (filters.messType && filters.messType !== '') {
                const selectedType = filters.messType.toLowerCase();
                if (Array.isArray(mess.messType)) {
                    const hasMatch = mess.messType.some(t => t && t.toLowerCase() === selectedType);
                    if (!hasMatch) return null;
                } else {
                    const currentType = (mess.messType || '').toLowerCase();
                    if (currentType !== selectedType) return null;
                }
            }

            const messRooms = rooms.filter(room => room.messId === mess.id);

            // Total Image Count
            let totalImages = 0;
            if (Array.isArray(mess.galleryUrls)) {
                totalImages += mess.galleryUrls.filter(url => url && typeof url === 'string' && url.length > 10 && !url.includes('placeholder')).length;
            } else if (Array.isArray(mess.images)) {
                totalImages += mess.images.filter(url => url && typeof url === 'string' && url.length > 10 && !url.includes('placeholder')).length;
            }
            messRooms.forEach(room => {
                if (Array.isArray(room.imageUrls)) {
                    totalImages += room.imageUrls.filter(url => url && typeof url === 'string' && url.length > 10 && !url.includes('placeholder')).length;
                } else if (room.imageUrl && typeof room.imageUrl === 'string' && room.imageUrl.length > 10 && !room.imageUrl.includes('placeholder')) {
                    totalImages += 1;
                }
            });

            // Prices Range
            const prices = messRooms.map(r => Number(r.price || r.rent)).filter(p => !isNaN(p) && p > 0);
            const minPrice = prices.length ? Math.min(...prices) : null;
            const maxPrice = prices.length ? Math.max(...prices) : null;

            // Amenities checker
            const checkAmenity = (key) => {
                if (mess.amenities && mess.amenities[key] !== undefined) return mess.amenities[key];
                return messRooms.some(r => {
                    const rAm = r.amenities || r;
                    return rAm[key] === true;
                });
            };

            if (filters.amenities.wifi && !checkAmenity('wifi')) return null;
            if (filters.amenities.ac && !checkAmenity('ac')) return null;
            if (filters.amenities.food && !checkAmenity('food')) return null;
            if (filters.amenities.inverter && !checkAmenity('inverter')) return null;

            // Availability & Price filters on rooms
            const matchingRooms = messRooms.filter(room => {
                const price = Number(room.price || room.rent);
                const amenities = room.amenities || room;

                if (filters.minPrice && price < Number(filters.minPrice)) return false;
                if (filters.maxPrice && price > Number(filters.maxPrice)) return false;
                if (filters.amenities.ac && !amenities.ac) return false;
                
                const isRoomAvailable = room.availableCount !== undefined 
                    ? Number(room.availableCount) > 0 
                    : room.available !== false;
                if (filters.availableOnly && !isRoomAvailable) return false;

                return true;
            });

            const hasRoomCriteria = filters.minPrice || filters.maxPrice || filters.availableOnly || filters.amenities.ac;
            if (hasRoomCriteria && matchingRooms.length === 0) return null;
            const matchingBeds = matchingRooms.reduce((sum, room) => sum + (room.availableCount || 0), 0);

            return {
                ...mess,
                searchScore,
                distance,
                matchingBeds,
                minPrice,
                maxPrice,
                totalImages
            };
        }).filter(Boolean);

        // Sorting
        if (filters.location) {
            result.sort((a, b) => b.searchScore - a.searchScore);
        } else if (userLocation) {
            result.sort((a, b) => {
                const distA = (typeof a.distance === 'number') ? a.distance : Infinity;
                const distB = (typeof b.distance === 'number') ? b.distance : Infinity;
                return distA - distB;
            });
        } else {
            // Default ranking: verified -> not userSourced -> hasPoster -> totalImages -> alphabetical
            result.sort((a, b) => {
                const isVerifiedA = !!a.isVerified;
                const isVerifiedB = !!b.isVerified;
                if (isVerifiedA !== isVerifiedB) return isVerifiedB ? 1 : -1;

                const isUserSourcedA = !!a.isUserSourced;
                const isUserSourcedB = !!b.isUserSourced;
                if (isUserSourcedA !== isUserSourcedB) return isUserSourcedA ? 1 : -1;

                const hasPosterA = !!a.posterUrl && a.posterUrl.length > 5;
                const hasPosterB = !!b.posterUrl && b.posterUrl.length > 5;
                if (hasPosterA !== hasPosterB) return hasPosterB ? 1 : -1;

                if (a.totalImages !== b.totalImages) return b.totalImages - a.totalImages;

                return (a.name || '').localeCompare(b.name || '');
            });
        }

        return result;
    }, [messes, rooms, filters, userLocation, cityId]);

    const filteredRoomsList = useMemo(() => {
        if (!filters.occupancy) return [];

        let cityMesses = messes.filter(m => {
            if (m.hidden) return false;
            const currentCity = m.city ? m.city.trim().toLowerCase() : 'other';
            return currentCity === cityId.toLowerCase();
        });

        // Apply location search to narrow down messes (same logic as filteredMessesList)
        if (filters.location) {
            const fuse = createSearchIndex(cityMesses);
            const searched = searchMesses(fuse, filters.location);
            const highConfidenceMatches = searched.filter(m => m.searchScore >= 96);
            const finalSearchList = highConfidenceMatches.length > 0 ? highConfidenceMatches : searched.slice(0, 10);
            const matchedMessIds = new Set(finalSearchList.map(m => m.id));
            cityMesses = cityMesses.filter(m => matchedMessIds.has(m.id));
        }

        const cityMessIds = new Set(cityMesses.map(m => m.id));

        const result = [];
        rooms.forEach(room => {
            if (!cityMessIds.has(room.messId)) return;
            const mess = cityMesses.find(m => m.id === room.messId);
            if (!mess) return;

            if (filters.messType && filters.messType !== '') {
                const selectedType = filters.messType.toLowerCase();
                if (Array.isArray(mess.messType)) {
                    const hasMatch = mess.messType.some(t => t && t.toLowerCase() === selectedType);
                    if (!hasMatch) return;
                } else {
                    const currentType = (mess.messType || '').toLowerCase();
                    if (currentType !== selectedType) return;
                }
            }

            const cleanOcc = getCleanOccupancy(room.occupancy);
            if (cleanOcc !== filters.occupancy) return;

            const price = Number(room.price || room.rent);
            if (filters.minPrice && price < Number(filters.minPrice)) return;
            if (filters.maxPrice && price > Number(filters.maxPrice)) return;

            const isRoomAvailable = room.availableCount !== undefined 
                ? Number(room.availableCount) > 0 
                : room.available !== false;
            if (filters.availableOnly && !isRoomAvailable) return;

            const checkAmenity = (key) => {
                const roomHasAmenity = (room.amenities && room.amenities[key] !== undefined)
                    ? room.amenities[key]
                    : room[key] === true;

                if (roomHasAmenity) return true;

                if (['wifi', 'food', 'inverter'].includes(key) && mess) {
                    if (mess.amenities && mess.amenities[key] !== undefined) return mess.amenities[key];
                    return mess[key] === true;
                }

                return false;
            };

            if (filters.amenities.wifi && !checkAmenity('wifi')) return;
            if (filters.amenities.ac && !checkAmenity('ac')) return;
            if (filters.amenities.food && !checkAmenity('food')) return;
            if (filters.amenities.inverter && !checkAmenity('inverter')) return;

            result.push({
                ...room,
                messName: mess.name
            });
        });

        result.sort((a, b) => {
            const priceA = Number(a.price || a.rent || 0);
            const priceB = Number(b.price || b.rent || 0);
            return priceA - priceB;
        });

        return result;
    }, [messes, rooms, filters, cityId]);

    // Paginated subset (swaps between messes and rooms)
    const paginatedItems = useMemo(() => {
        if (filters.occupancy) {
            return filteredRoomsList.slice(0, displayCount);
        }
        return filteredMessesList.slice(0, displayCount);
    }, [filteredMessesList, filteredRoomsList, displayCount, filters.occupancy]);

    const hasMore = useMemo(() => {
        if (filters.occupancy) {
            return filteredRoomsList.length > displayCount;
        }
        return filteredMessesList.length > displayCount;
    }, [filteredMessesList, filteredRoomsList, displayCount, filters.occupancy]);

    const loadMore = () => {
        setDisplayCount(prev => prev + 10);
    };

    return (
        <div className="min-h-screen bg-brand-secondary flex flex-col animate-fadeIn">
            <Header showSearch={false} />

            <main className="flex-grow py-6 sm:py-8">
                {/* Header Bar: Back to Homepage + City Name Title */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Link
                                to="/"
                                className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-600 hover:text-brand-primary shadow-sm active:scale-95 transition-all"
                            >
                                <ArrowLeft size={20} />
                            </Link>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-text-dark tracking-tight leading-tight">
                                    Messes in {cityName}
                                </h1>
                                <p className="text-xs text-gray-500 font-medium">
                                    Showing {filteredMessesList.length} verified listings
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FilterBar with GPS and Map buttons passed */}
                <div className="mb-8">
                    <FilterBar
                        onFilterChange={setFilters}
                        currentFilters={filters}
                        onGps={handleGps}
                        onMap={() => setIsLocationModalOpen(true)}
                        loadingLocation={loadingLocation}
                        userLocation={userLocation}
                        messes={filteredMessesList}
                    />
                </div>

                {/* MessExplorer: Renders city map and quick action strip */}
                <div className="mb-6">
                    <MessExplorer 
                        messes={filteredMessesList} 
                        rooms={rooms} 
                        userLocation={userLocation} 
                        cityId={cityId} 
                        compact={false} 
                    />
                </div>

                {/* Gender Toggle filter */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
                    <div className="flex items-center justify-between bg-white/40 backdrop-blur-sm p-1.5 rounded-2xl border border-gray-100/50 max-w-[240px]">
                        {['', 'boys', 'girls'].map((type) => (
                            <button
                                key={type || 'all'}
                                onClick={() => setFilters(prev => ({ ...prev, messType: type }))}
                                className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold uppercase transition-all duration-300 ${
                                    filters.messType === type
                                        ? 'bg-gradient-to-r from-brand-primary to-[#3F256F] text-white shadow-md shadow-brand-primary/15'
                                        : 'text-gray-500 hover:text-gray-800'
                                }`}
                            >
                                {type === '' ? 'All' : type}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Seater Filter Row */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
                    <div className="relative">
                        <div 
                            ref={seaterRowRef}
                            className="flex gap-2 overflow-x-auto hide-scrollbar py-1"
                        >
                            {[
                                { id: '', label: 'All Rooms' },
                                { id: '1', label: '1 Seater' },
                                { id: '2', label: '2 Seater' },
                                { id: '3', label: '3 Seater' },
                                { id: '4', label: '4 Seater' },
                                { id: '5', label: '5 Seater' },
                                { id: '6', label: '6 Seater' }
                            ].map((opt) => {
                                const isActive = (filters.occupancy || '') === opt.id;
                                return (
                                    <button
                                        key={opt.id}
                                        onClick={() => setFilters(prev => ({ ...prev, occupancy: opt.id }))}
                                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-300 border ${
                                            isActive
                                                ? 'bg-gradient-to-r from-brand-primary to-[#3F256F] text-white border-transparent shadow-md'
                                                : 'bg-white/80 border-gray-100 text-gray-500 hover:text-gray-800'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>
                        {/* Right scroll hint fade overlay and arrow */}
                        {showScrollHint && (
                            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-brand-secondary via-brand-secondary/80 to-transparent pointer-events-none flex items-center justify-end pr-2 text-brand-primary">
                                <ChevronRight size={18} strokeWidth={3} className="animate-bounceHorizontal" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Cards grid / list */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {loading ? (
                        filters.occupancy ? (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto w-full">
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <SkeletonCard key={i} compact={true} />)}
                            </div>
                        ) : (
                            <>
                                {/* Desktop UI loader */}
                                <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto w-full animate-fadeIn">
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <SkeletonCard key={i} compact={true} />)}
                                </div>
                                {/* Mobile UI loader */}
                                <div className="flex md:hidden flex-col gap-4 max-w-3xl mx-auto w-full">
                                    {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} layout="horizontal" />)}
                                </div>
                            </>
                        )
                    ) : paginatedItems.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
                            <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-brand-primary">
                                <Search size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">
                                {filters.occupancy ? 'No matching rooms found' : 'No matching messes found'}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">Try clearing your filters or refining your search location.</p>
                            {Object.values(filters.amenities).some(Boolean) || filters.location || filters.messType || filters.occupancy || filters.availableOnly || filters.minPrice || filters.maxPrice ? (
                                <button
                                    onClick={() => setFilters({
                                        location: '',
                                        minPrice: '',
                                        maxPrice: '',
                                        amenities: { wifi: false, ac: false, food: false, inverter: false },
                                        availableOnly: false,
                                        messType: '',
                                        occupancy: ''
                                    })}
                                    className="mt-4 px-5 py-2.5 bg-brand-primary text-white text-xs font-bold rounded-xl hover:bg-brand-primary/95 transition-all shadow"
                                >
                                    Clear Filters
                                </button>
                            ) : null}
                        </div>
                    ) : (
                        <>
                            {filters.occupancy ? (
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto w-full animate-fadeIn">
                                    {paginatedItems.map(room => (
                                        <RoomCard
                                            key={room.id}
                                            room={room}
                                            messName={room.messName}
                                            isWishlisted={isRoomWishlisted(room.id)}
                                            onToggleWishlist={handleRoomWishlistToggle}
                                            compact={true}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <>
                                    {/* Desktop UI: Grid of compact MessCards */}
                                    <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto w-full animate-fadeIn">
                                        {paginatedItems.map(mess => (
                                            <MessCard
                                                key={mess.id}
                                                mess={mess}
                                                rooms={rooms.filter(r => r.messId === mess.id)}
                                                onWishlistToggle={handleMessWishlistToggle}
                                                isWishlisted={isMessWishlisted(mess.id)}
                                                compact={true}
                                            />
                                        ))}
                                    </div>
                                    {/* Mobile UI: Vertical list of horizontal MessCards */}
                                    <div className="flex md:hidden flex-col gap-4 max-w-3xl mx-auto w-full animate-fadeIn">
                                        {paginatedItems.map(mess => (
                                            <MessCard
                                                key={mess.id}
                                                mess={mess}
                                                rooms={rooms.filter(r => r.messId === mess.id)}
                                                onWishlistToggle={handleMessWishlistToggle}
                                                isWishlisted={isMessWishlisted(mess.id)}
                                                layout="horizontal"
                                            />
                                        ))}
                                    </div>
                                </>
                            )}

                            {/* Load more button */}
                            {hasMore && (
                                <div className="mt-10 text-center">
                                    <button
                                        onClick={loadMore}
                                        className="px-8 py-3.5 bg-gradient-to-r from-brand-primary to-[#3F256F] text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-brand-primary/20 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 shadow-md flex items-center gap-2 mx-auto"
                                    >
                                        {filters.occupancy ? 'Load More Rooms' : 'Load More Messes'}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

            </main>

            {/* Login Prompt Modal - slides down from top */}
            {showLoginPrompt && (
                <div className="fixed inset-0 z-[200] flex flex-col items-center pointer-events-none">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
                        onClick={() => setShowLoginPrompt(false)}
                    />
                    {/* Modal */}
                    <div className="relative pointer-events-auto w-full max-w-sm mt-20 mx-4 bg-white rounded-3xl shadow-2xl p-6 animate-fadeIn">
                        <div className="flex flex-col items-center text-center gap-3">
                            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-2xl">❤️</div>
                            <h3 className="text-lg font-bold text-brand-text-dark">Save to Wishlist</h3>
                            <p className="text-sm text-brand-text-gray">Login to save messes and rooms to your personal wishlist.</p>
                            <button
                                onClick={() => { setShowLoginPrompt(false); navigate('/user-login'); }}
                                className="w-full py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary-hover transition-colors shadow-lg shadow-brand-primary/20"
                            >
                                Login / Sign Up
                            </button>
                            <button
                                onClick={() => setShowLoginPrompt(false)}
                                className="text-sm text-brand-text-gray hover:text-brand-text-dark transition-colors"
                            >
                                Maybe later
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* GPS/Map Modals */}
            <React.Suspense fallback={null}>
                {isLocationModalOpen && (
                    <MapLocationModal
                        initialLocation={userLocation}
                        onLocationSelect={handleLocationSelect}
                        onClose={() => setIsLocationModalOpen(false)}
                    />
                )}
            </React.Suspense>
        </div>
    );
};

export default CityPage;
