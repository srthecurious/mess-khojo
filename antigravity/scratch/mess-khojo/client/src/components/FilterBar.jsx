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
            waterFilter: false,
            tableChair: false
        },
        availableOnly: false
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
                waterFilter: false,
                tableChair: false
            },
            availableOnly: false
        });
    };

    const activeFilterCount = [
        filters.location,
        filters.minPrice,
        filters.maxPrice,
        filters.availableOnly,
        ...Object.values(filters.amenities)
    ].filter(Boolean).length;

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Mobile Filter Toggle */}
                <div className="md:hidden p-3 flex justify-between items-center bg-white border-b border-gray-100 sticky top-0 z-10">
                    <div className="flex items-center gap-3 w-full">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search areas..."
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-full text-sm border-none focus:ring-2 focus:ring-purple-100 outline-none"
                                value={filters.location}
                                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                            />
                        </div>

                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-full border text-sm font-medium transition-colors ${isOpen || activeFilterCount > 0
                                ? 'bg-purple-50 border-purple-200 text-purple-700'
                                : 'bg-white border-gray-200 text-gray-700'
                                }`}
                        >
                            <Filter size={16} />
                            {activeFilterCount > 0 && <span className="bg-purple-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{activeFilterCount}</span>}
                        </button>
                    </div>
                </div>

                {/* Filter Content */}
                <div className={`${isOpen ? 'block' : 'hidden'} md:block p-6`}>
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">

                        {/* Search Text */}
                        <div className="w-full md:w-1/4">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Search Text</label>
                            <input
                                type="text"
                                placeholder="e.g. Indrapuri, MP Nagar"
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                                value={filters.location}
                                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                            />
                        </div>

                        {/* Price Range */}
                        <div className="w-full md:w-1/4">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Monthly Rent (₹)</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                                    value={filters.minPrice}
                                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                                />
                                <span className="text-gray-400">-</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                                    value={filters.maxPrice}
                                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Amenities */}
                        <div className="w-full md:flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { key: 'wifi', label: 'WiFi' },
                                    { key: 'ac', label: 'AC' },
                                    { key: 'food', label: 'Food' },
                                    { key: 'inverter', label: 'Inverter' },
                                    { key: 'waterFilter', label: 'Water Filter' },
                                    { key: 'tableChair', label: 'Table/Chair' },
                                ].map(({ key, label }) => (
                                    <button
                                        key={key}
                                        onClick={() => handleAmenityChange(key)}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all flex items-center gap-1.5 ${filters.amenities[key]
                                            ? 'bg-purple-50 border-purple-200 text-purple-700'
                                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                            }`}
                                    >
                                        {filters.amenities[key] && <Check size={14} />}
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Availability Toggle */}
                        <div className="flex items-center gap-3 pb-2">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={filters.availableOnly}
                                    onChange={(e) => setFilters({ ...filters, availableOnly: e.target.checked })}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                <span className="ml-3 text-sm font-medium text-gray-700">Available Only</span>
                            </label>
                        </div>

                        {/* Clear Button (Desktop) */}
                        <div className="hidden md:block pb-2">
                            {activeFilterCount > 0 && (
                                <button
                                    onClick={clearFilters}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                    title="Clear all filters"
                                >
                                    <X size={20} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilterBar;
