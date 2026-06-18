import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, ArrowRight, Search, X, BedDouble, Home, Compass, ArrowUpRight, ChevronDown } from 'lucide-react';
import Header from '../components/Header';
import FeedbackForm from '../components/FeedbackForm';
import MessCard from '../components/MessCard';
import SkeletonCard from '../components/SkeletonCard';
import { usePageSEO } from '../hooks/usePageSEO';
import useAllCityMesses from '../hooks/useAllCityMesses';
import { PAGINATION } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../hooks/useWishlist';
import { DISTRICTS_CONFIG } from '../context/DistrictContext';

const CITY_NAMES = Object.values(DISTRICTS_CONFIG).reduce((acc, district) => {
    (district.cities || []).forEach(city => {
        acc[city.id] = city.name;
    });
    return acc;
}, { other: "Other Localities" });

const CityLandingPage = () => {
    const { messesByCity, allMesses, rooms, loading } = useAllCityMesses();
    const [searchQuery, setSearchQuery] = React.useState('');
    const [showDropdown, setShowDropdown] = React.useState(false);
    const searchRef = React.useRef(null);
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { isMessWishlisted, toggleMessWishlist } = useWishlist();
    const [showLoginPrompt, setShowLoginPrompt] = React.useState(false);

    // Click outside listener
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Unique landmarks extractor
    const allUniqueLandmarks = React.useMemo(() => {
        const landmarkSet = new Set();
        
        // Predefined landmarks from DISTRICTS_CONFIG
        Object.values(DISTRICTS_CONFIG).forEach(district => {
            if (district.landmarks) {
                district.landmarks.forEach(lm => {
                    if (lm.name) landmarkSet.add(lm.name.trim());
                });
            }
        });

        // Dynamic landmarks/addresses from allMesses
        allMesses.forEach(mess => {
            if (mess.landmark) landmarkSet.add(mess.landmark.trim());
        });

        return Array.from(landmarkSet);
    }, [allMesses]);

    // Grouped and sorted suggestions based on query
    const suggestions = React.useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return { messes: [], landmarks: [], cities: [], count: 0 };

        // 1. Messes (matching names) - Max 5
        const matchedMesses = allMesses
            .filter(mess => mess.name?.toLowerCase().includes(query))
            .slice(0, 5)
            .map(mess => ({
                id: mess.id,
                name: mess.name,
                type: 'mess',
                city: mess.city,
                address: mess.address,
                districtId: mess.districtId || 'balasore'
            }));

        // 2. Landmarks / Areas - Max 3
        const matchedLandmarks = allUniqueLandmarks
            .filter(lm => lm.toLowerCase().includes(query))
            .slice(0, 3)
            .map(lm => ({
                name: lm,
                type: 'landmark'
            }));

        // 3. Cities - Max 3
        const matchedCities = Object.entries(CITY_NAMES)
            .filter(([id, name]) => name.toLowerCase().includes(query) || id.toLowerCase().includes(query))
            .slice(0, 3)
            .map(([id, name]) => {
                const district = Object.entries(DISTRICTS_CONFIG).find(([, config]) => 
                    config.cities?.some(c => c.id === id)
                );
                return {
                    id,
                    name: id === 'baleshwar' ? 'Balasore' : name.split(' (')[0],
                    type: 'city',
                    districtId: district ? district[0] : 'balasore'
                };
            });

        const count = matchedMesses.length + matchedLandmarks.length + matchedCities.length;

        return {
            messes: matchedMesses,
            landmarks: matchedLandmarks,
            cities: matchedCities,
            count
        };
    }, [searchQuery, allMesses, allUniqueLandmarks]);

    usePageSEO({
        title: "Find Boys & Girls Mess in Balasore & Bhadrak | MessKhojo",
        description: "Find affordable mess and hostel accommodations in Balasore, Remuna, Bhadrak, and Basudevpur. Budget PGs and rooms for students and working professionals.",
        keywords: "mess in balasore, mess in bhadrak, mess in remuna, mess in basudevpur, hostels in balasore, pgs in balasore, boys mess, girls mess",
        canonicalUrl: 'https://messkhojo.com/',
    });

    const handleMessWishlistToggle = async (messId) => {
        if (!currentUser) {
            setShowLoginPrompt(true);
            return;
        }
        await toggleMessWishlist(messId);
    };


    const filteredMessesByCity = React.useMemo(() => {
        if (!searchQuery.trim()) return messesByCity;

        const filtered = {};
        const queryLower = searchQuery.toLowerCase();

        Object.keys(messesByCity).forEach(cityId => {
            const messes = messesByCity[cityId];
            const matching = messes.filter(mess => {
                const nameMatch = mess.name?.toLowerCase().includes(queryLower);
                const addressMatch = mess.address?.toLowerCase().includes(queryLower);
                const cityMatch = mess.city?.toLowerCase().includes(queryLower);
                return nameMatch || addressMatch || cityMatch;
            });
            if (matching.length > 0) {
                filtered[cityId] = matching;
            }
        });
        return filtered;
    }, [messesByCity, searchQuery]);

    // Render loading state with cards skeletons
    if (loading) {
        return (
            <div className="min-h-screen bg-brand-secondary animate-fadeIn">
                <Header showSearch={false} />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Skeletons for city sections */}
                    {[1, 2].map((section) => (
                        <div key={section} className="mb-12">
                            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Priority: Baleshwar, Remuna, Bhadrak, Basudevpur, Baripada, then Other
    const cityOrder = ['baleshwar', 'remuna', 'bhadrak', 'basudevpur', 'baripada', 'other'];
    const activeCities = cityOrder.filter(cityId => filteredMessesByCity[cityId] && filteredMessesByCity[cityId].length > 0);
    
    // Add any other dynamic city keys not present in the hardcoded priority list
    Object.keys(filteredMessesByCity).forEach(cityId => {
        if (!cityOrder.includes(cityId) && filteredMessesByCity[cityId].length > 0) {
            activeCities.push(cityId);
        }
    });

    return (
        <div className="min-h-screen bg-brand-secondary flex flex-col animate-fadeIn">
            <Header showSearch={false} />

            <main className="flex-grow py-6 sm:py-8">
                {/* Search & Actions Bar */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 mt-2">
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                        {/* Left: Search input */}
                        <div ref={searchRef} className="relative flex-grow max-w-2xl lg:max-w-none">
                            <div className="relative flex items-center bg-white border border-gray-200/80 rounded-2xl shadow-sm focus-within:border-brand-primary/50 focus-within:ring-2 focus-within:ring-brand-primary/10 transition-all overflow-hidden">
                                <Search className="absolute left-4 text-gray-400 pointer-events-none" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search for Mess Name or City"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setShowDropdown(true);
                                    }}
                                    onFocus={() => setShowDropdown(true)}
                                    className="w-full pl-12 pr-10 py-3.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none bg-transparent"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => {
                                            setSearchQuery('');
                                            setShowDropdown(false);
                                        }}
                                        className="absolute right-4 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            {/* Suggestions Dropdown */}
                            {showDropdown && searchQuery.trim() && (
                                <div className="absolute left-0 right-0 mt-2 bg-white/95 backdrop-blur-md border border-gray-100 rounded-2xl shadow-2xl z-[150] overflow-hidden animate-fadeIn max-h-[350px] overflow-y-auto w-full">
                                    {suggestions.count === 0 ? (
                                        <div className="p-5 text-center text-sm text-gray-500">
                                            No suggestions found for "{searchQuery}"
                                        </div>
                                    ) : (
                                        <div className="p-2 space-y-3">
                                            {/* 1. MESS MATCHES */}
                                            {suggestions.messes.length > 0 && (
                                                <div>
                                                    <div className="px-3 py-1.5 text-[10px] font-extrabold text-brand-primary uppercase tracking-wider bg-brand-primary/5 rounded-lg mb-1 inline-block ml-2">
                                                        Messes
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        {suggestions.messes.map(mess => (
                                                            <button
                                                                key={mess.id}
                                                                onClick={() => {
                                                                    setShowDropdown(false);
                                                                    navigate(`/mess/${mess.id}`);
                                                                }}
                                                                className="w-full text-left px-3 py-2.5 hover:bg-brand-primary/5 rounded-xl transition-all duration-200 flex items-center justify-between group animate-fadeIn"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0 group-hover:scale-105 transition-transform">
                                                                        <Home size={16} />
                                                                    </div>
                                                                    <div className="flex flex-col min-w-0">
                                                                        <span className="text-sm font-semibold text-gray-800 truncate">{mess.name}</span>
                                                                        <span className="text-[10px] text-gray-400 truncate flex items-center gap-1">
                                                                            <MapPin size={10} />
                                                                            {mess.address || 'Balasore'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <ArrowUpRight size={14} className="text-gray-300 group-hover:text-brand-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* 2. LANDMARK MATCHES */}
                                            {suggestions.landmarks.length > 0 && (
                                                <div>
                                                    <div className="px-3 py-1.5 text-[10px] font-extrabold text-brand-accent-green uppercase tracking-wider bg-brand-accent-green/10 rounded-lg mb-1 inline-block ml-2">
                                                        Landmarks & Areas
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        {suggestions.landmarks.map((lm, idx) => (
                                                            <button
                                                                key={idx}
                                                                onClick={() => {
                                                                    setSearchQuery(lm.name);
                                                                    setShowDropdown(false);
                                                                }}
                                                                className="w-full text-left px-3 py-2.5 hover:bg-brand-accent-green/5 rounded-xl transition-all duration-200 flex items-center justify-between group animate-fadeIn"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-lg bg-brand-accent-green/10 flex items-center justify-center text-brand-accent-green shrink-0 group-hover:scale-105 transition-transform">
                                                                        <MapPin size={16} />
                                                                    </div>
                                                                    <div className="flex flex-col min-w-0">
                                                                        <span className="text-sm font-semibold text-gray-800 truncate">{lm.name}</span>
                                                                        <span className="text-[10px] text-gray-400">Search in this area</span>
                                                                    </div>
                                                                </div>
                                                                <ArrowUpRight size={14} className="text-gray-300 group-hover:text-brand-accent-green group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* 3. CITY MATCHES */}
                                            {suggestions.cities.length > 0 && (
                                                <div>
                                                    <div className="px-3 py-1.5 text-[10px] font-extrabold text-blue-600 uppercase tracking-wider bg-blue-50 rounded-lg mb-1 inline-block ml-2">
                                                        Cities
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        {suggestions.cities.map(city => (
                                                            <button
                                                                key={city.id}
                                                                onClick={() => {
                                                                    setShowDropdown(false);
                                                                    const districtId = Object.keys(DISTRICTS_CONFIG).find(dId =>
                                                                        DISTRICTS_CONFIG[dId].cities?.some(c => c.id === city.id)
                                                                    ) || 'balasore';
                                                                    navigate(`/district/${districtId}/city/${city.id}`);
                                                                }}
                                                                className="w-full text-left px-3 py-2.5 hover:bg-blue-50 rounded-xl transition-all duration-200 flex items-center justify-between group animate-fadeIn"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 group-hover:scale-105 transition-transform">
                                                                        <Compass size={16} />
                                                                    </div>
                                                                    <div className="flex flex-col min-w-0">
                                                                        <span className="text-sm font-semibold text-gray-800 truncate">{city.name}</span>
                                                                        <span className="text-[10px] text-gray-400">View city page</span>
                                                                    </div>
                                                                </div>
                                                                <ArrowUpRight size={14} className="text-gray-300 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
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

                        {/* Right: Quick Action Category Cards */}
                        <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 sm:gap-4 shrink-0 w-full sm:w-auto">
                            {/* Find Your Room Card */}
                            <Link
                                to="/find-your-room"
                                className="relative overflow-hidden flex items-center justify-between px-3 sm:px-5 py-3 rounded-2xl bg-brand-primary text-white hover:bg-brand-primary-hover active:scale-[0.98] transition-all duration-300 shadow-md text-left group gap-2 sm:gap-4 w-full sm:min-w-[200px]"
                            >
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-bold tracking-tight leading-tight mb-0.5 truncate">Find Your Room</span>
                                    <span className="text-[10px] font-medium text-white/80 truncate">Convenient Rooms Available!</span>
                                </div>
                                <div className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center text-white flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                                    <BedDouble size={16} />
                                </div>
                            </Link>

                            {/* Register Your Mess Card */}
                            <Link
                                to="/register-mess"
                                className="relative overflow-hidden flex items-center justify-between px-3 sm:px-5 py-3 rounded-2xl bg-brand-primary text-white hover:bg-brand-primary-hover active:scale-[0.98] transition-all duration-300 shadow-md text-left group gap-2 sm:gap-4 w-full sm:min-w-[200px]"
                            >
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-bold tracking-tight leading-tight mb-0.5 truncate">Register Your Mess</span>
                                    <span className="text-[10px] font-medium text-white/80 truncate">Enroll Today!</span>
                                </div>
                                <div className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center text-white flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                                    <Home size={16} />
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* City Sections list */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
                    {activeCities.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
                            <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-brand-primary">
                                <MapPin size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">No Messes Found</h3>
                            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">We are launching in new areas soon. Register your mess to get started!</p>
                        </div>
                    ) : (
                        <div className="space-y-12 sm:space-y-16">
                            {activeCities.map((cityId) => {
                                const cityMesses = filteredMessesByCity[cityId];
                                const cityName = cityId === 'baleshwar' ? 'Balasore' : (CITY_NAMES[cityId] || cityId.charAt(0).toUpperCase() + cityId.slice(1));
                                const previewMesses = cityMesses.slice(0, PAGINATION.HOME_PREVIEW_COUNT);
                                const hasMore = cityMesses.length > PAGINATION.HOME_PREVIEW_COUNT;

                                return (
                                    <section 
                                        key={cityId} 
                                        className="relative"
                                    >
                                        {/* City Header */}
                                        <div className="flex items-center justify-between mb-5 pb-2">
                                            <h2 className="text-xl sm:text-2xl font-bold text-brand-text-dark tracking-tight">
                                                Popular mess in {cityName}
                                            </h2>
                                            <Link 
                                                to={`/district/${Object.keys(DISTRICTS_CONFIG).find(dId => DISTRICTS_CONFIG[dId].cities?.some(c => c.id === cityId)) || 'balasore'}/city/${cityId}`}
                                                className="flex items-center text-gray-800 hover:text-brand-primary transition-colors"
                                            >
                                                <ArrowRight size={20} />
                                            </Link>
                                        </div>

                                        {/* Mess Cards Grid */}
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
                                            {previewMesses.map((mess) => (
                                                <MessCard 
                                                    key={mess.id} 
                                                    mess={mess} 
                                                    rooms={rooms.filter(r => r.messId === mess.id)} 
                                                    onToggleWishlist={handleMessWishlistToggle}
                                                    isWishlisted={isMessWishlisted(mess.id)}
                                                    compact={true}
                                                />
                                            ))}
                                        </div>

                                        {/* Center View More Button */}
                                        {hasMore && (
                                            <div className="mt-6 flex justify-center">
                                                <Link 
                                                    to={`/district/${Object.keys(DISTRICTS_CONFIG).find(dId => DISTRICTS_CONFIG[dId].cities?.some(c => c.id === cityId)) || 'balasore'}/city/${cityId}`}
                                                    className="w-full sm:w-auto px-6 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-full shadow-sm hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-95"
                                                >
                                                    View More
                                                    <ChevronDown size={16} />
                                                </Link>
                                            </div>
                                        )}
                                    </section>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="mt-16 sm:mt-24">
                    <FeedbackForm />
                </div>
            </main>

            {/* Login Prompt Modal - slides down from top */}
            {showLoginPrompt && (
                <div className="fixed inset-0 z-[200] flex flex-col items-center pointer-events-none">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
                        onClick={() => setShowLoginPrompt(false)}
                    />
                    {/* Modal */}
                    <div className="relative pointer-events-auto w-full max-w-sm mt-20 mx-4 bg-white rounded-3xl shadow-2xl p-6 animate-fadeIn">
                        <div className="flex flex-col items-center text-center gap-3">
                            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-2xl">❤️</div>
                            <h3 className="text-lg font-bold text-brand-text-dark">Save to Wishlist</h3>
                            <p className="text-sm text-brand-text-gray">Login to save messes and rooms to your personal wishlist.</p>
                            <button
                                onClick={() => { setShowLoginPrompt(false); navigate('/user-login'); }}
                                className="w-full py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary-hover transition-colors shadow-lg shadow-brand-primary/20"
                            >
                                Login / Sign Up
                            </button>
                            <button
                                onClick={() => setShowLoginPrompt(false)}
                                className="text-sm text-brand-text-gray hover:text-brand-text-dark transition-colors"
                            >
                                Maybe later
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CityLandingPage;
