import React from 'react';
import { MapPin, Bed, Bath, Utensils, Droplets, Check, X } from 'lucide-react';

import { Link } from 'react-router-dom';

const RoomCard = ({ room, isAdmin, onDelete }) => {
    // Handle both old (imageUrl) and new (imageUrls) data structures
    const displayImage = (room.imageUrls && room.imageUrls.length > 0)
        ? room.imageUrls[0]
        : (room.imageUrl || "https://via.placeholder.com/400x300?text=No+Image");

    const CardContent = () => (
        <>
            <div className="relative h-48 overflow-hidden">
                <img
                    src={displayImage}
                    alt={`Room ${room.roomNumber}`}
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                    <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-indigo-600 shadow-sm">
                        ₹{room.rent}/mo
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${room.available !== false
                        ? 'bg-green-100/90 text-green-700 backdrop-blur-sm'
                        : 'bg-red-100/90 text-red-700 backdrop-blur-sm'
                        }`}>
                        {room.available !== false ? 'Available' : 'Booked'}
                    </div>
                </div>
                {room.imageUrls && room.imageUrls.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                        +{room.imageUrls.length - 1} more
                    </div>
                )}
            </div>

            <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Room {room.roomNumber}</h3>
                        <div className="flex items-center text-gray-500 text-sm mt-1">
                            <MapPin size={14} className="mr-1" />
                            {room.location}
                        </div>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={(e) => {
                                e.preventDefault(); // Prevent navigation when clicking delete
                                onDelete(room.id);
                            }}
                            className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors z-10 relative"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-4">
                    <div className="flex items-center"><Bed size={16} className="mr-2 text-indigo-500" /> {room.beds} Beds</div>
                    <div className="flex items-center"><Bath size={16} className="mr-2 text-indigo-500" /> {room.bathrooms} Baths</div>
                    <div className="flex items-center">
                        <Utensils size={16} className="mr-2 text-indigo-500" />
                        Food: {room.food ? <Check size={14} className="text-green-500 ml-1" /> : <X size={14} className="text-red-500 ml-1" />}
                    </div>
                    <div className="flex items-center">
                        <Droplets size={16} className="mr-2 text-indigo-500" />
                        Water: {room.waterFilter ? <Check size={14} className="text-green-500 ml-1" /> : <X size={14} className="text-red-500 ml-1" />}
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-3 mt-2">
                    <p className="text-xs text-gray-500 line-clamp-2">{room.otherInfo}</p>
                </div>
            </div>
        </>
    );

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-100 block">
            {isAdmin ? (
                <div className="cursor-pointer">
                    <CardContent />
                </div>
            ) : (
                <Link to={`/room/${room.id}`} className="block h-full">
                    <CardContent />
                </Link>
            )}
        </div>
    );
};

export default RoomCard;
