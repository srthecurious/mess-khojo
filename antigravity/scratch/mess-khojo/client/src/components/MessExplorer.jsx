import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, X, ExternalLink } from 'lucide-react';
import { APIProvider, Map, Marker, InfoWindow } from '@vis.gl/react-google-maps';
import { useNavigate } from 'react-router-dom';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
console.log('🗺️ Google Maps API Key loaded:', GOOGLE_MAPS_API_KEY ? 'YES ✓' : 'NO ✗');

const MessExplorer = ({ messes, userLocation }) => {
    const navigate = useNavigate();
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [mapCenter, setMapCenter] = useState({ lat: 21.4934, lng: 86.9294 }); // Default: Baleshwar
    const [showFullMap, setShowFullMap] = useState(true); // Toggle for minimalist/full map view
    const [selectedMess, setSelectedMess] = useState(null); // Track selected marker
    const [currentZoom, setCurrentZoom] = useState(15);

    useEffect(() => {
        if (userLocation?.lat && userLocation?.lng) {
            // eslint-disable-next-line
            setMapCenter({ lat: userLocation.lat, lng: userLocation.lng });
        }
    }, [userLocation]);

    // Map styles for minimalist view (hides everything except mess markers)
    const minimalistMapStyles = [
        { elementType: "labels", stylers: [{ visibility: "off" }] },
        { elementType: "geometry", stylers: [{ visibility: "simplified" }] },
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "road", elementType: "labels", stylers: [{ visibility: "off" }] },
        { featureType: "transit", stylers: [{ visibility: "off" }] }
    ];

    // Filter messes with valid coordinates
    const validMesses = messes.filter(
        mess => mess.latitude && mess.longitude &&
            !isNaN(mess.latitude) && !isNaN(mess.longitude)
    );

    // Calculate distance between two coordinates
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Radius of the earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return distance.toFixed(1);
    };

    // Handle marker click
    const handleMarkerClick = (mess) => {
        setSelectedMess(mess);
    };

    // Handle view details
    const handleViewDetails = (messId) => {
        navigate(`/mess/${messId}`);
        // No need to manually setIsMapOpen(false) here if we navigate away, 
        // effectively unmounting or changing history anyway.
        // But to be clean, if we are in a 'pushed' state for the map, we might want to replace it?
        // Actually, normal navigation pushes a new entry. navigating back will return to map?
        // Let's keep it simple. If we navigate away, we leave the map state behind.
        setIsMapOpen(false);
    };

    // Open Map with History Push
    const handleOpenMap = () => {
        // Push state so back button works
        window.history.pushState({ ...window.history.state, messExplorerOpen: true }, "");
        setIsMapOpen(true);
    };

    // Close Map with History Back
    const handleCloseMap = () => {
        // If we are open, going back will trigger popstate which sets isMapOpen(false)
        window.history.back();
    };

    useEffect(() => {
        const handlePopState = (event) => {
            // If the new state (after popping) does NOT have messExplorerOpen, close map
            if (!event.state?.messExplorerOpen) {
                setIsMapOpen(false);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    return (
        <>
            {/* Explorer Banner */}
            <div className="px-4 sm:px-6 lg:px-8 mb-4 max-w-7xl mx-auto">
                <button
                    onClick={handleOpenMap}
                    className="w-full bg-gradient-to-r from-purple-600 via-purple-500 to-blue-500 hover:from-purple-700 hover:via-purple-600 hover:to-blue-600 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] group"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 backdrop-blur-sm p-2.5 rounded-xl group-hover:bg-white/30 transition-colors">
                                <MapPin className="text-white" size={22} />
                            </div>
                            <div className="text-left">
                                <h3 className="text-white font-bold text-base sm:text-lg">
                                    Mess Explorer
                                </h3>
                                <p className="text-white/80 text-xs sm:text-sm">
                                    View {validMesses.length} messes near you
                                </p>
                            </div>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg group-hover:bg-white/30 transition-colors">
                            <Navigation className="text-white" size={18} />
                        </div>
                    </div>
                </button>
            </div>

            {/* Full-Screen Map Modal */}
            {isMapOpen && (
                <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm">
                    <div className="absolute inset-0 bg-white flex flex-col">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-purple-600 to-blue-500 p-4 flex items-center justify-between shadow-lg">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-2 rounded-lg">
                                    <MapPin className="text-white" size={20} />
                                </div>
                                <h2 className="text-white font-bold text-lg">
                                    Mess Explorer
                                </h2>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* Toggle Button */}
                                <button
                                    onClick={() => setShowFullMap(!showFullMap)}
                                    className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-colors text-white text-sm font-semibold"
                                >
                                    {showFullMap ? 'Mess View' : 'Full Map'}
                                </button>
                                {/* Close Button */}
                                <button
                                    onClick={handleCloseMap}
                                    className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
                                >
                                    <X className="text-white" size={20} />
                                </button>
                            </div>
                        </div>





                        {/* Map */}
                        <div className="flex-1 relative">
                            <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                                <Map
                                    defaultCenter={mapCenter}
                                    defaultZoom={15}
                                    gestureHandling="greedy"
                                    styles={showFullMap ? [] : minimalistMapStyles}
                                    style={{ width: '100%', height: '100%' }}
                                    onZoomChanged={(ev) => setCurrentZoom(ev.detail.zoom)}
                                >
                                    {/* User Location Marker */}
                                    {userLocation?.lat && userLocation?.lng && (
                                        <Marker
                                            position={{ lat: userLocation.lat, lng: userLocation.lng }}
                                            title="Your Location"
                                            icon="http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                                        />
                                    )}

                                    {/* Mess Markers */}
                                    {validMesses.map((mess) => (
                                        <Marker
                                            key={mess.id}
                                            position={{ lat: mess.latitude, lng: mess.longitude }}
                                            onClick={() => handleMarkerClick(mess)}
                                            icon="http://maps.google.com/mapfiles/ms/icons/red-dot.png"
                                            label={!showFullMap && currentZoom >= 16 ? {
                                                text: mess.name,
                                                color: '#1F2937', // brand-text-dark
                                                fontWeight: '600',
                                                fontSize: '11px',
                                                className: 'map-label bg-white px-1 rounded shadow-sm border border-gray-200'
                                            } : null}
                                        />
                                    ))}
                                    {/* InfoWindow Popup */}
                                    {selectedMess && (
                                        <InfoWindow
                                            position={{ lat: selectedMess.latitude, lng: selectedMess.longitude }}
                                            onCloseClick={() => setSelectedMess(null)}
                                        >
                                            <div className="min-w-[280px] max-w-[320px]">
                                                {/* Mess Photo */}
                                                <div className="w-full h-32 mb-3 rounded-lg overflow-hidden bg-gray-100 relative">
                                                    {selectedMess.posterUrl ? (
                                                        <img
                                                            src={selectedMess.posterUrl}
                                                            alt={selectedMess.name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                e.target.parentElement.classList.add('flex', 'items-center', 'justify-center');
                                                                e.target.parentElement.innerHTML = '<span class="text-2xl">🏡</span>';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gray-200 text-brand-primary">
                                                            <span className="text-3xl">🏡</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Mess Info */}
                                                <div className="space-y-2">
                                                    {/* Name and Type Badge */}
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h3 className="font-bold text-gray-900 text-base leading-tight flex-1">
                                                            {selectedMess.name}
                                                        </h3>
                                                        <span className="px-2 py-1 rounded-md text-xs font-semibold whitespace-nowrap" style={{
                                                            backgroundColor: selectedMess.messType === 'Boys' ? '#DBEAFE' : selectedMess.messType === 'Girls' ? '#FCE7F3' : '#E0E7FF',
                                                            color: selectedMess.messType === 'Boys' ? '#1E40AF' : selectedMess.messType === 'Girls' ? '#BE185D' : '#4338CA'
                                                        }}>
                                                            {selectedMess.messType}
                                                        </span>
                                                    </div>

                                                    {/* Distance */}
                                                    {userLocation?.lat && userLocation?.lng && (
                                                        <div className="flex items-center gap-1 text-sm text-gray-600">
                                                            <span>📍</span>
                                                            <span>
                                                                {calculateDistance(
                                                                    userLocation.lat,
                                                                    userLocation.lng,
                                                                    selectedMess.latitude,
                                                                    selectedMess.longitude
                                                                )} km away
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* View Details Button */}
                                                    <button
                                                        onClick={() => handleViewDetails(selectedMess.id)}
                                                        className="w-full mt-3 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
                                                    >
                                                        View Details
                                                        <ExternalLink size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </InfoWindow>
                                    )}
                                </Map>
                            </APIProvider>
                        </div>

                        {/* Info Footer */}
                        <div className="bg-gray-50 p-3 border-t border-gray-200">
                            <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                                        <span className="text-gray-600">Messes ({validMesses.length})</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                        <span className="text-gray-600">Your Location</span>
                                    </div>
                                </div>
                                <span className="text-gray-500 text-xs">Tap markers for details</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default MessExplorer;
