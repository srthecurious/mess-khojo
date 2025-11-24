import React from 'react';
import { MapPin, Phone, ArrowRight, Star, BedDouble } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const MessCard = ({ mess, index }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-white rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12)] transition-all duration-300 overflow-hidden group border border-gray-50 flex flex-col h-full"
        >
            {/* Poster Image or Gradient */}
            <div className="h-48 relative overflow-hidden group-hover:scale-105 transition-transform duration-700">
                {mess.posterUrl ? (
                    <img
                        src={mess.posterUrl}
                        alt={mess.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100 flex items-center justify-center">
                        <span className="text-4xl opacity-20">🏠</span>
                    </div>
                )}

                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-gray-700 shadow-sm flex items-center gap-1">
                    <Star size={12} className="fill-yellow-400 text-yellow-400" /> 4.5
                </div>
            </div>

            <div className="p-6 flex-grow flex flex-col relative">
                <div className="absolute -top-8 left-6">
                    <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-50">
                        <div className="bg-gradient-to-br from-purple-600 to-pink-500 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-200 group-hover:scale-110 transition-transform duration-300">
                            <BedDouble size={24} />
                        </div>
                    </div>
                </div>

                <div className="mt-6 mb-4">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-1 font-serif">{mess.name}</h3>
                    <div className="flex items-center text-gray-500 text-sm mt-1">
                        <MapPin size={14} className="mr-1 text-purple-400" />
                        <span className="line-clamp-1">{mess.address}</span>
                    </div>
                </div>

                <div className="space-y-3 mb-6 flex-grow">
                    <div className="flex items-center justify-between text-sm bg-gray-50 p-3 rounded-xl">
                        <span className="text-gray-500">Contact</span>
                        <div className="flex items-center font-medium text-gray-700">
                            <Phone size={14} className="mr-1.5 text-green-500" />
                            {mess.contact}
                        </div>
                    </div>
                </div>

                <Link
                    to={`/mess/${mess.id}`}
                    className="mt-auto w-full group/btn relative overflow-hidden bg-gray-900 hover:bg-purple-600 text-white py-3.5 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-gray-200 hover:shadow-purple-200"
                >
                    <span className="relative z-10">View Details</span>
                    <ArrowRight size={18} className="relative z-10 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
            </div>
        </motion.div>
    );
};

export default MessCard;
