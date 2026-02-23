import React from 'react';
import { MapPin, Users, Home, Utensils, Droplets, Check, X, Wifi, Zap, Wind, Layers, ArrowRight } from 'lucide-react';

import { Link } from 'react-router-dom';

const RoomCard = ({ room, isAdmin, onDelete }) => {
    // Handle both old (imageUrl) and new (imageUrls) data structures
    const displayImage = (room.imageUrls && room.imageUrls.length > 0)
        ? room.imageUrls[0]
        : (room.imageUrl || "/default-room.jpg");

    // Handle amenities (support both new nested object and old flat structure)
    const am = room.amenities || room;

    // Map legacy text to numbers
    const occupancyMap = {
        'Single': '1',
        'Double': '2',
        'Triple': '3',
        'Four': '4',
        'Five': '5',
        'Six': '6'
    };
    const displayOccupancy = occupancyMap[room.occupancy] || room.occupancy;
    const title = displayOccupancy ? `${displayOccupancy} Seater` : `Room ${room.roomNumber}`;
    const price = room.price || room.rent;

    const cardContent = (
        <>
            <div className="h-36 md:h-44 rounded-2xl overflow-hidden mb-2 relative shadow-sm group-hover/img:shadow-md">
                <img
                    src={displayImage}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                />

                {/* Count Badge */}
                {room.availableCount > 0 ? (
                    <div className="absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-bold bg-green-100/90 text-green-800 shadow-sm backdrop-blur-sm pointer-events-none">
                        Available
                    </div>
                ) : (
                    <div className="absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-bold bg-red-100/90 text-red-800 shadow-sm backdrop-blur-sm pointer-events-none">
                        Full
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-2 flex-grow">
                <div>
                    <h3 className="uiverse-header-title mb-1 line-clamp-1">{title}</h3>
                    {room.category && <p className="uiverse-header-subtitle">{room.category}</p>}
                </div>

                {/* Icons Row */}
                <div className="flex gap-3 text-yellow-800/60 mt-2">
                    {am.ac && <Wind size={16} />}
                    {am.attachedBathroom && <Droplets size={16} />}
                </div>
            </div>

            {/* Footer */}
            <div className="mt-2 flex items-end justify-between">
                <div>
                    <div className="uiverse-price">₹{price}</div>
                    <div className="uiverse-header-subtitle text-xs">per month</div>
                </div>

                {isAdmin && (
                    <button
                        onClick={(e) => { e.preventDefault(); onDelete(room.id); }}
                        className="uiverse-badge bg-red-100 text-red-600 hover:bg-red-200"
                    >
                        Delete
                    </button>
                )}
                {!isAdmin && (
                    <div className="w-10 h-10 rounded-full bg-brand-light-gray flex items-center justify-center text-brand-primary transition-all duration-300 group-hover:bg-brand-primary group-hover:text-white group-hover:scale-110 shadow-sm ml-auto">
                        <ArrowRight size={20} strokeWidth={2.5} />
                    </div>
                )}
            </div>
        </>
    );

    return (
        <div className="uiverse-card flex flex-col h-full">
            {isAdmin ? (
                <div className="cursor-pointer h-full relative flex flex-col">
                    {cardContent}
                </div>
            ) : (
                <Link to={`/room/${room.messId}/${room.id}`} className="block h-full relative flex flex-col">
                    {cardContent}
                </Link>
            )}
        </div>
    );
};

export default RoomCard;
