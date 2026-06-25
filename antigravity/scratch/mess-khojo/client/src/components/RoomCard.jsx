import React from 'react';
import PropTypes from 'prop-types';
import { MapPin, Users, Home, Utensils, Droplets, Check, X, Wifi, Zap, Wind, Layers, ArrowRight, Heart } from 'lucide-react';

import { Link } from 'react-router-dom';
import { OCCUPANCY_MAP } from '../constants';
import { toMessSlug, toRoomSlug } from '../utils/slugify';
import { getCleanOccupancy } from '../utils/occupancy';

const RoomCard = ({ room, isAdmin, onDelete, isWishlisted = false, onToggleWishlist, isUserSourced = false, messName = '', compact = false }) => {
    // Handle both old (imageUrl) and new (imageUrls) data structures
    const displayImage = (room.imageUrls && room.imageUrls.length > 0)
        ? room.imageUrls[0]
        : (room.imageUrl || "/default-room.jpg");

    // Handle amenities (support both new nested object and old flat structure)
    const am = room.amenities || room;

    const displayOccupancy = getCleanOccupancy(room.occupancy);
    const title = displayOccupancy ? `${displayOccupancy} Seater` : `Room ${room.roomNumber}`;
    const price = room.price || room.rent;

    const cardContent = (
        <>
            {/* Image Section */}
            <div className={compact ? "w-full aspect-[4/3] rounded-3xl overflow-hidden mb-2 relative shadow-sm bg-gray-100" : "h-40 md:h-48 relative overflow-hidden bg-gray-100"}>
                <img
                    src={displayImage}
                    alt={`${title}${messName ? ` at ${messName}` : ''}`}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                    width={350}
                    height={190}
                />
                {/* Gradient for badge readability */}
                {!compact && (
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                )}

                {/* Wishlist Heart Button - Keep it top left / top right depending on layout */}
                {onToggleWishlist && (
                    <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleWishlist(room.id); }}
                        className={compact 
                            ? `absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all active:scale-90 ${isWishlisted
                                    ? 'bg-red-500 text-white'
                                    : 'bg-black/40 backdrop-blur-sm text-white hover:text-red-500'
                                }`
                            : `absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.15)] transition-all active:scale-90 ${isWishlisted
                                    ? 'bg-red-500 text-white'
                                    : 'bg-white/95 backdrop-blur-sm text-gray-400 hover:text-red-500'
                                }`
                        }
                        title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                    >
                        <Heart size={compact ? 15 : 16} fill={isWishlisted ? 'currentColor' : 'none'} strokeWidth={2} />
                    </button>
                )}

                {/* Count Badge */}
                {!isUserSourced && (
                    room.availableCount > 0 ? (
                        <div className={compact 
                            ? "absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-brand-accent-green text-white shadow-md pointer-events-none"
                            : "absolute top-3 right-3 px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wide bg-brand-accent-green text-white shadow-sm pointer-events-none"
                        }>
                            Available
                        </div>
                    ) : (
                        <div className={compact 
                            ? "absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-brand-red text-white shadow-md pointer-events-none"
                            : "absolute top-3 right-3 px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wide bg-brand-red text-white shadow-sm pointer-events-none"
                        }>
                            Full
                        </div>
                    )
                )}
            </div>

            {/* Content Section */}
            <div className={compact ? "flex flex-col gap-1 flex-grow" : "p-4 flex flex-col flex-grow"}>
                {compact ? (
                    <div className="flex flex-col pt-1">
                        <div className="flex justify-between items-baseline gap-2">
                            <h3 className="text-sm sm:text-base font-extrabold text-gray-950 truncate flex-grow">
                                {messName || title}
                            </h3>
                            <span className="text-sm sm:text-base font-extrabold text-gray-950 shrink-0">
                                ₹{price}
                            </span>
                        </div>
                        <div className="flex justify-between items-center mt-0.5 text-xs text-gray-500">
                            <span className="truncate flex-grow">{messName ? title : (room.category || "Room")}</span>
                            <span className="shrink-0">{room.rentCycle === 'yearly' ? '/year' : '/month'}</span>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="mb-2">
                            <h3 className="text-xl font-bold text-gray-900 line-clamp-1">
                                {title}
                            </h3>
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
                                <div className="text-xs font-medium text-gray-500 mt-0.5">
                                    {room.rentCycle === 'yearly' ? 'per year' : 'per month'}
                                </div>
                                {room.minStayDuration && room.minStayDuration >= 12 && (
                                    <div className="mt-1 text-[10px] font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded inline-block">
                                        🔒 1-Yr Stay Commitment
                                    </div>
                                )}
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
                    </>
                )}
            </div>
        </>
    );

    const outerClassName = compact
        ? "flex flex-col h-full group relative"
        : "group flex flex-col h-full bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_35px_rgba(75,46,131,0.12)] border border-gray-100 overflow-hidden transition-all duration-300 hover:-translate-y-1.5 cursor-pointer";

    return (
        <div className={outerClassName}>
            {isAdmin ? (
                <div className="flex flex-col h-full relative">
                    {cardContent}
                </div>
            ) : (
                <Link to={`/room/${toMessSlug(messName || '', room.messId)}/${toRoomSlug(room.occupancy, room.id)}`} className="flex flex-col h-full relative">
                    {cardContent}
                </Link>
            )}
        </div>
    );
};

RoomCard.propTypes = {
    room: PropTypes.shape({
        id: PropTypes.string.isRequired,
        occupancy: PropTypes.string,
        roomNumber: PropTypes.string,
        category: PropTypes.string,
        totalInventory: PropTypes.number,
        price: PropTypes.any,
        rent: PropTypes.any,
        amenities: PropTypes.object,
        availableCount: PropTypes.number,
        available: PropTypes.bool,
        imageUrls: PropTypes.arrayOf(PropTypes.string),
        imageUrl: PropTypes.string,
        messId: PropTypes.string,
        messName: PropTypes.string,
        rentCycle: PropTypes.string,
        minStayDuration: PropTypes.number
    }).isRequired,
    isAdmin: PropTypes.bool,
    onDelete: PropTypes.func,
    isWishlisted: PropTypes.bool,
    onToggleWishlist: PropTypes.func,
    isUserSourced: PropTypes.bool,
    messName: PropTypes.string,
    compact: PropTypes.bool
};

export default RoomCard;
