import React, { useState, useMemo } from 'react';
import { Filter, X, Check, Search, MapPin, Loader2, TrendingUp } from 'lucide-react';
import MultiSelectDropdown from './MultiSelectDropdown';

const FilterBar = ({ onFilterChange, currentFilters, onGps, loadingLocation, userLocation, messes = [] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showSuggestionsMobile, setShowSuggestionsMobile] = useState(false);
    const [showSuggestionsDesktop, setShowSuggestionsDesktop] = useState(false);
    const mobileInputRef = React.useRef(null);
    const desktopInputRef = React.useRef(null);
    const mobileSearchRef = React.useRef(null);
    const desktopSearchRef = React.useRef(null);
    const mobileJustFocused = React.useRef(false);
    const desktopJustFocused = React.useRef(false);

    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target)) {
                setShowSuggestionsMobile(false);
            }
            if (desktopSearchRef.current && !desktopSearchRef.current.contains(event.target)) {
                setShowSuggestionsDesktop(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, []);

    // Memoize suggestions so we don't recalculate on every render
    const allSuggestions = useMemo(() => {
        const predefinedLandmarks = [
            { name: 'Mansingh Bazar', type: 'landmark', icon: MapPin },
            { name: 'Fakir Mohan Golei', type: 'landmark', icon: MapPin },
            { name: 'Station Square', type: 'landmark', icon: MapPin },
            { name: 'Remuna', type: 'landmark', icon: MapPin },
            { name: 'Sahadev Khuntha', type: 'landmark', icon: MapPin },
            { name: 'Azimabad', type: 'landmark', icon: MapPin },
            { name: 'ITB', type: 'landmark', icon: MapPin },
            { name: 'Balasore', type: 'landmark', icon: MapPin }
        ];

        const validLandmarks = predefinedLandmarks.filter(landmark => {
            return messes.some(mess => {
                const nm = mess.name || '';
                const ad = mess.address || '';
                const q = landmark.name.toLowerCase();
                return nm.toLowerCase().includes(q) || ad.toLowerCase().includes(q);
            });
        });

        const sponsoredMesses = messes
            .filter(m => m.isSponsored && m.name)
            .sort((a, b) => (a.sponsorRank || 999) - (b.sponsorRank || 999))
            .map(m => ({
            name: m.name,
            type: 'mess',
            icon: TrendingUp,
            label: 'Sponsored'
        }));
        
        return [...sponsoredMesses, ...validLandmarks];
    }, [messes]);

    const filters = currentFilters || {
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
    };

    const setFilters = (newFiltersOrFn) => {
        if (typeof newFiltersOrFn === 'function') {
            onFilterChange(newFiltersOrFn(filters));
        } else {
            onFilterChange(newFiltersOrFn);
        }
    };

    // Enhanced Search State & Utilities
    // Enhanced Search State & Utilities
    const [recentSearches, setRecentSearches] = useState(() => {
        try {
            const saved = JSON.parse(localStorage.getItem('messkhojo_recent_searches') || '[]');
            return saved.slice(0, 2);
        } catch {
            return [];
        }
    });

    const handleSelectSuggestion = (name) => {
        setFilters({ ...filters, location: name });
        setShowSuggestionsMobile(false);
        setShowSuggestionsDesktop(false);
        const newRecents = [name, ...recentSearches.filter(r => r !== name)].slice(0, 2);
        setRecentSearches(newRecents);
        localStorage.setItem('messkhojo_recent_searches', JSON.stringify(newRecents));
    };

    const isFuzzyMatch = (str, query) => {
        if (!query) return true;
        const s = str.toLowerCase();
        const q = query.toLowerCase();
        if (s.includes(q)) return true;
        
        let qIdx = 0;
        for (let i = 0; i < s.length; i++) {
            if (s[i] === q[qIdx]) qIdx++;
            if (qIdx === q.length) return true;
        }
        return false;
    };

    const renderHighlightedText = (text, highlight) => {
        if (!highlight || !highlight.trim()) return <span>{text}</span>;
        
        if (text.toLowerCase().includes(highlight.toLowerCase())) {
            const regex = new RegExp(`(${highlight})`, 'gi');
            const parts = text.split(regex);
            return (
                <span>
                    {parts.map((part, i) => 
                        regex.test(part) ? <strong key={i} className="text-brand-primary font-bold bg-purple-100 px-0.5 rounded">{part}</strong> : part
                    )}
                </span>
            );
        }
        
        return <span>{text}</span>;
    };

    const renderSuggestionsDropdown = (show) => {
        if (!show) return null;
        const searchTerm = filters.location;
        const fuzzyMatched = searchTerm 
            ? allSuggestions.filter(s => isFuzzyMatch(s.name, searchTerm))
            : allSuggestions;

        const activeRecents = recentSearches
            .filter(r => !searchTerm || isFuzzyMatch(r, searchTerm))
            .slice(0, 2)
            .map(name => ({ name, type: 'recent', label: 'Recent Search', icon: Search }));

        const sponsored = fuzzyMatched.filter(s => s.label === 'Sponsored');
        const landmarks = fuzzyMatched.filter(s => s.type === 'landmark');

        const totalResults = activeRecents.length + sponsored.length + landmarks.length;

        if (searchTerm && totalResults === 0) {
            return null;
        }

        if (totalResults === 0) return null;

        const renderSuggestion = (item, idxPrefix) => (
            <button
                key={`${idxPrefix}-${item.name}`}
                onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelectSuggestion(item.name);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-purple-50 text-left transition-colors rounded-lg group"
            >
                <div className={`p-1.5 rounded-full transition-colors ${item.type === 'recent' ? 'bg-gray-50 text-gray-400 group-hover:bg-purple-100 group-hover:text-purple-600' : 'bg-gray-100 group-hover:bg-purple-100 group-hover:text-purple-600'}`}>
                    <item.icon size={14} className={item.type === 'landmark' ? 'text-gray-500 group-hover:text-purple-600' : (item.type === 'recent' ? '' : 'text-blue-500 group-hover:text-purple-600')} />
                </div>
                <div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700 block">
                        {renderHighlightedText(item.name, searchTerm)}
                    </span>
                    <span className="text-[10px] text-gray-400 capitalize block -mt-0.5">{item.type === 'landmark' ? 'Landmark' : (item.label || 'Recommended')}</span>
                </div>
            </button>
        );

        return (
            <div className="absolute z-50 w-full bg-white rounded-xl shadow-lg border border-gray-100 mt-2 overflow-hidden top-full left-0">
                <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                    
                    {sponsored.length > 0 && (
                        <div className="p-2 border-b border-gray-50 bg-gradient-to-r from-amber-50/30 to-transparent">
                            <div className="text-[10px] font-bold text-amber-600 uppercase px-3 py-1.5 tracking-wider flex items-center gap-1.5">
                                <TrendingUp size={12} strokeWidth={3} /> Sponsored
                            </div>
                            {sponsored.map((item, idx) => renderSuggestion(item, `spons-${idx}`))}
                        </div>
                    )}

                    {activeRecents.length > 0 && (
                        <div className="p-2 border-b border-gray-50">
                            <div className="text-[10px] font-bold text-gray-400 uppercase px-3 py-1.5 tracking-wider">Recent Searches</div>
                            {activeRecents.map((item, idx) => renderSuggestion(item, `recent-${idx}`))}
                        </div>
                    )}

                    {landmarks.length > 0 && (
                        <div className="p-2 border-b border-gray-50">
                            <div className="text-[10px] font-bold text-gray-400 uppercase px-3 py-1.5 tracking-wider">Popular Landmarks</div>
                            {landmarks.map((item, idx) => renderSuggestion(item, `land-${idx}`))}
                        </div>
                    )}

                </div>
            </div>
        );
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
                        <div className="relative flex-1" ref={mobileSearchRef}>
                                <input
                                    ref={mobileInputRef}
                                    type="text"
                                    placeholder="Search by landmark or mess name..."
                                    className="w-full px-4 py-2.5 bg-white rounded-xl text-sm border border-gray-200 focus:ring-2 focus:ring-purple-200 focus:border-purple-300 outline-none transition-all shadow-sm placeholder:text-gray-400"
                                    value={filters.location}
                                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                                    onFocus={() => {
                                        setIsOpen(false); // Close mobile filter panel when search is focused
                                        setShowSuggestionsMobile(true);
                                        mobileJustFocused.current = true;
                                    }}
                                    onBlur={() => setTimeout(() => {
                                        setShowSuggestionsMobile(false);
                                        mobileJustFocused.current = false;
                                    }, 200)}
                                    onClick={() => {
                                        setIsOpen(false); // Close mobile filter panel when search is clicked
                                        if (mobileJustFocused.current) {
                                            mobileJustFocused.current = false;
                                        } else {
                                            setShowSuggestionsMobile(prev => !prev);
                                        }
                                    }}
                                />
                            {filters.location && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setFilters({ ...filters, location: '' });
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            )}
                            {renderSuggestionsDropdown(showSuggestionsMobile)}
                        </div>

                        {/* GPS Button — between search and filter */}
                        {onGps && (
                            <button
                                onClick={onGps}
                                disabled={loadingLocation}
                                title={userLocation ? 'Location Active' : 'Use GPS'}
                                className={`p-2.5 rounded-xl shrink-0 transition-all shadow-md ${
                                    userLocation
                                        ? 'bg-green-500 text-white shadow-green-500/30'
                                        : 'bg-white border border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-400'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {loadingLocation
                                    ? <Loader2 size={18} className="animate-spin" />
                                    : <MapPin size={18} />}
                            </button>
                        )}

                        <button
                            onClick={() => {
                                setIsOpen(!isOpen);
                                setShowSuggestionsMobile(false);
                                setShowSuggestionsDesktop(false);
                                if (mobileInputRef.current) mobileInputRef.current.blur();
                                if (desktopInputRef.current) desktopInputRef.current.blur();
                            }}
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

                        {/* Search Bar - Desktop */}
                        <div className="hidden md:block w-full md:w-1/3">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Search Mess</label>
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1" ref={desktopSearchRef}>
                                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        ref={desktopInputRef}
                                        type="text"
                                        placeholder="Search by landmark or mess name..."
                                        className="w-full pl-10 pr-10 py-2 rounded-xl border-2 border-purple-100 bg-white/70 backdrop-blur-sm focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none transition-all shadow-sm hover:shadow-md font-serif text-black"
                                        value={filters.location}
                                        onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                                        onFocus={() => {
                                            setShowSuggestionsDesktop(true);
                                            desktopJustFocused.current = true;
                                        }}
                                        onBlur={() => setTimeout(() => {
                                            setShowSuggestionsDesktop(false);
                                            desktopJustFocused.current = false;
                                        }, 200)}
                                        onClick={() => {
                                            if (desktopJustFocused.current) {
                                                desktopJustFocused.current = false;
                                            } else {
                                                setShowSuggestionsDesktop(prev => !prev);
                                            }
                                        }}
                                    />
                                    {filters.location && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setFilters({ ...filters, location: '' });
                                            }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                    {renderSuggestionsDropdown(showSuggestionsDesktop)}
                                </div>
                                {/* Desktop GPS Button */}
                                {onGps && (
                                    <button
                                        onClick={onGps}
                                        disabled={loadingLocation}
                                        title={userLocation ? 'Location Active' : 'Use GPS'}
                                        className={`p-2 rounded-xl shrink-0 transition-all shadow-sm flex items-center justify-center ${
                                            userLocation
                                                ? 'bg-green-500 text-white shadow-green-500/30'
                                                : 'bg-white border-2 border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-400'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        style={{ height: '44px', width: '44px' }}
                                    >
                                        {loadingLocation
                                            ? <Loader2 size={20} className="animate-spin" />
                                            : <MapPin size={20} />}
                                    </button>
                                )}
                            </div>
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

                {/* 3D Bottom Edge Effect - REMOVED */}
            </div>
        </div>
    );
};

export default FilterBar;
