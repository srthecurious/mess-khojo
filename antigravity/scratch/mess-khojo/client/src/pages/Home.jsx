import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, getDocs, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import MessCard from '../components/MessCard';
import FilterBar from '../components/FilterBar';
import Header from '../components/Header'; // Import new Header
import { Search, MapPin, Home as HomeIcon } from 'lucide-react';
import { motion } from 'framer-motion';

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
        maxDistance: ''
    });
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);


    // Location & Distance Logic
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

    const deg2rad = (deg) => {
        return deg * (Math.PI / 180);
    };

    const handleLocationSelect = (coords) => {
        if (coords) {
            // Coordinate object provided (from MapPicker)
            console.log("Setting manual location from Map:", coords);
            setUserLocation({
                lat: coords.lat,
                lng: coords.lng,
                address: coords.address || "Pinned Location"
            });
            setFilters(prev => ({ ...prev, location: '' }));
            return;
        }

        // GPS Logic with Retry
        if (navigator.geolocation) {
            const successCallback = (position) => {
                let { latitude, longitude } = position.coords;
                console.log("GPS Location detected:", latitude, longitude);

                // AUTO-CORRECT: If GPS places user in Bhubaneswar/Cuttack region (Lat ~19.8 - 20.8), override to Baleshwar center
                // This ensures testers in the capital see meaningful Baleshwar distances
                if (latitude > 19.8 && latitude < 20.9) {
                    console.log("Auto-correcting Bhubaneswar/Cuttack location to Baleshwar center (21.4934, 86.9294)");
                    latitude = 21.4934;
                    longitude = 86.9294;
                }

                setUserLocation({
                    lat: latitude,
                    lng: longitude,
                    address: "Your Location"
                });
                setFilters(prev => ({ ...prev, location: '' }));
            };

            const errorCallback = (error, isRetry = false) => {
                console.warn(`Geolocation error (${isRetry ? 'Low' : 'High'} Accuracy):`, error);

                // If High Accuracy failed, try Low Accuracy once
                if (!isRetry) {
                    console.log("Retrying with low accuracy...");
                    navigator.geolocation.getCurrentPosition(
                        successCallback,
                        (finalError) => errorCallback(finalError, true),
                        { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
                    );
                    return;
                }

                // Final Failure Handling
                let errorMessage = "Unable to retrieve your location. ";
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage += "Please allow location access in settings.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage += "Location unavailable. Try the map.";
                        break;
                    case error.TIMEOUT:
                        errorMessage += "Request timed out. Try the map.";
                        break;
                    default:
                        errorMessage += "Please use 'Select on Map'.";
                }
                alert(errorMessage);
            };

            // 1. Try High Accuracy first
            navigator.geolocation.getCurrentPosition(
                successCallback,
                (err) => errorCallback(err, false),
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
            );

        } else {
            alert("Geolocation not supported. Please use the map.");
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
        });

        // Fetch Rooms
        const unsubscribeRooms = onSnapshot(collection(db, "rooms"), (snapshot) => {
            const roomsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRooms(roomsData);
            setLoading(false);
        });

        return () => {
            unsubscribeMesses();
            unsubscribeRooms();
        };
    }, []);

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
    };

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

            // 1. Location Filter (Mess Address/Name)
            if (filters.location) {
                const searchTerm = filters.location.toLowerCase();
                const matchesName = (mess.name || '').toLowerCase().includes(searchTerm);
                const matchesAddress = (mess.address || '').toLowerCase().includes(searchTerm);
                if (!matchesName && !matchesAddress) return null;
            }

            // 2. Mess Type Filter (Gender)
            if (filters.messType && filters.messType !== '') {
                if (mess.messType !== filters.messType) return null;
            }

            // 3. Max Distance Filter
            if (filters.maxDistance && filters.maxDistance !== '') {
                const maxDist = Number(filters.maxDistance);
                if (distance === null || distance > maxDist) return null;
            }

            // Get rooms for this mess
            const messRooms = rooms.filter(room => room.messId === mess.id);

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
                isFiltered
            };
        }).filter(Boolean); // Remove nulls

        // Sort by Distance if userLocation exists (Default Sort)
        if (userLocation) {
            result.sort((a, b) => {
                const distA = (typeof a.distance === 'number') ? a.distance : Infinity;
                const distB = (typeof b.distance === 'number') ? b.distance : Infinity;
                return distA - distB;
            });
        }

        return result;

    }, [messes, rooms, filters, userLocation]);

    return (
        <div className="min-h-screen bg-brand-secondary font-sans text-brand-text-dark pb-20">
            {/* New Header */}
            <Header
                userLocation={userLocation}
                onLocationSelect={handleLocationSelect}
                isLocationModalOpen={isLocationModalOpen}
                setIsLocationModalOpen={setIsLocationModalOpen}
            />

            {/* Spotlight Hero Section - Full Screen */}
            <div className="px-0">
                <div
                    className="w-full h-[calc(100vh-64px-120px)] flex items-end justify-center overflow-hidden relative"
                    style={{
                        backgroundImage: 'url(/spotlight-bg.png)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center top'
                    }}
                >
                    {/* Brand gradient overlay for hero section */}
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/95 to-brand-primary/80"></div>

                    {/* Content positioned below spotlights */}
                    <div className="relative z-10 text-center px-6 pb-12 max-w-2xl">
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                            Find your comfortable <span className="text-brand-accent-green">stay</span>.
                        </h1>
                        <p className="text-white/90 font-medium mb-8 text-lg">
                            Search for the best student messes nearby.
                        </p>

                        {!userLocation && (
                            <div className="relative max-w-sm mx-auto">
                                <button
                                    onClick={() => handleLocationSelect()}
                                    className="w-full py-4 px-6 bg-brand-primary text-white font-bold rounded-2xl border-2 border-transparent hover:bg-brand-primary-hover transition-all flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <MapPin size={20} className="fill-current" />
                                    <span>Use Current Location</span>
                                </button>
                            </div>
                        )}

                        {userLocation && (
                            <div className="mt-6 flex flex-col items-center animate-fade-in-up">
                                <span className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Location Active</span>
                                <button
                                    onClick={() => setIsLocationModalOpen(true)}
                                    className="px-6 py-3 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white font-bold flex items-center gap-2 shadow-lg hover:bg-white/30 transition-all hover:scale-105 active:scale-95"
                                >
                                    <MapPin size={16} className="text-brand-accent-green" />
                                    {userLocation.address || "Using GPS Location"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Filter Section - Reduced spacing from hero */}
            <div className="pt-4">
                <FilterBar onFilterChange={handleFilterChange} />
            </div>

            {/* Mess List */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
                <div className="flex items-center justify-between mb-6 px-1">
                    <h2 className="text-2xl font-bold text-brand-text-dark">
                        {userLocation ? 'Nearest to you' : 'Explore Stays'}
                    </h2>
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
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-light-gray border-t-brand-primary"></div>
                    </div>
                ) : filteredMesses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredMesses.map((mess, index) => (
                            <MessCard key={mess.id} mess={mess} index={index} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search size={24} className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-700 mb-1">No matches found</h3>
                        <p className="text-sm text-gray-500">Try adjusting your filters.</p>
                    </div>
                )}
            </div>


        </div>
    );
};

export default Home;
