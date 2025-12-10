import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import RoomCard from '../components/RoomCard';
import { MapPin, Phone, ArrowLeft, ExternalLink } from 'lucide-react';

const MessDetails = () => {
    const { messId } = useParams();
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

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <Link to="/" className="inline-flex items-center text-gray-500 hover:text-purple-600 mb-6 transition-colors font-medium">
                        <ArrowLeft size={20} className="mr-2" /> Back to Messes
                    </Link>
                    <h1 className="text-4xl font-bold text-gray-800 mb-4 font-serif">{mess.name}</h1>
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
                </div>
            </div>

            {/* Rooms Grid */}
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex items-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 font-serif">Available Rooms</h2>
                    <div className="ml-4 h-px flex-grow bg-gray-200"></div>
                </div>

                {rooms.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {rooms.map(room => (
                            <RoomCard key={room.id} room={room} />
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

export default MessDetails;
