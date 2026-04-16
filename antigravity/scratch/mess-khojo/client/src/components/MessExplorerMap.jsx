import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, ExternalLink, Loader2, ChevronLeft } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { useNavigate } from 'react-router-dom';
import { trackMessExplorer } from '../analytics';

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

const MessExplorerMap = ({ validMesses, userLocation, onClose }) => {
    const navigate = useNavigate();
    const [mapCenter, setMapCenter] = useState(
        userLocation?.lat && userLocation?.lng
            ? { lat: userLocation.lat, lng: userLocation.lng }
            : { lat: 21.4934, lng: 86.9294 }
    );
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

    // Filter messes based on explorer-specific filters
    const filteredMesses = React.useMemo(() => {
        return validMesses.filter(mess => {
            if (explorerFilters.messType && explorerFilters.messType !== '') {
                if (mess.messType !== explorerFilters.messType) return false;
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

    const handleViewDetails = (messId) => {
        trackMessExplorer('view_details', messId);
        navigate(`/mess/${messId}`);
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
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm">
            <div className="absolute inset-0 bg-white flex flex-col">
                {/* Map (Full-Bleed) */}
                <div className="flex-1 relative bg-gray-50">
                    {/* Top Floating Header Controls */}
                    <div className="absolute top-0 left-0 right-0 z-20 px-3 sm:px-5 pt-4 sm:pt-6 pointer-events-none flex justify-between items-start">
                        <button
                            onClick={handleCloseMap}
                            className="pointer-events-auto flex items-center justify-center bg-white/90 backdrop-blur-md w-11 h-11 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.35)] border border-white/60 hover:bg-white transition-all active:scale-95"
                            aria-label="Back to Home"
                        >
                            <ChevronLeft size={24} className="text-gray-800 pr-0.5" strokeWidth={2.5} />
                        </button>
                        <button
                            onClick={() => setShowFullMap(!showFullMap)}
                            className="pointer-events-auto flex items-center gap-2 bg-white/85 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.35)] border border-white/60 hover:bg-white text-brand-primary font-bold text-xs sm:text-sm transition-all active:scale-95"
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

                    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
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
                                                    fill="url(#premium-purple)"
                                                />
                                            </div>
                                        )}
                                    </AdvancedMarker>
                                );
                            })}
                        </Map>
                    </APIProvider>

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
                                    setMapCenter({ lat: 21.4934, lng: 86.9294 });
                                    setCurrentZoom(15);
                                    return;
                                }
                                setIsLocating(true);
                                navigator.geolocation.getCurrentPosition(
                                    (position) => {
                                        setIsLocating(false);
                                        let { latitude, longitude } = position.coords;
                                        if (latitude > 19.8 && latitude < 20.9) {
                                            latitude = 21.4934;
                                            longitude = 86.9294;
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
                                            setMapCenter({ lat: 21.4934, lng: 86.9294 });
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
                                            <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded shadow-sm text-[9px] font-extrabold uppercase tracking-wide" style={{
                                                backgroundColor: mess.messType === 'Boys' ? '#DBEAFE' : mess.messType === 'Girls' ? '#FCE7F3' : '#E0E7FF',
                                                color: mess.messType === 'Boys' ? '#1E40AF' : mess.messType === 'Girls' ? '#BE185D' : '#4338CA'
                                            }}>
                                                {mess.messType}
                                            </div>
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
                                                        handleViewDetails(mess.id);
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
    );
};

export default MessExplorerMap;
