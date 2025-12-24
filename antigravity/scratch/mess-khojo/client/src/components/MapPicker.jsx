import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Search } from 'lucide-react';
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

const LocationMarker = ({ position, setPosition, setAddressName }) => {
    const map = useMapEvents({
        async click(e) {
            console.log("Map clicked:", e.latlng);
            const newPos = { lat: e.latlng.lat, lng: e.latlng.lng };
            setPosition(newPos);
            map.flyTo(e.latlng, map.getZoom());

            // Reverse geocode to get a readable name
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${newPos.lat}&lon=${newPos.lng}`);
                const data = await res.json();
                if (data && data.display_name) {
                    const parts = data.display_name.split(',');
                    const shortName = parts.length > 0 ? parts[0].trim() + (parts[1] ? `, ${parts[1].trim()}` : '') : 'Pinned Location';
                    setAddressName(shortName);
                }
            } catch (err) {
                console.error("Reverse geocode error:", err);
            }
        },
    });

    return position === null ? null : (
        <Marker position={position}></Marker>
    );
};

const MapPicker = ({ onConfirm, onCancel, initialLocation }) => {
    // Default to Baleshwar/Balasore, Odisha coordinates
    const defaultCenter = initialLocation
        ? [initialLocation.lat, initialLocation.lng]
        : [21.4934, 86.9294]; // Baleshwar, Odisha

    const [position, setPosition] = useState(initialLocation ? { lat: initialLocation.lat, lng: initialLocation.lng } : { lat: defaultCenter[0], lng: defaultCenter[1] });
    const [addressName, setAddressName] = useState(initialLocation?.address || '');

    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [mapInstance, setMapInstance] = useState(null);

    // Component to handle map center updates
    const RecenterMap = ({ center }) => {
        const map = useMapEvents({});
        useEffect(() => {
            // setMapInstance(map); // Removed to avoid conflict with ref
            map.flyTo(center, map.getZoom());
        }, [center, map]);
        return null;
    };

    // Component to invalidate map size on mount/resize
    const MapInvalidator = () => {
        const map = useMapEvents({});
        useEffect(() => {
            map.invalidateSize();
        }, [map]);
        return null;
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setSearching(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();

            if (data && data.length > 0) {
                const { lat, lon, display_name } = data[0];
                const newPos = { lat: parseFloat(lat), lng: parseFloat(lon) };
                const shortName = display_name.split(',')[0];

                setPosition(newPos);
                setAddressName(shortName);
                if (mapInstance) {
                    mapInstance.flyTo([newPos.lat, newPos.lng], 13);
                }
            } else {
                alert("Location not found");
            }
        } catch (error) {
            console.error("Search error:", error);
            alert("Error searching location");
        } finally {
            setSearching(false);
        }
    };

    return (
        <div className="h-full w-full flex flex-col bg-white relative">
            {/* Search Bar Overlay */}
            <div className="absolute top-4 left-4 right-4 z-[1000] flex gap-2">
                <form onSubmit={handleSearch} className="flex-1 flex gap-2 relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search city, area..."
                        className="w-full pl-4 pr-10 py-3 rounded-xl shadow-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#7226FF] bg-white/95 backdrop-blur-sm"
                    />
                    <button
                        type="submit"
                        disabled={searching}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#7226FF] text-white rounded-lg hover:bg-[#6020D0] disabled:opacity-50"
                    >
                        {searching ? <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent" /> : <Search size={16} />}
                    </button>
                </form>
            </div>

            <div className="flex-1 relative z-0">
                <MapContainer
                    center={defaultCenter}
                    zoom={13}
                    style={{ height: '100%', width: '100%', zIndex: 0 }}
                    ref={setMapInstance}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapInvalidator />
                    <RecenterMap center={defaultCenter} />
                    <LocationMarker position={position} setPosition={setPosition} setAddressName={setAddressName} />
                </MapContainer>

                <div className="p-4 bg-white border-t border-gray-100 flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => position && onConfirm({ ...position, address: addressName || "Pinned Location" })}
                        className="flex-1 py-3 px-4 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200"
                    >
                        Confirm Location
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MapPicker;
