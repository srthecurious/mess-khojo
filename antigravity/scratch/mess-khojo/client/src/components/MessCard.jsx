import React from 'react';
import { MapPin, Phone, ArrowRight, BedDouble } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const MessCard = ({ mess, index }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="uiverse-card flex flex-col h-full"
        >
            <Link to={`/mess/${mess.id}`} className="block h-full flex flex-col">
                {/* Poster Image (Optional - reduced height to fit style) */}
                <div className="h-40 rounded-2xl overflow-hidden mb-4 relative shadow-sm">
                    {mess.posterUrl ? (
                        <img src={mess.posterUrl} alt={mess.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                            <span className="text-4xl">🏡</span>
                        </div>
                    )}

                    {/* Filter Match Badge */}
                    {mess.isFiltered && (
                        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-green-700 shadow-sm">
                            {mess.matchingBeds > 0 ? `${mess.matchingBeds} Beds` : 'No Match'}
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-2 flex-grow">
                    {/* Header */}
                    <div>
                        <h3 className="uiverse-header-title mb-1 line-clamp-1">{mess.name}</h3>
                        <div className="flex items-center gap-1 uiverse-header-subtitle">
                            <MapPin size={12} className="opacity-60" />
                            <span className="truncate">{mess.address}</span>
                        </div>
                    </div>

                    {/* Content (Contact) */}
                    <div className="mt-2 flex items-center gap-2 uiverse-header-subtitle">
                        <Phone size={12} />
                        <span>{mess.contact}</span>
                    </div>
                </div>

                {/* Footer / Bottom Actions */}
                <div className="mt-4 flex items-end justify-between">
                    {/* View Details Button - Now on LEFT and LARGER */}
                    <div className="uiverse-badge text-base px-6 py-2.5">
                        View Details
                    </div>

                    {/* Distance - Now on RIGHT and SMALLER */}
                    <div>
                        {mess.distance !== undefined && (
                            <div className="text-lg font-bold text-yellow-700 flex items-baseline">
                                {mess.distance < 1 ? Math.round(mess.distance * 1000) : mess.distance.toFixed(1)}
                                <span className="text-xs ml-1 opacity-60 font-normal">{mess.distance < 1 ? 'm' : 'km'}</span>
                            </div>
                        )}
                        {!mess.distance && <div className="text-lg font-bold text-yellow-700 opacity-50">--</div>}
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};

export default MessCard;
