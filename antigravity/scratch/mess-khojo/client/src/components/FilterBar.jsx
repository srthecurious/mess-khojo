import React, { useState, useEffect } from 'react';
import { Filter, X, Check, Search } from 'lucide-react';

const FilterBar = ({ onFilterChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [filters, setFilters] = useState({
        location: '',
        minPrice: '',
        maxPrice: '',
        amenities: {
            wifi: false,
            inverter: false,
            ac: false,
            food: false,
            food: false
        },
        availableOnly: false,
        messType: '',
        maxDistance: ''
    });

    // Debounce filter changes to avoid excessive updates
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            onFilterChange(filters);
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [filters, onFilterChange]);

    const handleAmenityChange = (key) => {
        setFilters(prev => ({
            ...prev,
            amenities: {
                ...prev.amenities,
                [key]: !prev.amenities[key]
            }
        }));
    };

    const clearFilters = () => {
        setFilters({
            location: '',
            minPrice: '',
            maxPrice: '',
            amenities: {
                wifi: false,
                inverter: false,
                ac: false,
                food: false,
                food: false
            },
            availableOnly: false,
            messType: '',
            maxDistance: ''
        });
    };

    const activeFilterCount = [
        filters.location,
        filters.minPrice,
        filters.maxPrice,
        filters.availableOnly,
        filters.messType,
        filters.maxDistance,
        ...Object.values(filters.amenities)
    ].filter(Boolean).length;

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 mt-8">
            {/* 3D Glassmorphic Filter Container */}
            <div
                className="relative bg-gradient-to-br from-white/95 via-white/90 to-purple-50/80 backdrop-blur-xl rounded-3xl border border-white/60 overflow-hidden"
                style={{
                    boxShadow: `
                        0 8px 32px rgba(139, 92, 246, 0.15),
                        0 2px 8px rgba(0, 0, 0, 0.05),
                        inset 0 1px 0 rgba(255, 255, 255, 0.8),
                        inset 0 -1px 0 rgba(0, 0, 0, 0.05)
                    `,
                    transform: 'translateZ(0)',
                }}
            >
                {/* Subtle gradient overlay for depth */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/5 via-transparent to-blue-400/5 pointer-events-none"></div>
                {/* Mobile Filter Toggle */}
                <div className="md:hidden p-4 flex justify-between items-center sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-purple-100/50">
                    <div className="flex items-center gap-3 w-full">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search areas..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white/60 backdrop-blur-sm rounded-2xl text-sm border border-purple-100 focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none transition-all shadow-sm"
                                value={filters.location}
                                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                            />
                        </div>

                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 text-sm font-bold transition-all shadow-md ${isOpen || activeFilterCount > 0
                                ? 'bg-gradient-to-r from-purple-500 to-purple-600 border-purple-400 text-white shadow-purple-300/50'
                                : 'bg-white/80 backdrop-blur-sm border-purple-200 text-purple-700 hover:border-purple-300'
                                }`}
                        >
                            <Filter size={16} />
                            {activeFilterCount > 0 && <span className="bg-white text-purple-600 text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">{activeFilterCount}</span>}
                        </button>
                    </div>
                </div>

                {/* Filter Content */}
                <div className={`${isOpen ? 'block' : 'hidden'} md:block p-6 md:p-8 relative z-10`}>
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">

                        {/* Search Text */}
                        <div className="w-full md:w-1/4">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Search Text</label>
                            <input
                                type="text"
                                placeholder="e.g. Indrapuri, MP Nagar"
                                className="w-full px-4 py-3 rounded-xl border-2 border-purple-100 bg-white/70 backdrop-blur-sm focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none transition-all shadow-sm hover:shadow-md"
                                value={filters.location}
                                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                            />
                        </div>

                        {/* Price Range */}
                        <div className="w-full md:w-1/4">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Monthly Rent (₹)</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    className="w-full px-4 py-3 rounded-xl border-2 border-purple-100 bg-white/70 backdrop-blur-sm focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none transition-all shadow-sm hover:shadow-md"
                                    value={filters.minPrice}
                                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                                />
                                <span className="text-purple-300 font-bold">-</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    className="w-full px-4 py-3 rounded-xl border-2 border-purple-100 bg-white/70 backdrop-blur-sm focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none transition-all shadow-sm hover:shadow-md"
                                    value={filters.maxPrice}
                                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Gender Filter */}
                        <div className="w-full md:w-1/6">
                            <label className="block text-sm font-bold text-black mb-2 font-serif">Mess Type</label>
                            <select
                                className="w-full px-4 py-3 rounded-xl border-2 border-purple-100 bg-white/70 backdrop-blur-sm focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none transition-all shadow-sm hover:shadow-md font-serif text-black"
                                value={filters.messType}
                                onChange={(e) => setFilters({ ...filters, messType: e.target.value })}
                            >
                                <option value="">All</option>
                                <option value="Boys">Boys</option>
                                <option value="Girls">Girls</option>
                                <option value="Coed">Coed</option>
                            </select>
                        </div>

                        {/* Distance Filter */}
                        <div className="w-full md:w-1/6">
                            <label className="block text-sm font-bold text-black mb-2 font-serif">Max Dist (km)</label>
                            <input
                                type="number"
                                placeholder="Any"
                                className="w-full px-4 py-3 rounded-xl border-2 border-purple-100 bg-white/70 backdrop-blur-sm focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none transition-all shadow-sm hover:shadow-md font-serif text-black"
                                value={filters.maxDistance}
                                onChange={(e) => setFilters({ ...filters, maxDistance: e.target.value })}
                            />
                        </div>

                        {/* Amenities */}
                        <div className="w-full md:flex-1">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Amenities</label>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { key: 'wifi', label: 'WiFi' },
                                    { key: 'ac', label: 'AC' },
                                    { key: 'food', label: 'Food' },
                                    { key: 'inverter', label: 'Inverter' },
                                ].map(({ key, label }) => (
                                    <button
                                        key={key}
                                        onClick={() => handleAmenityChange(key)}
                                        className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all flex items-center gap-1.5 shadow-sm hover:shadow-md ${filters.amenities[key]
                                            ? 'bg-gradient-to-r from-purple-500 to-purple-600 border-purple-400 text-white shadow-purple-300/50 scale-105'
                                            : 'bg-white/60 backdrop-blur-sm border-purple-100 text-gray-700 hover:border-purple-300 hover:bg-white/80'
                                            }`}
                                    >
                                        {filters.amenities[key] && <Check size={14} />}
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Availability Toggle - Text First, then Toggle Button */}
                        <div className="flex items-center gap-3 pb-2 w-full md:w-auto justify-between md:justify-start">
                            <label className="relative inline-flex items-center cursor-pointer group select-none flex-grow md:flex-grow-0 justify-start w-full md:w-auto">
                                <span className="mr-3 text-sm font-bold text-black group-hover:text-purple-600 transition-colors font-serif whitespace-nowrap flex-shrink-0">Available Only</span>
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={filters.availableOnly}
                                    onChange={(e) => setFilters({ ...filters, availableOnly: e.target.checked })}
                                />
                                <div className="relative w-14 h-7 bg-gradient-to-r from-gray-200 to-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-200 rounded-full peer peer-checked:after:translate-x-7 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border-2 after:rounded-full after:h-6 after:w-6 after:transition-all after:shadow-md peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-purple-600 shadow-inner"></div>
                            </label>
                        </div>

                        {/* Clear Button (Desktop) */}
                        <div className="hidden md:block pb-2">
                            {activeFilterCount > 0 && (
                                <button
                                    onClick={clearFilters}
                                    className="p-2.5 text-gray-400 hover:text-white hover:bg-gradient-to-r hover:from-red-400 hover:to-red-500 rounded-xl transition-all shadow-sm hover:shadow-md border-2 border-transparent hover:border-red-300"
                                    title="Clear all filters"
                                >
                                    <X size={20} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3D Bottom Edge Effect */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400/20 via-blue-400/20 to-purple-400/20"></div>
            </div>
        </div>
    );
};

export default FilterBar;
