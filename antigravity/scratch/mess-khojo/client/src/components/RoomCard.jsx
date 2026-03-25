import React from 'react';
import { MapPin, Users, Home, Utensils, Droplets, Check, X, Wifi, Zap, Wind, Layers, ArrowRight, Heart } from 'lucide-react';

import { Link } from 'react-router-dom';

const RoomCard = ({ room, isAdmin, onDelete, isWishlisted = false, onToggleWishlist, isUserSourced = false }) => {
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
            {/* Image Section */}
            <div className="h-40 md:h-48 relative overflow-hidden bg-gray-100">
                <img
                    src={displayImage}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {/* Gradient for badge readability */}
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Wishlist Heart Button - Keep it top left */}
                {onToggleWishlist && (
                    <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleWishlist(room.id); }}
                        className={`absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.15)] transition-all active:scale-90 ${isWishlisted
                                ? 'bg-red-500 text-white'
                                : 'bg-white/95 backdrop-blur-sm text-gray-400 hover:text-red-500'
                            }`}
                        title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                    >
                        <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} strokeWidth={2.5} />
                    </button>
                )}

                {/* Count Badge */}
                {!isUserSourced && (
                    room.availableCount > 0 ? (
                        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wide bg-brand-accent-green text-white shadow-sm pointer-events-none">
                            Available
                        </div>
                    ) : (
                        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wide bg-brand-red text-white shadow-sm pointer-events-none">
                            Full
                        </div>
                    )
                )}
            </div>

            {/* Content Section */}
            <div className="p-4 flex flex-col flex-grow">
                <div className="mb-2">
                    <h3 className="text-xl font-bold text-gray-900 line-clamp-1">{title}</h3>
                    {room.category && <p className="text-sm font-medium text-gray-500">{room.category}</p>}
                </div>

                {/* Amenities - Explicit Tags */}
                <div className="flex flex-wrap gap-2 mt-1 mb-4">
                    {am.ac && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-bold">
                            <Wind size={13} strokeWidth={2.5} /> AC
                        </span>
                    )}
                    {am.attachedBathroom && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-cyan-50 text-cyan-800 text-xs font-bold">
                            <Droplets size={13} strokeWidth={2.5} /> Attached Bath
                        </span>
                    )}
                    {am.furnished && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-amber-50 text-amber-800 text-xs font-bold">
                            <Home size={13} strokeWidth={2.5} /> Furnished
                        </span>
                    )}
                    {/* Fallback spacer to keep cards roughly same height if no amenities */}
                    {!am.ac && !am.attachedBathroom && !am.furnished && (
                         <span className="inline-flex items-center py-1 opacity-0 select-none text-xs">Spacer</span>
                    )}
                </div>

                {/* Footer Section - Pushed to bottom */}
                <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div>
                        <div className="text-2xl font-extrabold text-brand-primary leading-none">₹{price}</div>
                        <div className="text-xs font-medium text-gray-500 mt-0.5">per month</div>
                    </div>

                    {isAdmin ? (
                        <button
                            onClick={(e) => { e.preventDefault(); onDelete(room.id); }}
                            className="px-3 py-1.5 bg-red-50 text-red-600 font-bold text-sm rounded-lg hover:bg-red-100 transition-colors"
                        >
                            Delete
                        </button>
                    ) : (
                        <div className="flex items-center gap-1 px-3 py-2 bg-brand-primary/5 rounded-lg text-sm font-bold text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all duration-300">
                            View <ArrowRight size={16} className="transform group-hover:translate-x-0.5 transition-transform" />
                        </div>
                    )}
                </div>
            </div>
        </>
    );

    return (
        <div className="group flex flex-col h-full bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_35px_rgba(75,46,131,0.12)] border border-gray-100 overflow-hidden transition-all duration-300 hover:-translate-y-1.5 cursor-pointer">
            {isAdmin ? (
                <div className="flex flex-col h-full relative">
                    {cardContent}
                </div>
            ) : (
                <Link to={`/room/${room.messId}/${room.id}`} className="flex flex-col h-full relative">
                    {cardContent}
                </Link>
            )}
        </div>
    );
};

export default RoomCard;
