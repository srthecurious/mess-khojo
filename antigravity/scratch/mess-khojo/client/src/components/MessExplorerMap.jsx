import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Navigation, ExternalLink, Loader2, ChevronLeft, Search, X, Home } from 'lucide-react';
import { APIProvider, Map, useMap, useApiLoadingStatus, APILoadingStatus, useMapsLibrary } from '@vis.gl/react-google-maps';
import AdvancedMarker from './SafeAdvancedMarker';
import { useNavigate } from 'react-router-dom';
import { trackMessExplorer } from '../analytics';
import { useDistrict, DISTRICTS_CONFIG } from '../context/DistrictContext';
import { toMessSlug } from '../utils/slugify';

// ─── MapSearchBar ─────────────────────────────────────────────────────────────
// IMPORTANT: This component MUST be a child of <APIProvider> so that
// useMapsLibrary() can access the Google Maps API context. Placing this
// hook in the parent (which *renders* APIProvider) always returns null.
// ─────────────────────────────────────────────────────────────────────────────
const MapSearchBar = ({ mapCenter, validMesses, onMessClick, onLocationClick, onClear }) => {
    const placesLibrary = useMapsLibrary('places');
    const autocompleteServiceRef = useRef(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [predictions, setPredictions] = useState([]);
    const searchContainerRef = useRef(null);

    const isFirstMount = useRef(true);
    useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false;
            return;
        }
        if (searchQuery.trim() === '') {
            onClear?.();
        }
    }, [searchQuery, onClear]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch Google Places predictions (debounced 300 ms)
    useEffect(() => {
        if (!placesLibrary) return;
        if (!searchQuery.trim()) {
            const timer = setTimeout(() => {
                setPredictions([]);
            }, 0);
            return () => clearTimeout(timer);
        }

        if (!autocompleteServiceRef.current) {
            autocompleteServiceRef.current = new placesLibrary.AutocompleteService();
        }
        const service = autocompleteServiceRef.current;
        const request = {
            input: searchQuery,
            locationBias: mapCenter ? { lat: mapCenter.lat, lng: mapCenter.lng } : undefined,
        };
        const timer = setTimeout(() => {
            service.getPlacePredictions(request, (results, status) => {
                if (status === 'OK' && results) {
                    setPredictions(results);
                } else {
                    setPredictions([]);
                }
            });
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, placesLibrary, mapCenter]);

    // Filter local mess names
    const searchedMesses = React.useMemo(() => {
        if (!searchQuery.trim()) return [];
        const q = searchQuery.toLowerCase().trim();
        return validMesses.filter(mess => mess.name?.toLowerCase().includes(q)).slice(0, 5);
    }, [searchQuery, validMesses]);

    const handleMessSelect = (mess) => {
        setSearchQuery(mess.name);
        setShowDropdown(false);
        onMessClick(mess);
    };

    const handleLocationSelect = (pred) => {
        setSearchQuery(pred.structured_formatting?.main_text || pred.description);
        setShowDropdown(false);
        onLocationClick(pred);
    };

    return (
        <div ref={searchContainerRef} className="pointer-events-auto flex-grow max-w-md relative">
            <div className="relative flex items-center bg-white/95 backdrop-blur-md border border-gray-100 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.25)] hover:border-gray-200 focus-within:border-brand-primary/50 focus-within:ring-2 focus-within:ring-brand-primary/10 transition-all overflow-hidden px-4 py-2 gap-2">
                <Search className="text-gray-400 shrink-0" size={18} />
                <input
                    type="text"
                    placeholder="Search mess name or location..."
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    className="w-full text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent"
                />
                {searchQuery && (
                    <button
                        onClick={() => {
                            setSearchQuery('');
                            setShowDropdown(false);
                        }}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Dropdown Suggestions */}
            {showDropdown && searchQuery.trim() && (
                <div className="absolute left-0 right-0 mt-2 bg-white/95 backdrop-blur-md border border-gray-100 rounded-2xl shadow-2xl z-[150] overflow-hidden animate-fadeIn max-h-[300px] overflow-y-auto w-full pointer-events-auto">
                    {searchedMesses.length === 0 && predictions.length === 0 ? (
                        <div className="p-5 text-center text-sm text-gray-500 bg-white">
                            No suggestions found for "{searchQuery}"
                        </div>
                    ) : (
                        <div className="p-2 space-y-3 bg-white">
                            {/* 1. MESS MATCHES */}
                            {searchedMesses.length > 0 && (
                                <div>
                                    <div className="px-3 py-1.5 text-[10px] font-extrabold text-brand-primary uppercase tracking-wider bg-brand-primary/5 rounded-lg mb-1 inline-block ml-2">
                                        Messes
                                    </div>
                                    <div className="space-y-0.5">
                                        {searchedMesses.map(mess => (
                                            <button
                                                key={mess.id}
                                                onClick={() => handleMessSelect(mess)}
                                                className="w-full text-left px-3 py-2 hover:bg-purple-50 rounded-xl transition-all duration-200 flex items-center justify-between group animate-fadeIn"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0 group-hover:scale-105 transition-transform">
                                                        <Home size={16} />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-sm font-semibold text-gray-800 truncate">{mess.name}</span>
                                                        <span className="text-[10px] text-gray-400 truncate">{mess.address || 'Address not listed'}</span>
                                                    </div>
                                                </div>
                                                <ExternalLink size={12} className="text-gray-300 group-hover:text-brand-primary transition-all" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 2. GOOGLE MAP LOCATIONS */}
                            {predictions.length > 0 && (
                                <div>
                                    <div className="px-3 py-1.5 text-[10px] font-extrabold text-blue-600 uppercase tracking-wider bg-blue-50 rounded-lg mb-1 inline-block ml-2">
                                        Locations
                                    </div>
                                    <div className="space-y-0.5">
                                        {predictions.map(pred => (
                                            <button
                                                key={pred.place_id}
                                                onClick={() => handleLocationSelect(pred)}
                                                className="w-full text-left px-3 py-2 hover:bg-blue-50 rounded-xl transition-all duration-200 flex items-center justify-between group animate-fadeIn"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 group-hover:scale-105 transition-transform">
                                                        <MapPin size={16} />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-sm font-semibold text-gray-800 truncate">{pred.structured_formatting?.main_text || pred.description}</span>
                                                        <span className="text-[10px] text-gray-400 truncate">{pred.structured_formatting?.secondary_text || ''}</span>
                                                    </div>
                                                </div>
                                                <ExternalLink size={12} className="text-gray-300 group-hover:text-blue-600 transition-all" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Handles silky smooth animated map panning without disrupting 60fps drag performance.
const MapCameraHandler = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        if (!map || !center) return;
        map.panTo(center);
    }, [map, center]);

    useEffect(() => {
        if (!map || !zoom) return;
        map.setZoom(zoom);
    }, [map, zoom]);

    return null;
};

// MapMarkers component to safely wrap AdvancedMarker rendering.
// ROOT CAUSE: map is non-null even during AUTH_FAILURE, so useMap() check is insufficient.
// We must check APILoadingStatus === LOADED before rendering markers, otherwise the
// Google Maps SDK's internal set map() setter calls getRootNode() on an undefined node.
const MapMarkers = ({ filteredMesses, selectedMess, handleMarkerClick, localUserLocation }) => {
    const status = useApiLoadingStatus();
    if (status !== APILoadingStatus.LOADED) return null;

    return (
        <>
            {/* User Location Marker */}
            {localUserLocation?.lat && localUserLocation?.lng && (
                <AdvancedMarker
                    position={{ lat: localUserLocation.lat, lng: localUserLocation.lng }}
                    title="Your Location"
                    zIndex={9999}
                >
                    <div className="relative flex items-center justify-center">
                        <div className="absolute w-8 h-8 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
                        <div className="relative w-5 h-5 bg-yellow-500 border-2 border-white rounded-full shadow-[0_0_10px_rgba(234,179,8,0.8)] z-10 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                        </div>
                    </div>
                </AdvancedMarker>
            )}

            {/* Mess Markers */}
            {filteredMesses.map((mess) => {
                const isSelected = selectedMess?.id === mess.id;
                let priceText = '₹---';
                if (mess.minPrice && mess.maxPrice && mess.minPrice !== mess.maxPrice) {
                    priceText = `₹${mess.minPrice} - ₹${mess.maxPrice}`;
                } else if (mess.minPrice) {
                    priceText = `₹${mess.minPrice}`;
                }

                return (
                    <AdvancedMarker
                        key={mess.id}
                        position={{ lat: mess.latitude, lng: mess.longitude }}
                        onClick={() => handleMarkerClick(mess)}
                        zIndex={isSelected ? 999 : 1}
                    >
                        {isSelected ? (
                            <div className="relative flex items-center justify-center rounded-full font-extrabold cursor-pointer transition-all duration-300 transform border px-2.5 py-1 text-[11px] sm:text-xs tracking-tight scale-110 bg-[#059669] text-white border-transparent shadow-[0_8px_30px_rgba(5,150,105,0.4)]">
                                {priceText}
                                <div 
                                    className="absolute left-1/2 -translate-x-1/2 rotate-45 border-b border-r bg-[#059669] border-transparent w-3 h-3 -bottom-1.5"
                                    style={{ zIndex: -1 }}
                                ></div>
                            </div>
                        ) : (
                            <div className="relative group cursor-pointer transition-all duration-300 active:scale-95 pb-1 hover:-translate-y-1 z-10">
                                <MapPin 
                                    size={34} 
                                    strokeWidth={1.5} 
                                    strokeLinejoin="miter"
                                    strokeLinecap="butt"
                                    className="text-white relative z-10 [&>circle]:fill-transparent"
                                    fill="#7C3AED"
                                />
                            </div>
                        )}
                    </AdvancedMarker>
                );
            })}
        </>
    );
};

const MessExplorerMap = ({ validMesses, userLocation, onClose }) => {
    const navigate = useNavigate();
    const { selectedDistrict } = useDistrict();

    // Helper function to calculate exact distance in kilometers using the Haversine formula
    const getDistanceKm = (lat1, lon1, lat2, lon2) => {
        if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const districtCenter = React.useMemo(() => {
        return selectedDistrict && DISTRICTS_CONFIG[selectedDistrict]
            ? DISTRICTS_CONFIG[selectedDistrict].gpsCenter
            : null;
    }, [selectedDistrict]);

    // Calculate dynamic centroid center of messes in this district to open at high mess density area (purple pin density)
    // Filter out coordinate outliers (e.g. Balasore messes returned in Bhadrak district) to prevent distorting centroid centering
    const dynamicCentroid = React.useMemo(() => {
        let messesWithCoords = validMesses.filter(m => m.latitude && m.longitude && !isNaN(m.latitude) && !isNaN(m.longitude));
        
        if (districtCenter) {
            // Only include messes that are within 40 km of the district center to filter out rogue/outlier district listings
            messesWithCoords = messesWithCoords.filter(m => {
                const distance = getDistanceKm(m.latitude, m.longitude, districtCenter.lat, districtCenter.lng);
                return distance < 40;
            });
        }

        if (messesWithCoords.length > 0) {
            const sumLat = messesWithCoords.reduce((sum, m) => sum + m.latitude, 0);
            const sumLng = messesWithCoords.reduce((sum, m) => sum + m.longitude, 0);
            return {
                lat: sumLat / messesWithCoords.length,
                lng: sumLng / messesWithCoords.length
            };
        }
        return null;
    }, [validMesses, districtCenter]);

    const defaultCenter = React.useMemo(() => {
        return dynamicCentroid || districtCenter || { lat: 21.4934, lng: 86.9294 };
    }, [dynamicCentroid, districtCenter]);

    const isUserLocationValidForDistrict = React.useMemo(() => {
        if (!userLocation?.lat || !userLocation?.lng || !districtCenter) return false;
        return getDistanceKm(userLocation.lat, userLocation.lng, districtCenter.lat, districtCenter.lng) < 40;
    }, [userLocation, districtCenter]);

    const [mapCenter, setMapCenter] = useState(() => {
        if (isUserLocationValidForDistrict && userLocation?.lat && userLocation?.lng) {
            return { lat: userLocation.lat, lng: userLocation.lng };
        }
        return defaultCenter;
    });

    // Automatically center map on dynamic centroid once messes load (placing map at the highest purple pin density area)
    useEffect(() => {
        if (!isUserLocationValidForDistrict) {
            if (dynamicCentroid) {
                setMapCenter(dynamicCentroid);
            } else if (districtCenter) {
                setMapCenter(districtCenter);
            }
        }
    }, [dynamicCentroid, districtCenter, isUserLocationValidForDistrict]);
    const [showFullMap, setShowFullMap] = useState(false);
    const [selectedMess, setSelectedMess] = useState(null);
    const [currentZoom, setCurrentZoom] = useState(15);
    const carouselRef = useRef(null);
    const [localUserLocation, setLocalUserLocation] = useState(userLocation);
    const [isLocating, setIsLocating] = useState(false);
    const [explorerFilters, setExplorerFilters] = useState({
        messType: '',
        amenities: { wifi: false, ac: false, food: false }
    });

    useEffect(() => {
        setLocalUserLocation(userLocation);
    }, [userLocation]);

    // Callbacks passed down to the MapSearchBar child component
    const handleMessClickFromSearch = useCallback((mess) => {
        setSelectedMess(mess);
        setMapCenter({ lat: mess.latitude, lng: mess.longitude });
        setCurrentZoom(17);
    }, []);

    const handleLocationClickFromSearch = useCallback((prediction) => {
        if (window.google) {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ placeId: prediction.place_id }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    const location = results[0].geometry.location;
                    setMapCenter({ lat: location.lat(), lng: location.lng() });
                    setCurrentZoom(16);
                }
            });
        }
    }, []);

    const handleClearSearch = useCallback(() => {
        const originalCenter = isUserLocationValidForDistrict && userLocation?.lat && userLocation?.lng
            ? { lat: userLocation.lat, lng: userLocation.lng }
            : defaultCenter;
        setMapCenter(originalCenter);
        setCurrentZoom(15);
        setSelectedMess(null);
    }, [isUserLocationValidForDistrict, userLocation, defaultCenter]);


    // Filter messes based on explorer-specific filters
    const filteredMesses = React.useMemo(() => {
        return validMesses.filter(mess => {
            if (explorerFilters.messType && explorerFilters.messType !== '') {
                const selectedType = explorerFilters.messType.toLowerCase();
                if (Array.isArray(mess.messType)) {
                    const hasMatch = mess.messType.some(t => t && t.toLowerCase() === selectedType);
                    if (!hasMatch) return false;
                } else {
                    const currentType = (mess.messType || '').toLowerCase();
                    if (currentType !== selectedType) return false;
                }
            }

            const checkAmenity = (key) => {
                if (mess.amenities && mess.amenities[key] !== undefined) return mess.amenities[key];
                if (!mess.messRooms) return false;
                return mess.messRooms.some(r => {
                    const rAm = r.amenities || r;
                    return rAm[key] === true;
                });
            };

            if (explorerFilters.amenities.food && !checkAmenity('food')) return false;
            if (explorerFilters.amenities.wifi && !checkAmenity('wifi')) return false;
            if (explorerFilters.amenities.ac && !checkAmenity('ac')) return false;

            return true;
        });
    }, [validMesses, explorerFilters]);

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return (R * c).toFixed(1);
    };

    const handleMarkerClick = (mess) => {
        setSelectedMess(mess);
        if (carouselRef.current) {
            const cardElement = carouselRef.current.querySelector(`[data-mess-id="${mess.id}"]`);
            if (cardElement) {
                cardElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
        trackMessExplorer('marker_clicked', mess.id);
    };

    useEffect(() => {
        if (selectedMess) {
            setMapCenter({ lat: selectedMess.latitude, lng: selectedMess.longitude });
        }
    }, [selectedMess]);

    const handleViewDetails = (messId, mess) => {
        trackMessExplorer('view_details', messId);
        navigate(`/mess/${toMessSlug(mess?.name || '', messId)}`);
        onClose();
    };

    const handleCloseMap = () => {
        window.history.back();
    };

    useEffect(() => {
        const handlePopState = (event) => {
            if (!event.state?.messExplorerOpen) {
                onClose();
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [onClose]);

    return (
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['places']}>
            <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm">
                <div className="absolute inset-0 bg-white flex flex-col">
                    {/* Map (Full-Bleed) */}
                    <div className="flex-1 relative bg-gray-50">
                        {/* Top Floating Header Controls */}
                        <div className="absolute top-0 left-0 right-0 z-20 px-3 sm:px-5 pt-4 sm:pt-6 pointer-events-none flex items-start gap-3 justify-between">
                            <button
                                onClick={handleCloseMap}
                                className="pointer-events-auto flex items-center justify-center bg-white/90 backdrop-blur-md w-11 h-11 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.35)] border border-white/60 hover:bg-white transition-all active:scale-95 shrink-0"
                                aria-label="Back to Home"
                            >
                                <ChevronLeft size={24} className="text-gray-800 pr-0.5" strokeWidth={2.5} />
                            </button>

                            {/* Search Bar – rendered inside APIProvider so useMapsLibrary() works */}
                            <MapSearchBar
                                mapCenter={mapCenter}
                                validMesses={validMesses}
                                onMessClick={handleMessClickFromSearch}
                                onLocationClick={handleLocationClickFromSearch}
                                onClear={handleClearSearch}
                            />

                            <button
                                onClick={() => setShowFullMap(!showFullMap)}
                                className="pointer-events-auto flex items-center gap-2 bg-white/85 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.35)] border border-white/60 hover:bg-white text-brand-primary font-bold text-xs sm:text-sm transition-all active:scale-95 shrink-0"
                            >
                                <span>{showFullMap ? 'Mess View' : 'Full Map'}</span>
                            </button>
                        </div>

                    {/* Floating Filter Chips */}
                    <div className="absolute top-20 sm:top-24 left-0 right-0 z-10 px-3 sm:px-5 pointer-events-none">
                        <div className="flex gap-2 overflow-x-auto hide-scrollbar pointer-events-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            {['All', 'Boys', 'Girls'].map((type) => {
                                const isActive = (explorerFilters.messType || 'All') === type;
                                return (
                                    <button
                                        key={type}
                                        onClick={() => setExplorerFilters({ ...explorerFilters, messType: type === 'All' ? '' : type })}
                                        className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all shadow-[0_4px_10px_rgba(0,0,0,0.25)] ${
                                            isActive 
                                                ? 'bg-brand-primary text-white border-2 border-brand-primary' 
                                                : 'bg-white/95 backdrop-blur text-gray-700 border border-gray-200 hover:bg-gray-50'
                                        }`}
                                    >
                                        {type}
                                    </button>
                                )
                            })}
                            <div className="w-px h-6 bg-gray-400/50 my-auto shrink-0 mx-1"></div>
                            {['wifi', 'ac', 'food'].map((amenity) => {
                                const isActive = explorerFilters.amenities[amenity];
                                const labels = { wifi: 'Wi-Fi', ac: 'AC', food: 'Food' };
                                return (
                                    <button
                                        key={amenity}
                                        onClick={() => setExplorerFilters({ 
                                            ...explorerFilters, 
                                            amenities: { ...explorerFilters.amenities, [amenity]: !isActive } 
                                        })}
                                        className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all shadow-[0_4px_10px_rgba(0,0,0,0.25)] ${
                                            isActive 
                                                ? 'bg-brand-accent-green text-white border-2 border-green-600' 
                                                : 'bg-white/95 backdrop-blur text-gray-700 border border-gray-200 hover:bg-gray-50'
                                        }`}
                                    >
                                        {labels[amenity]}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* SVG Definitions for Premium Map Pin */}
                    <svg width="0" height="0" className="absolute pointer-events-none">
                        <defs>
                            <linearGradient id="premium-purple" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#d8b4fe" />
                                <stop offset="40%" stopColor="#a855f7" />
                                <stop offset="100%" stopColor="#7e22ce" />
                            </linearGradient>
                        </defs>
                    </svg>

                    <Map
                        defaultCenter={mapCenter}
                        defaultZoom={currentZoom}
                        mapId="mess-explorer"
                        gestureHandling="greedy"
                        style={{ width: '100%', height: '100%' }}
                        disableDefaultUI={true}
                        streetViewControl={false}
                        mapTypeControl={false}
                        fullscreenControl={false}
                    >
                        <MapCameraHandler center={mapCenter} zoom={currentZoom} />
                        <MapMarkers
                            filteredMesses={filteredMesses}
                            selectedMess={selectedMess}
                            handleMarkerClick={handleMarkerClick}
                            localUserLocation={localUserLocation}
                        />
                    </Map>

                    {/* Recenter Button */}
                    <div 
                        className={`absolute right-4 sm:right-6 z-10 pointer-events-auto transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                            showFullMap ? 'bottom-10 sm:bottom-12' : 'bottom-[160px] sm:bottom-[180px]'
                        }`}
                    >
                        <button
                            onClick={() => {
                                if (userLocation?.lat && userLocation?.lng) {
                                    setMapCenter({ lat: userLocation.lat, lng: userLocation.lng });
                                    setCurrentZoom(15);
                                    return;
                                }
                                if (!navigator.geolocation) {
                                    alert("Your browser doesn't support location services.");
                                    setMapCenter(defaultCenter);
                                    setCurrentZoom(15);
                                    return;
                                }
                                setIsLocating(true);
                                navigator.geolocation.getCurrentPosition(
                                    (position) => {
                                        setIsLocating(false);
                                        let { latitude, longitude } = position.coords;
                                        if (latitude > 19.8 && latitude < 20.9) {
                                            latitude = defaultCenter.lat;
                                            longitude = defaultCenter.lng;
                                        }
                                        setLocalUserLocation({ lat: latitude, lng: longitude });
                                        setMapCenter({ lat: latitude, lng: longitude });
                                        setCurrentZoom(15);
                                    },
                                    (error) => {
                                        setIsLocating(false);
                                        console.error("GPS error:", error);
                                        if (localUserLocation?.lat && localUserLocation?.lng) {
                                            setMapCenter({ lat: localUserLocation.lat, lng: localUserLocation.lng });
                                        } else {
                                            setMapCenter(defaultCenter);
                                            alert("Unable to get your live location. Centered to default.");
                                        }
                                        setCurrentZoom(15);
                                    },
                                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
                                );
                            }}
                            disabled={isLocating}
                            className="bg-white p-3 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.45)] transition-all text-purple-600 border border-gray-100 disabled:opacity-80 disabled:cursor-not-allowed hover:bg-gray-50 active:scale-95"
                            aria-label="Recenter to my location"
                            title="Fetch live location and Recenter map"
                        >
                            {isLocating ? (
                                <Loader2 size={24} className="animate-spin text-purple-600" />
                            ) : (
                                <Navigation size={24} className="fill-purple-600 stroke-purple-600" />
                            )}
                        </button>
                    </div>

                    {/* Bottom Carousel */}
                    <div 
                        className={`absolute inset-x-0 bottom-4 sm:bottom-6 z-10 pointer-events-none transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                            showFullMap ? 'translate-y-[150%]' : 'translate-y-0'
                        }`}
                    >
                        <div 
                            className="flex gap-4 overflow-x-auto px-4 sm:px-6 pb-2 snap-x snap-mandatory pointer-events-auto scroll-smooth hide-scrollbar pt-4" 
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch', willChange: 'transform' }}
                            ref={carouselRef}
                        >
                            {filteredMesses.map((mess) => {
                                const isSelected = selectedMess?.id === mess.id;
                                return (
                                    <div 
                                        key={mess.id} 
                                        data-mess-id={mess.id}
                                        className={`snap-center shrink-0 w-[90%] sm:w-[360px] md:w-[400px] rounded-2xl p-3 sm:p-4 flex gap-3 sm:gap-4 items-center transition-all duration-300 ${
                                            isSelected 
                                                ? 'bg-gradient-to-r from-[#10B981] to-[#6EE7B7] shadow-[0_12px_40px_rgba(16,185,129,0.4)] ring-2 ring-white/60 scale-[1.02]' 
                                                : 'bg-white border border-gray-100 shadow-md hover:shadow-lg'
                                        }`}
                                        style={{ willChange: 'transform, opacity' }}
                                        onClick={() => setSelectedMess(mess)}
                                    >
                                        {/* Mess Photo Thumbnail */}
                                        <div className="w-20 sm:w-24 h-20 sm:h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 relative shadow-inner">
                                            {mess.posterUrl ? (
                                                <img
                                                    src={mess.posterUrl}
                                                    alt={mess.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.parentElement.classList.add('flex', 'items-center', 'justify-center');
                                                        e.target.parentElement.innerHTML = '<span class="text-3xl">🏡</span>';
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-brand-primary">
                                                    <span className="text-3xl">🏡</span>
                                                </div>
                                            )}
                                            {(() => {
                                                const isBoys = Array.isArray(mess.messType) ? mess.messType.includes('Boys') : mess.messType === 'Boys';
                                                const isGirls = Array.isArray(mess.messType) ? mess.messType.includes('Girls') : mess.messType === 'Girls';
                                                return (
                                                    <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded shadow-sm text-[9px] font-extrabold uppercase tracking-wide" style={{
                                                        backgroundColor: isBoys ? '#DBEAFE' : isGirls ? '#FCE7F3' : '#E0E7FF',
                                                        color: isBoys ? '#1E40AF' : isGirls ? '#BE185D' : '#4338CA'
                                                    }}>
                                                        {Array.isArray(mess.messType) ? mess.messType.join(' & ') : mess.messType}
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        {/* Mess Info & Actions */}
                                        <div className="flex-1 min-w-0 py-0.5 flex flex-col justify-between h-full">
                                            <div className="mb-2">
                                                <h3 className={`font-extrabold text-sm sm:text-base leading-tight truncate ${isSelected ? 'text-white drop-shadow-md' : 'text-gray-900'}`}>
                                                    {mess.name}
                                                </h3>
                                                <div className={`text-[10px] sm:text-[11px] font-semibold truncate mt-0.5 ${isSelected ? 'text-white/90' : 'text-gray-500'}`}>
                                                    {mess.address || 'Address not listed'}
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1.5 mt-auto">
                                                {localUserLocation?.lat && localUserLocation?.lng && (
                                                    <span className={`text-[10px] sm:text-xs font-bold flex items-center gap-1 w-fit px-1.5 py-0.5 rounded ${
                                                        isSelected ? 'text-white/95 bg-black/10 backdrop-blur-sm shadow-sm border border-white/20' : 'text-green-700 bg-green-50'
                                                    }`}>
                                                        <MapPin size={10} className={isSelected ? 'text-white sm:w-3 sm:h-3' : 'text-green-600 sm:w-3 sm:h-3'} />
                                                        {calculateDistance(localUserLocation.lat, localUserLocation.lng, mess.latitude, mess.longitude)} km away
                                                    </span>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleViewDetails(mess.id, mess);
                                                    }}
                                                    className={`w-full py-1.5 sm:py-2 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all
                                                        ${isSelected 
                                                            ? 'bg-white text-[#059669] shadow-lg hover:bg-gray-50 active:scale-95' 
                                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }
                                                    `}
                                                >
                                                    View Details
                                                    <ExternalLink size={12} className="sm:w-3.5 sm:h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </APIProvider>
    );
};

export default MessExplorerMap;
