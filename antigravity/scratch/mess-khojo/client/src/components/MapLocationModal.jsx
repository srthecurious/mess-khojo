import React, { useState, useEffect } from 'react';
import { X, MapPin, Check } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { motion, AnimatePresence } from 'framer-motion';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const MapLocationModal = ({ initialLocation, onLocationSelect, onClose }) => {
    const [selectedLocation, setSelectedLocation] = useState({
        lat: initialLocation?.lat || 21.4942, // Default to Baleshwar
        lng: initialLocation?.lng || 86.9333,
        address: initialLocation?.address || ''
    });
    const [isLoadingAddress, setIsLoadingAddress] = useState(false);

    // Reverse geocode to get address
    const reverseGeocode = async (lat, lng) => {
        setIsLoadingAddress(true);
        try {
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
            );
            const data = await response.json();
            if (data.results && data.results[0]) {
                setSelectedLocation(prev => ({
                    ...prev,
                    address: data.results[0].formatted_address
                }));
            }
        } catch (error) {
            console.error('Reverse geocoding error:', error);
        } finally {
            setIsLoadingAddress(false);
        }
    };

    // Handle map click
    const handleMapClick = (event) => {
        const lat = event.detail.latLng.lat;
        const lng = event.detail.latLng.lng;

        setSelectedLocation({
            lat,
            lng,
            address: ''
        });

        reverseGeocode(lat, lng);
    };

    const handleConfirm = () => {
        onLocationSelect(selectedLocation);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="relative bg-white rounded-3xl w-[95vw] h-[90vh] max-w-4xl shadow-2xl overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="bg-brand-primary p-4 flex justify-between items-center shrink-0">
                        <div>
                            <h2 className="text-xl font-bold text-white">Select Your Location</h2>
                            <p className="text-white/80 text-sm">Click anywhere on the map</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Map Container */}
                    <div className="flex-1 relative">
                        <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                            <Map
                                defaultCenter={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
                                defaultZoom={14}
                                mapId="map-location-selector"
                                onClick={handleMapClick}
                                gestureHandling="greedy"
                                disableDefaultUI={false}
                                style={{ width: '100%', height: '100%' }}
                            >
                                <AdvancedMarker
                                    position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
                                />
                            </Map>
                        </APIProvider>
                    </div>

                    {/* Footer with Address and Buttons */}
                    <div className="bg-white border-t border-gray-200 p-4 shrink-0">
                        <div className="mb-3">
                            <div className="flex items-start gap-2">
                                <MapPin size={20} className="text-brand-primary shrink-0 mt-1" />
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Selected Location</p>
                                    {isLoadingAddress ? (
                                        <p className="text-sm text-gray-600 animate-pulse">Loading address...</p>
                                    ) : (
                                        <p className="text-sm text-gray-800 font-medium">
                                            {selectedLocation.address || 'Click on the map to select a location'}
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">
                                        {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={!selectedLocation.address}
                                className="flex-1 py-3 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold rounded-xl transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Check size={20} />
                                Confirm Location
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default MapLocationModal;
