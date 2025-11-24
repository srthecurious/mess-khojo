import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { MapPin, Bed, Bath, Utensils, Droplets, Check, X, ArrowLeft, Phone, Calendar } from 'lucide-react';

const RoomDetails = () => {
    const { roomId } = useParams();
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    useEffect(() => {
        const fetchRoom = async () => {
            try {
                const roomDoc = await getDoc(doc(db, "rooms", roomId));
                if (roomDoc.exists()) {
                    setRoom({ id: roomDoc.id, ...roomDoc.data() });
                }
                setLoading(false);
            } catch (error) {
                console.error("Error fetching room:", error);
                setLoading(false);
            }
        };

        fetchRoom();
    }, [roomId]);

    if (loading) return <div className="min-h-screen flex items-center justify-center text-purple-600">Loading...</div>;
    if (!room) return <div className="min-h-screen flex items-center justify-center text-red-500">Room not found</div>;

    const images = room.imageUrls || (room.imageUrl ? [room.imageUrl] : ["https://via.placeholder.com/800x600?text=No+Image"]);

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-12">
            {/* Header / Nav */}
            <div className="bg-white shadow-sm p-4 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto flex items-center">
                    <Link to={`/mess/${room.messId}`} className="flex items-center text-gray-600 hover:text-purple-600 transition-colors">
                        <ArrowLeft size={20} className="mr-2" /> Back to Mess
                    </Link>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Image Gallery */}
                    <div className="space-y-4">
                        <div className="aspect-video w-full overflow-hidden rounded-2xl shadow-lg bg-gray-200">
                            <img
                                src={images[activeImageIndex]}
                                alt={`Room View ${activeImageIndex + 1}`}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        {images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImageIndex(idx)}
                                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${activeImageIndex === idx ? 'border-purple-600 ring-2 ring-purple-200' : 'border-transparent opacity-70 hover:opacity-100'
                                            }`}
                                    >
                                        <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Room Info */}
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between items-start">
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">Room {room.roomNumber}</h1>
                                <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${room.available !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                    {room.available !== false ? 'Available' : 'Booked'}
                                </span>
                            </div>
                            <p className="text-gray-500 flex items-center text-lg">
                                <MapPin size={18} className="mr-2" /> {room.location}
                            </p>
                            <p className="text-sm text-gray-400 mt-1">Part of {room.messName}</p>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h2 className="text-xl font-semibold mb-4">Pricing</h2>
                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-3xl font-bold text-purple-600">₹{room.rent}</span>
                                <span className="text-gray-500">/ month</span>
                            </div>
                            {room.advanceDeposit && (
                                <p className="text-gray-600 text-sm">
                                    Advance Deposit: <span className="font-semibold">₹{room.advanceDeposit}</span>
                                </p>
                            )}
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h2 className="text-xl font-semibold mb-4">Amenities & Details</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center text-gray-700">
                                    <Bed size={20} className="mr-3 text-purple-500" />
                                    <span>{room.beds} Beds</span>
                                </div>
                                <div className="flex items-center text-gray-700">
                                    <Bath size={20} className="mr-3 text-purple-500" />
                                    <span>{room.bathrooms} Bathrooms</span>
                                </div>
                                <div className="flex items-center text-gray-700">
                                    <Utensils size={20} className="mr-3 text-purple-500" />
                                    <span>Food: {room.food ? 'Included' : 'Not Included'}</span>
                                </div>
                                <div className="flex items-center text-gray-700">
                                    <Droplets size={20} className="mr-3 text-purple-500" />
                                    <span>Water Filter: {room.waterFilter ? 'Available' : 'No'}</span>
                                </div>
                                <div className="flex items-center text-gray-700">
                                    <div className="w-5 h-5 mr-3 flex items-center justify-center text-purple-500 font-bold border border-purple-500 rounded text-xs">T</div>
                                    <span>Table/Chair: {room.tableChair ? 'Yes' : 'No'}</span>
                                </div>
                            </div>
                        </div>

                        {room.otherInfo && (
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h2 className="text-xl font-semibold mb-2">Description</h2>
                                <p className="text-gray-600 leading-relaxed">{room.otherInfo}</p>
                            </div>
                        )}

                        <button className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200 flex items-center justify-center gap-2">
                            <Phone size={20} /> Contact Owner to Book
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoomDetails;
