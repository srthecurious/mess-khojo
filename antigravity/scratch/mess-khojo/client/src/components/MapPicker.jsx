import React, { useState, useCallback, useEffect, useRef } from 'react';
import { APIProvider, Map, Marker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Search, MapPin, Navigation, Crosshair } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Search Component using Google Places Autocomplete
const MapSearch = ({ onPlaceSelect }) => {
    const map = useMap();
    const placesLibrary = useMapsLibrary('places');
    const inputRef = useRef(null);

    useEffect(() => {
        if (!placesLibrary || !inputRef.current) return;

        const autocomplete = new placesLibrary.Autocomplete(inputRef.current, {
            fields: ['geometry', 'formatted_address', 'name'],
        });

        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place.geometry && place.geometry.location) {
                if (onPlaceSelect) {
                    onPlaceSelect(place);
                }

                // Pan map to location
                if (map) {
                    if (place.geometry.viewport) {
                        map.fitBounds(place.geometry.viewport);
                    } else {
                        map.setCenter(place.geometry.location);
                        map.setZoom(17);
                    }
                }
            }
        });

        // Cleanup
        return () => {
            if (window.google) {
                window.google.maps.event.clearInstanceListeners(autocomplete);
            }
        };

    }, [placesLibrary, map, onPlaceSelect]);

    return (
        <div className="absolute top-4 left-4 right-4 z-[1000]">
            <div className="relative shadow-xl rounded-xl overflow-hidden">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search city, area, or landmark..."
                    className="w-full pl-12 pr-4 py-4 bg-white text-gray-800 focus:outline-none font-medium text-base"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-600">
                    <Search size={20} />
                </div>
            </div>
        </div>
    );
};

const MapPicker = ({ onConfirm, onCancel, initialLocation }) => {
    // Default to Baleshwar/Balasore, Odisha coordinates
    const defaultCenter = initialLocation
        ? { lat: initialLocation.lat, lng: initialLocation.lng }
        : { lat: 21.4934, lng: 86.9294 }; // Baleshwar, Odisha

    const [position, setPosition] = useState(defaultCenter);
    const [addressName, setAddressName] = useState(initialLocation?.address || '');
    const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

    // Handle map click to place marker (Tap to Select)
    const handleMapClick = useCallback(async (event) => {
        if (!event.detail || !event.detail.latLng) return;

        const newPos = {
            lat: event.detail.latLng.lat,
            lng: event.detail.latLng.lng
        };
        setPosition(newPos);
        fetchAddress(newPos);
    }, []);

    // Reverse geocode helper
    const fetchAddress = async (pos) => {
        setIsReverseGeocoding(true);
        try {
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${pos.lat},${pos.lng}&key=${GOOGLE_MAPS_API_KEY}`
            );
            const data = await response.json();
            if (data.results && data.results[0]) {
                const formatted = data.results[0].formatted_address;
                // Try to keep it somewhat short if possible, or just use formatted
                setAddressName(formatted);
            } else {
                setAddressName("Pinned Location");
            }
        } catch (err) {
            console.error("Reverse geocode error:", err);
            setAddressName("Pinned Location");
        } finally {
            setIsReverseGeocoding(false);
        }
    };

    // Handle selection from Autocomplete
    const handlePlaceSelect = (place) => {
        const newPos = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
        };
        setPosition(newPos);
        setAddressName(place.formatted_address || place.name);
    };

    return (
        <div className="h-full w-full flex flex-col bg-white relative">
            <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>

                <MapSearch onPlaceSelect={handlePlaceSelect} />

                {/* Google Map */}
                <div className="flex-1 relative z-0">
                    <Map
                        defaultCenter={defaultCenter}
                        defaultZoom={15}
                        gestureHandling="greedy"
                        onClick={handleMapClick}
                        disableDefaultUI={true}
                        options={{
                            zoomControl: false,
                            streetViewControl: false,
                            mapTypeControl: false,
                            fullscreenControl: false,
                        }}
                        style={{ width: '100%', height: '100%' }}
                    >
                        {position && (
                            <Marker
                                position={position}
                                animation={window.google?.maps?.Animation?.DROP}
                            />
                        )}
                    </Map>

                    {/* Center Target Indicator (Optional visual guide, removed for cleaner marker-only interaction requested) */}

                    {/* Bottom Action Sheet */}
                    <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.1)] p-5 animate-slide-up">
                        <div className="flex flex-col gap-4">
                            {/* Selected Location Info */}
                            <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div className="mt-1 bg-purple-100 p-2 rounded-full text-purple-600">
                                    <MapPin size={20} className="fill-current" />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Selected Location</p>
                                    <p className="font-medium text-gray-800 text-sm sm:text-base truncate">
                                        {isReverseGeocoding ? "Fetching address..." : addressName || "Tap map to select location"}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1 font-mono">
                                        {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={onCancel}
                                    className="flex-1 py-3.5 px-4 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => onConfirm({ ...position, address: addressName || "Pinned Location" })}
                                    className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold shadow-lg shadow-purple-200 hover:shadow-xl hover:scale-[1.02] transition-all"
                                >
                                    Confirm Location
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </APIProvider>
        </div>
    );
};

export default MapPicker;
