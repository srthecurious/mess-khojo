import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import RoomCard from '../components/RoomCard';
import { MapPin, Phone, ArrowLeft, ExternalLink, Utensils, Droplets, Wifi, Zap, ChevronDown, ChevronUp } from 'lucide-react';

const MessDetails = () => {
    const { id: messId } = useParams();
    const [mess, setMess] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMessAndRooms = async () => {
            try {
                // 1. Fetch Mess Details
                const messDoc = await getDoc(doc(db, "messes", messId));
                if (messDoc.exists()) {
                    setMess({ id: messDoc.id, ...messDoc.data() });
                }

                // 2. Fetch Rooms for this Mess
                const q = query(collection(db, "rooms"), where("messId", "==", messId));
                const unsubscribe = onSnapshot(q, (snapshot) => {
                    const roomsData = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setRooms(roomsData);
                    setLoading(false);
                });

                return () => unsubscribe();
            } catch (error) {
                console.error("Error fetching details:", error);
                setLoading(false);
            }
        };

        fetchMessAndRooms();
    }, [messId]);

    if (loading) return <div className="min-h-screen flex items-center justify-center text-purple-600">Loading...</div>;
    if (!mess) return <div className="min-h-screen flex items-center justify-center text-red-500">Mess not found</div>;

    // Group rooms by Occupancy
    const groupedRooms = rooms.reduce((acc, room) => {
        const occupancy = room.occupancy || 'Other';
        if (!acc[occupancy]) {
            acc[occupancy] = [];
        }
        acc[occupancy].push(room);
        return acc;
    }, {});

    // Sort room groups by predefined order
    const occupancyOrder = ['Single', 'Double', 'Triple', 'Four', 'Five', 'Six', 'Other'];
    const sortedGroups = Object.entries(groupedRooms).sort((a, b) => {
        return occupancyOrder.indexOf(a[0]) - occupancyOrder.indexOf(b[0]);
    });

    // Helper to check amenity for display (Mess Level > Fallback to Room Level)
    const checkAmenity = (key) => {
        if (mess.amenities && mess.amenities[key] !== undefined) return mess.amenities[key];
        return rooms.some(r => {
            const rAm = r.amenities || r;
            return rAm[key] === true;
        });
    };

    const hasFood = checkAmenity('food');
    const hasWater = checkAmenity('waterFilter');
    const hasWifi = checkAmenity('wifi');
    const hasInverter = checkAmenity('inverter');

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <Link to="/" className="inline-flex items-center text-gray-500 hover:text-purple-600 mb-6 transition-colors font-medium">
                        <ArrowLeft size={20} className="mr-2" /> Back to Messes
                    </Link>
                    <h1 className="text-4xl font-bold text-gray-800 mb-4 font-serif">{mess.name}</h1>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap gap-6 text-gray-600">
                            <div className="flex items-center bg-purple-50 px-4 py-2 rounded-full">
                                <MapPin size={20} className="mr-2 text-purple-500" />
                                <span>{mess.address}</span>
                                {mess.locationUrl && (
                                    <a
                                        href={mess.locationUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="ml-2 text-purple-600 hover:text-purple-800"
                                        title="View on Google Maps"
                                    >
                                        <ExternalLink size={16} />
                                    </a>
                                )}
                            </div>
                            <div className="flex items-center bg-pink-50 px-4 py-2 rounded-full">
                                <Phone size={20} className="mr-2 text-pink-500" />
                                <span>{mess.contact}</span>
                            </div>
                        </div>

                        {/* Global Amenities Display */}
                        <div className="flex flex-wrap gap-4 mt-2">
                            {hasFood && (
                                <div className="flex items-center text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg">
                                    <Utensils size={16} className="mr-2 text-green-600" /> Food Available
                                </div>
                            )}
                            {hasWater && (
                                <div className="flex items-center text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg">
                                    <Droplets size={16} className="mr-2 text-blue-500" /> RO Water
                                </div>
                            )}
                            {hasWifi && (
                                <div className="flex items-center text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg">
                                    <Wifi size={16} className="mr-2 text-indigo-500" /> Free WiFi
                                </div>
                            )}
                            {hasInverter && (
                                <div className="flex items-center text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg">
                                    <Zap size={16} className="mr-2 text-yellow-500" /> Power Backup
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Rooms Grid */}
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex items-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 font-serif">Available Room Types</h2>
                    <div className="ml-4 h-px flex-grow bg-gray-200"></div>
                </div>

                {rooms.length > 0 ? (
                    <div className="space-y-8">
                        {sortedGroups.map(([occupancy, groupRooms]) => (
                            <RoomTypeGroup key={occupancy} occupancy={occupancy} rooms={groupRooms} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white rounded-3xl shadow-sm border border-dashed border-gray-300">
                        <p className="text-gray-500 text-lg">No rooms listed for this mess yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const RoomTypeGroup = ({ occupancy, rooms }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Calculate price range
    const prices = rooms.map(r => Number(r.price || r.rent)).sort((a, b) => a - b);
    const minPrice = prices[0];
    const maxPrice = prices[prices.length - 1];
    const priceDisplay = minPrice === maxPrice ? `₹${minPrice}` : `₹${minPrice} - ₹${maxPrice}`;

    // Calculate total available beds
    const totalAvailable = rooms.reduce((sum, r) => sum + (r.availableCount || 0), 0);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div
                className="p-6 flex flex-col md:flex-row md:items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-bold text-gray-800">{occupancy} Seater Rooms</h3>
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-600">{rooms.length} Variants</span>
                    </div>
                    <p className="text-gray-500 text-sm">Starting from <span className="font-semibold text-gray-900">{priceDisplay}/mo</span></p>
                </div>

                <div className="flex items-center gap-4 mt-4 md:mt-0">
                    {totalAvailable > 0 ? (
                        <span className="text-green-600 text-sm font-medium bg-green-50 px-3 py-1 rounded-full">
                            {totalAvailable} Beds Available Total
                        </span>
                    ) : (
                        <span className="text-red-500 text-sm font-medium bg-red-50 px-3 py-1 rounded-full">
                            Full
                        </span>
                    )}

                    <button className="flex items-center gap-1 text-purple-600 font-medium hover:text-purple-800 transition-colors">
                        {isOpen ? 'Hide Options' : 'View Options'}
                        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                </div>
            </div>

            {/* Dropdown Content - Subcategories */}
            {isOpen && (
                <div className="p-6 bg-gray-50 border-t border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {rooms.map(room => (
                            <RoomCard key={room.id} room={room} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MessDetails;
