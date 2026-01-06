import React, { useState, useEffect } from 'react';
import { Filter, X, Check, Search } from 'lucide-react';
import MultiSelectDropdown from './MultiSelectDropdown';

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
        ...Object.values(filters.amenities)
    ].filter(Boolean).length;

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* 3D Glassmorphic Filter Container */}
            <div
                className="relative z-30 bg-gradient-to-br from-white/95 via-white/90 to-purple-50/80 backdrop-blur-xl rounded-3xl border border-white/60"
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
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/5 via-transparent to-blue-400/5 pointer-events-none rounded-3xl overflow-hidden"></div>
                {/* Mobile Filter Toggle */}
                <div className="md:hidden p-3 flex justify-between items-center sticky top-0 z-10 bg-white rounded-3xl">
                    <div className="flex items-center gap-2 w-full">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Search by mess name"
                                className="w-full px-4 py-2.5 bg-white rounded-xl text-sm border border-gray-200 focus:ring-2 focus:ring-purple-200 focus:border-purple-300 outline-none transition-all shadow-sm placeholder:text-gray-400"
                                value={filters.location}
                                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                            />
                        </div>

                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shrink-0 ${isOpen || activeFilterCount > 0
                                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
                                : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700'
                                }`}
                        >
                            <Filter size={18} />
                            {activeFilterCount > 0 && <span className="bg-white text-purple-600 text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">{activeFilterCount}</span>}
                        </button>
                    </div>
                </div>

                {/* Filter Content */}
                <div className={`${isOpen ? 'block' : 'hidden'} md:block p-6 md:p-8 relative z-10 rounded-b-3xl`}>
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">

                        <div className="w-full md:w-1/4">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Mess Type</label>
                            <select
                                className="w-full px-4 py-2 rounded-xl border-2 border-purple-100 bg-white/70 backdrop-blur-sm focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none transition-all shadow-sm hover:shadow-md font-serif text-black"
                                value={filters.messType}
                                onChange={(e) => setFilters({ ...filters, messType: e.target.value })}
                            >
                                <option value="">All</option>
                                <option value="Boys">Boys</option>
                                <option value="Girls">Girls</option>
                                <option value="Coed">Coed</option>
                            </select>
                        </div>

                        {/* Distance Filter Removed */}

                        {/* Amenities */}
                        <div className="w-full md:flex-1">
                            <MultiSelectDropdown
                                label="Amenities"
                                options={[
                                    { key: 'wifi', label: 'WiFi' },
                                    { key: 'ac', label: 'AC' },
                                    { key: 'food', label: 'Food' },
                                    { key: 'inverter', label: 'Inverter' },
                                ]}
                                selected={filters.amenities}
                                onChange={(key, checked) => setFilters(prev => ({
                                    ...prev,
                                    amenities: { ...prev.amenities, [key]: checked }
                                }))}
                                theme="light"
                                color="purple"
                            />
                        </div>

                        {/* Availability Toggle - Text First, then Toggle Button */}
                        <div className="flex items-center gap-3 pb-2 w-full md:w-auto justify-between md:justify-start">
                            <label className="relative inline-flex items-center cursor-pointer group select-none flex-grow md:flex-grow-0 justify-start w-full md:w-auto">
                                <span className="mr-3 text-sm font-bold text-gray-700 group-hover:text-purple-600 transition-colors whitespace-nowrap flex-shrink-0">Available Only</span>
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={filters.availableOnly}
                                    onChange={(e) => setFilters({ ...filters, availableOnly: e.target.checked })}
                                />
                                <div className="relative w-14 h-7 bg-gradient-to-r from-gray-200 to-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-200 rounded-full peer peer-checked:after:translate-x-7 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border-2 after:rounded-full after:h-6 after:w-6 after:transition-all after:shadow-md peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-purple-600 shadow-inner"></div>
                            </label>
                        </div>

                        {/* Clear Filters Button */}
                        {activeFilterCount > 0 && (
                            <div className="pb-2">
                                <button
                                    onClick={clearFilters}
                                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-bold rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-md hover:shadow-lg hover:scale-105 active:scale-95 flex items-center gap-2"
                                    title="Clear all filters"
                                >
                                    <X size={16} />
                                    Clear All
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3D Bottom Edge Effect */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400/20 via-blue-400/20 to-purple-400/20"></div>
            </div>
        </div>
    );
};

export default FilterBar;
