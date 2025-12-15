import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
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
            inverter: false,
            ac: false,
            food: false,
            waterFilter: false,
            tableChair: false
        },
        availableOnly: false
    });
    const [deferredPrompt, setDeferredPrompt] = useState(null);

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            console.log("Install prompt captured");
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            alert("App installation is not available right now. You may have already installed the app, or your browser might not support automatic installation. If you are on iOS, tap 'Share' > 'Add to Home Screen'.");
            return;
        }
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    // Location & Distance Logic
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const x1 = Number(lat1);
        const y1 = Number(lon1);
        const x2 = Number(lat2);
        const y2 = Number(lon2);

        if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) return Infinity;

        const R = 6371; // Radius of earth in km
        const dLat = deg2rad(x2 - x1);
        const dLon = deg2rad(y2 - y1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(x1)) * Math.cos(deg2rad(x2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    };

    const deg2rad = (deg) => {
        return deg * (Math.PI / 180);
    };

    const handleLocationSelect = (coords) => {
        if (coords) {
            // Coordinate object provided (from MapPicker)
            setUserLocation({
                lat: coords.lat,
                lng: coords.lng,
                address: coords.address || "Pinned Location"
            });
            // Clear manual text filter if map is used, to ensure "Nearest" logic takes precedence
            setFilters(prev => ({ ...prev, location: '' }));
            return;
        }

        // Else use browser Geolocation
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setUserLocation({
                        lat: latitude,
                        lng: longitude,
                        address: "Your Location"
                    });
                    // Clear manual text filter
                    setFilters(prev => ({ ...prev, location: '' }));
                },
                (error) => {
                    console.error("Error getting location: ", error);
                    alert("Unable to retrieve your location. Please check permissions.");
                }
            );
        } else {
            alert("Geolocation is not supported by this browser.");
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

    // Filtering & Sorting Logic
    let filteredMesses = messes.map(mess => {
        // 1. Location Filter (Mess Address/Name)
        if (filters.location) {
            const searchTerm = filters.location.toLowerCase();
            const matchesName = mess.name.toLowerCase().includes(searchTerm);
            const matchesAddress = mess.address.toLowerCase().includes(searchTerm);
            if (!matchesName && !matchesAddress) return null;
        }

        // Get rooms for this mess
        const messRooms = rooms.filter(room => room.messId === mess.id);

        // Helper to check amenity (Mess Level > Fallback to Room Level for legacy data)
        const checkAmenity = (key) => {
            // 1. Check new Mess-level amenities
            if (mess.amenities && mess.amenities[key] !== undefined) return mess.amenities[key];

            // 2. Fallback: Check if ANY room has this feature (Migration support)
            // The user said "mess data will be same for all rooms", so if one room had it in old data, we assume mess has it
            return messRooms.some(r => {
                const rAm = r.amenities || r;
                return rAm[key] === true;
            });
        };

        // 2a. Mess-Level Amenities Filter
        if (filters.amenities.food && !checkAmenity('food')) return null;
        if (filters.amenities.waterFilter && !checkAmenity('waterFilter')) return null;
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
            if (filters.amenities.tableChair && !amenities.tableChair) return false;

            // Availability
            if (filters.availableOnly && (room.availableCount === 0 || room.available === false)) return false;

            return true;
        });

        const hasRoomCriteria = filters.minPrice || filters.maxPrice || filters.availableOnly || filters.amenities.ac || filters.amenities.tableChair;

        // If filtering by room criteria, and no rooms match, exclude mess
        if (hasRoomCriteria && matchingRooms.length === 0) return null;

        // Calculate Total Matching Beds
        const matchingBeds = matchingRooms.reduce((sum, room) => sum + (room.availableCount || 0), 0);

        // Determine if we should show the "Filtered Availability" badge
        const isFiltered = filters.location || filters.minPrice || filters.maxPrice || filters.availableOnly || Object.values(filters.amenities).some(Boolean);

        return {
            ...mess,
            matchingBeds,
            isFiltered
        };
    }).filter(Boolean); // Remove nulls

    // Sort by Distance if userLocation exists
    if (userLocation) {
        filteredMesses = filteredMesses.map(mess => {
            const distance = calculateDistance(
                userLocation.lat,
                userLocation.lng,
                mess.latitude,
                mess.longitude
            );
            return { ...mess, distance };
        }).sort((a, b) => a.distance - b.distance);
    }

    return (
        <div className="min-h-screen bg-neu-base font-sans text-neu-text pb-20">
            {/* New Header */}
            <Header
                onInstallClick={handleInstallClick}
                userLocation={userLocation}
                onLocationSelect={handleLocationSelect}
                onManualLocationChange={(loc) => setFilters({ ...filters, location: loc })}
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
                    {/* Dark overlay for better text contrast */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/70"></div>

                    {/* Content positioned below spotlights */}
                    <div className="relative z-10 text-center px-6 pb-12 max-w-2xl">
                        <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight drop-shadow-2xl">
                            Find your comfortable <span className="text-yellow-400">stay</span>.
                        </h1>
                        <p className="text-white/90 font-medium mb-8 text-lg drop-shadow-lg">
                            Search for the best student messes nearby.
                        </p>

                        {!userLocation && (
                            <div className="relative max-w-md mx-auto">
                                <button
                                    onClick={handleLocationSelect}
                                    className="w-full py-5 px-6 bg-white/10 backdrop-blur-md text-white font-bold rounded-2xl border-2 border-white/30 hover:bg-white/20 hover:border-white/50 transition-all flex items-center justify-center gap-3 group shadow-2xl"
                                >
                                    <div className="p-2 bg-yellow-400/20 rounded-full group-hover:bg-yellow-400/30 transition-all">
                                        <MapPin size={22} className="text-yellow-400" />
                                    </div>
                                    <span className="text-lg">Use Current Location</span>
                                </button>
                            </div>
                        )}

                        {userLocation && (
                            <div className="mt-6 flex flex-col items-center animate-fade-in-up">
                                <span className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Location Active</span>
                                <div className="px-6 py-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-white font-bold flex items-center gap-2 shadow-lg">
                                    <MapPin size={16} className="text-yellow-400" />
                                    {userLocation.address || "Using GPS Location"}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Filter Section */}
            <FilterBar onFilterChange={handleFilterChange} />

            {/* Mess List */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
                <div className="flex items-center justify-between mb-6 px-1">
                    <h2 className="text-xl font-bold text-gray-900 font-serif">
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
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-100 border-t-purple-500"></div>
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
