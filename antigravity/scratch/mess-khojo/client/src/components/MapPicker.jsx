import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon missing in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const LocationMarker = ({ position, setPosition }) => {
    const map = useMapEvents({
        click(e) {
            setPosition(e.latlng);
            map.flyTo(e.latlng, map.getZoom());
        },
    });

    return position === null ? null : (
        <Marker position={position}></Marker>
    );
};

const MapPicker = ({ onConfirm, onCancel, initialLocation }) => {
    // Default to Balasore (User's request context) instead of Bhopal
    const defaultCenter = initialLocation
        ? [initialLocation.lat, initialLocation.lng]
        : [21.4925, 86.9147];

    const [position, setPosition] = useState(initialLocation ? { lat: initialLocation.lat, lng: initialLocation.lng } : null);

    return (
        <div className="h-full w-full flex flex-col bg-white">
            <div className="flex-1 relative z-0">
                <MapContainer
                    center={defaultCenter}
                    zoom={13}
                    style={{ height: '400px', width: '100%', zIndex: 0 }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker position={position} setPosition={setPosition} />
                </MapContainer>

                {/* Floating Instructions */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg z-[1000] text-sm font-medium text-gray-700 pointer-events-none">
                    Tap anywhere to set location
                </div>
            </div>

            <div className="p-4 bg-white border-t border-gray-100 flex gap-3">
                <button
                    onClick={onCancel}
                    className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={() => position && onConfirm(position)}
                    disabled={!position}
                    className="flex-1 py-3 px-4 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-200"
                >
                    Confirm Location
                </button>
            </div>
        </div>
    );
};

export default MapPicker;
