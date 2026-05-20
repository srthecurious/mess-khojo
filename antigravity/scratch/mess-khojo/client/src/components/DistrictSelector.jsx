import React from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, CheckCircle2, ChevronRight, Map } from 'lucide-react';
import { useDistrict } from '../context/DistrictContext';

const DistrictSelector = () => {
    const { 
        availableDistricts, 
        selectedDistrict, 
        setSelectedDistrict, 
        isDistrictSelectorOpen, 
        setIsDistrictSelectorOpen 
    } = useDistrict();

    if (!isDistrictSelectorOpen) return null;

    // Must select a district if none is selected yet
    const isMandatory = !selectedDistrict;

    return (
        <AnimatePresence>
            {isDistrictSelectorOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-brand-primary/95 backdrop-blur-md"
                        onClick={() => !isMandatory && setIsDistrictSelectorOpen(false)}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="relative bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-lg border border-white/20"
                    >
                        <div className="p-8 text-center bg-gradient-to-br from-brand-primary/5 to-transparent border-b border-gray-100">
                            <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Map className="w-8 h-8 text-brand-primary" />
                            </div>
                            <h2 className="text-3xl font-bold text-brand-text-dark mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                Choose Your City
                            </h2>
                            <p className="text-brand-text-gray font-medium">
                                Select a city to find the best messes and hostels.
                            </p>
                        </div>

                        <div className="p-6 bg-brand-secondary/30">
                            <div className="grid grid-cols-1 gap-3">
                                {availableDistricts.map((district) => (
                                    <button
                                        key={district.id}
                                        disabled={!district.active}
                                        onClick={() => setSelectedDistrict(district.id)}
                                        className={`relative group flex items-center p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                                            !district.active 
                                                ? 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed' 
                                                : selectedDistrict === district.id
                                                    ? 'bg-brand-primary/5 border-brand-primary shadow-sm'
                                                    : 'bg-white border-gray-100 hover:border-brand-primary/40 hover:shadow-md'
                                        }`}
                                    >
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 mr-4 transition-colors ${
                                            selectedDistrict === district.id ? 'bg-brand-primary text-white' : 'bg-brand-secondary text-brand-primary group-hover:bg-brand-primary/10'
                                        }`}>
                                            <MapPin size={24} />
                                        </div>
                                        
                                        <div className="flex-1">
                                            <h3 className={`text-lg font-bold ${selectedDistrict === district.id ? 'text-brand-primary' : 'text-brand-text-dark'}`}>
                                                {district.name}
                                            </h3>
                                            {!district.active && (
                                                <span className="text-xs font-semibold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full inline-block mt-1">
                                                    Coming Soon
                                                </span>
                                            )}
                                        </div>

                                        {selectedDistrict === district.id ? (
                                            <CheckCircle2 size={24} className="text-brand-primary shrink-0" />
                                        ) : district.active ? (
                                            <ChevronRight size={20} className="text-gray-300 group-hover:text-brand-primary/50 shrink-0 transition-transform group-hover:translate-x-1" />
                                        ) : null}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {!isMandatory && (
                            <div className="p-4 bg-white border-t border-gray-100 text-center">
                                <button
                                    onClick={() => setIsDistrictSelectorOpen(false)}
                                    className="text-brand-text-gray hover:text-brand-text-dark font-medium px-4 py-2"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default DistrictSelector;
