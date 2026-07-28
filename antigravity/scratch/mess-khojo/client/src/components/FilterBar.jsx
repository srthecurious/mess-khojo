import React, { useState, useMemo } from 'react';
import { Filter, X, Check, Search, MapPin, Loader2, TrendingUp, Map, Home } from 'lucide-react';
import MultiSelectDropdown from './MultiSelectDropdown';
import { useDistrict } from '../context/DistrictContext';

const FilterBar = ({ onFilterChange, currentFilters, onGps, onMap, loadingLocation, userLocation, messes = [] }) => {
    const { districtConfig, localitiesConfig, getLocalitiesForCity } = useDistrict();
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
        // Build locality names from context (with static fallback)
        const districtCities = districtConfig?.cities || [];
        const localitySet = new Set();
        districtCities.forEach(city => {
            getLocalitiesForCity(city.id, localitiesConfig).forEach(l => localitySet.add(l));
        });
        (districtConfig?.landmarks || []).forEach(l => localitySet.add(l.name));

        const allLocalities = Array.from(localitySet).map(name => ({ name, type: 'locality', icon: MapPin }));

        const validLocalities = allLocalities.filter(loc => {
            return messes.some(mess => {
                const area = (mess.locality || mess.landmark || '').toLowerCase();
                const ad = (mess.address || '').toLowerCase();
                const q = loc.name.toLowerCase();
                return area.includes(q) || ad.includes(q);
            });
        });

        const sponsoredMesses = messes
            .filter(m => m.isSponsored && m.name)
            .sort((a, b) => (a.sponsorRank || 999) - (b.sponsorRank || 999))
            .map(m => ({
                name: m.name,
                type: 'mess',
                icon: TrendingUp,
                label: 'Sponsored',
                posterUrl: m.posterUrl
            }));

        return [...sponsoredMesses, ...validLocalities];
    }, [messes, districtConfig, localitiesConfig, getLocalitiesForCity]);

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

    const renderSuggestionsDropdown = (show, isMobile = false) => {
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
        const localities = fuzzyMatched.filter(s => s.type === 'locality');

        const totalResults = activeRecents.length + sponsored.length + localities.length;

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
                {item.type === 'mess' && item.posterUrl ? (
                    <img
                        src={item.posterUrl}
                        alt={item.name}
                        className="w-8 h-8 rounded-lg object-cover border border-purple-100 shrink-0 group-hover:scale-105 transition-transform"
                    />
                ) : (
                    <div className={`p-1.5 rounded-full transition-colors ${item.type === 'recent' ? 'bg-gray-50 text-gray-400 group-hover:bg-purple-100 group-hover:text-purple-600' : 'bg-gray-100 group-hover:bg-purple-100 group-hover:text-purple-600'}`}>
                        <item.icon size={14} className={item.type === 'locality' ? 'text-gray-500 group-hover:text-purple-600' : (item.type === 'recent' ? '' : 'text-blue-500 group-hover:text-purple-600')} />
                    </div>
                )}
                <div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700 block">
                        {renderHighlightedText(item.name, searchTerm)}
                    </span>
                    <span className="text-[10px] text-gray-400 capitalize block -mt-0.5">{item.type === 'locality' ? 'Locality' : (item.label || 'Recommended')}</span>
                </div>
            </button>
        );

        return (
            <div className={`absolute z-50 bg-white rounded-xl shadow-lg border border-gray-100 mt-2 overflow-hidden top-full ${isMobile ? 'left-3 right-3 w-auto' : 'left-0 w-full'
                }`}>
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

                    {localities.length > 0 && (
                        <div className="p-2 border-b border-gray-50">
                            <div className="text-[10px] font-bold text-gray-400 uppercase px-3 py-1.5 tracking-wider">Popular Areas</div>
                            {localities.map((item, idx) => renderSuggestion(item, `loc-${idx}`))}
                        </div>
                    )}

                </div>
            </div>
        );
    };



    const _clearFilters = () => {
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
            maxDistance: '',
            occupancy: ''
        });
    };

    const _activeFilterCount = [
        filters.location,
        filters.minPrice,
        filters.maxPrice,
        filters.availableOnly,
        filters.messType,
        ...Object.values(filters.amenities)
    ].filter(Boolean).length;

    return (
        <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
            {/* Filter Container */}
            <div
                className="relative z-30 bg-transparent"
                style={{
                    transform: 'translateZ(0)',
                }}
            >
                {/* Mobile Filter Toggle */}
                <div className="md:hidden py-3 flex justify-between items-center sticky top-0 z-10 bg-transparent relative" ref={mobileSearchRef}>
                    <div className="flex items-center gap-2 w-full">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input
                                ref={mobileInputRef}
                                type="text"
                                placeholder="Search locality or mess..."
                                className="w-full pl-8 pr-8 py-2.5 bg-white rounded-xl text-sm border border-gray-200 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/30 outline-none transition-all placeholder:text-gray-400"
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
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* GPS Button — between search and filter */}
                        {onGps && (
                            <button
                                onClick={onGps}
                                disabled={loadingLocation}
                                title={userLocation ? 'Location Active' : 'Use GPS'}
                                className={`p-2.5 rounded-xl shrink-0 transition-all ${userLocation
                                        ? 'bg-green-500 text-white'
                                        : 'bg-white border border-brand-primary/20 text-brand-primary hover:bg-brand-primary/5 hover:border-brand-primary/40'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {loadingLocation
                                    ? <Loader2 size={18} className="animate-spin" />
                                    : <MapPin size={18} />}
                            </button>
                        )}

                        {/* Map Button — between GPS/Search and filter */}
                        {onMap && (
                            <button
                                onClick={onMap}
                                title="Select location on Map"
                                className="p-2.5 rounded-xl shrink-0 transition-all bg-white border border-brand-primary/20 text-brand-primary hover:bg-brand-primary/5 hover:border-brand-primary/40"
                            >
                                <Map size={18} />
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
                            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0 bg-brand-primary hover:bg-brand-primary-hover text-white`}
                        >
                            <Filter size={18} />
                        </button>
                    </div>
                    {renderSuggestionsDropdown(showSuggestionsMobile, true)}
                </div>

                {/* Filter Content */}
                <div className={`${isOpen ? 'block' : 'hidden'} md:block p-4 md:p-0 relative z-10 rounded-b-3xl`}>

                    {/* Desktop Search Bar (Horizontal Aligned Row) */}
                    <div className="hidden md:flex flex-row gap-3 items-center w-full">
                        {/* Search Input field */}
                        <div className="flex-[2] relative" ref={desktopSearchRef}>
                            <div className="relative">
                                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    ref={desktopInputRef}
                                    type="text"
                                    placeholder="Search for Mess Name or Locality"
                                    className="w-full pl-10 pr-10 bg-white border border-gray-200 rounded-xl text-sm focus:border-brand-primary/30 focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all shadow-sm placeholder:text-gray-400 text-black font-sans"
                                    style={{ height: '48px' }}
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
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                            {renderSuggestionsDropdown(showSuggestionsDesktop)}
                        </div>

                        {/* GPS Location Button */}
                        {onGps && (
                            <button
                                onClick={onGps}
                                disabled={loadingLocation}
                                title={userLocation ? 'Location Active' : 'Use GPS'}
                                className={`flex items-center justify-center rounded-xl shrink-0 transition-all shadow-sm ${userLocation
                                        ? 'bg-[#300868] text-white'
                                        : 'bg-[#300868] text-white hover:bg-[#250453]'
                                    } disabled:opacity-50`}
                                style={{ height: '48px', width: '48px' }}
                            >
                                {loadingLocation
                                    ? <Loader2 size={18} className="animate-spin" />
                                    : <MapPin size={18} />}
                            </button>
                        )}

                        {/* Select on Map Button */}
                        {onMap && (
                            <button
                                onClick={onMap}
                                title="Select location on Map"
                                className="flex items-center justify-center rounded-xl shrink-0 transition-all shadow-sm bg-white border border-gray-200 text-brand-primary hover:bg-gray-50"
                                style={{ height: '48px', width: '48px' }}
                            >
                                <Map size={18} />
                            </button>
                        )}

                        {/* Amenities Dropdown */}
                        <div className="flex-[1] min-w-[210px]">
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
                                color="brand"
                                showLabel={false}
                                placeholder="Amenities"
                                prefixIcon={Home}
                            />
                        </div>

                        {/* Available Only Toggle Box */}
                        <div className="flex items-center justify-between gap-3 bg-white border border-gray-200 rounded-xl px-4 shadow-sm select-none shrink-0" style={{ height: '48px' }}>
                            <span className="text-sm text-gray-500 font-medium whitespace-nowrap">Available Only</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={filters.availableOnly}
                                    onChange={(e) => setFilters({ ...filters, availableOnly: e.target.checked })}
                                />
                                <div className="relative w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#300868]"></div>
                            </label>
                        </div>

                        {/* Search Action Button */}
                        <button
                            type="button"
                            onClick={() => {
                                if (document.activeElement) {
                                    document.activeElement.blur();
                                }
                            }}
                            className="flex items-center justify-center px-6 rounded-xl text-sm font-bold bg-[#300868] hover:bg-[#250453] text-white transition-all shadow-sm hover:shadow-md shrink-0"
                            style={{ height: '48px' }}
                        >
                            Search &rarr;
                        </button>

                    </div>

                    {/* Mobile/Tablet Stacked Content (Only visible when toggled open on mobile) */}
                    <div className="flex flex-col gap-4 md:hidden">
                        {/* Amenities */}
                        <div className="w-full">
                            <MultiSelectDropdown
                                label="Amenities"
                                showLabel={false}
                                placeholder="Amenities"
                                prefixIcon={Home}
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
                                color="brand"
                            />
                        </div>

                        {/* Available Only */}
                        <div className="flex items-center gap-3 justify-between py-1 border-t border-gray-100">
                            <label className="relative inline-flex items-center cursor-pointer group select-none flex-grow justify-between w-full">
                                <span className="text-sm font-bold text-gray-700">Available Only</span>
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={filters.availableOnly}
                                    onChange={(e) => setFilters({ ...filters, availableOnly: e.target.checked })}
                                />
                                <div className="relative w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-7 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border-2 after:rounded-full after:h-6 after:w-6 after:transition-all after:shadow-md peer-checked:bg-brand-primary"></div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilterBar;
