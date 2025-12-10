import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import MessCard from '../components/MessCard';
import FilterBar from '../components/FilterBar';
import { Search, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Home = () => {
    const [messes, setMesses] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
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

    // Filtering Logic
    const filteredMesses = messes.filter(mess => {
        // 1. Location Filter (Mess Address)
        if (filters.location) {
            const searchTerm = filters.location.toLowerCase();
            const matchesName = mess.name.toLowerCase().includes(searchTerm);
            const matchesAddress = mess.address.toLowerCase().includes(searchTerm);
            if (!matchesName && !matchesAddress) return false;
        }

        // Get rooms for this mess
        const messRooms = rooms.filter(room => room.messId === mess.id);

        // If filtering by room criteria, and mess has no rooms, exclude it
        const hasRoomCriteria = filters.minPrice || filters.maxPrice || filters.availableOnly || Object.values(filters.amenities).some(Boolean);
        if (hasRoomCriteria && messRooms.length === 0) return false;

        // Check if ANY room in this mess matches the criteria
        const hasMatchingRoom = messRooms.some(room => {
            // 2. Price Filter
            if (filters.minPrice && Number(room.rent) < Number(filters.minPrice)) return false;
            if (filters.maxPrice && Number(room.rent) > Number(filters.maxPrice)) return false;

            // 3. Availability Filter
            if (filters.availableOnly && room.available === false) return false;

            // 4. Amenities Filter
            if (filters.amenities.wifi && !room.wifi) return false;
            if (filters.amenities.inverter && !room.inverter) return false;
            if (filters.amenities.ac && !room.ac) return false;
            if (filters.amenities.food && !room.food) return false;
            if (filters.amenities.waterFilter && !room.waterFilter) return false;
            if (filters.amenities.tableChair && !room.tableChair) return false;

            return true;
        });

        // If we have room criteria, we need at least one matching room
        if (hasRoomCriteria && !hasMatchingRoom) return false;

        return true;
    });

    return (
        <div className="min-h-screen bg-[#FDF8F5] font-sans text-gray-800 selection:bg-pink-200">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-pink-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-3">
                            <img src="/logo.png" alt="Mess Khojo Logo" className="h-16 w-auto" />
                            <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 tracking-tight font-serif">Mess Khojo</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleInstallClick}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#01875f] hover:bg-[#016f4e] text-white font-medium transition-colors shadow-md"
                            >
                                <Download size={18} />
                                <span className="hidden sm:inline">Install App</span>
                            </button>
                            <Link to="/admin/login" className="px-6 py-2.5 bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-500 hover:to-pink-500 text-white rounded-full font-medium transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm tracking-wide">
                                Partner Login
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative bg-[#FDF8F5] pt-20 pb-16 px-4 overflow-hidden">
                {/* Pastel Blobs Background */}
                <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
                <div className="absolute top-20 right-10 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-4000 transform -translate-x-1/2"></div>

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <span className="inline-block py-1 px-3 rounded-full bg-purple-100 text-purple-600 text-sm font-semibold mb-6 tracking-wider uppercase">
                            Find Your Comfort
                        </span>
                        <h1 className="text-5xl md:text-7xl font-bold mb-8 text-gray-900 leading-tight font-serif">
                            Feels like <span className="relative inline-block">
                                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">home</span>
                                <span className="absolute bottom-2 left-0 w-full h-3 bg-pink-200/50 -z-10 rounded-full"></span>
                            </span>, <br /> even when you're away.
                        </h1>
                        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
                            Discover verified messes and hostels that prioritize hygiene, comfort, and community.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Filter Section */}
            <FilterBar onFilterChange={handleFilterChange} />

            {/* Mess List */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-white rounded-t-[3rem] shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.05)] relative z-20 min-h-[50vh]">
                <div className="flex items-center justify-center mb-16">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-gray-900 font-serif mb-3">Explore Curated Stays</h2>
                        <div className="h-1.5 w-24 bg-gradient-to-r from-purple-300 to-pink-300 rounded-full mx-auto"></div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-100 border-t-purple-500"></div>
                    </div>
                ) : filteredMesses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredMesses.map((mess, index) => (
                            <MessCard key={mess.id} mess={mess} index={index} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                        <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100">
                            <Search size={32} className="text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-700 mb-2">No matches found</h3>
                        <p className="text-gray-500">We couldn't find any messes matching your filters.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;
