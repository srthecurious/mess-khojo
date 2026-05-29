import React, { useState } from 'react';
import { Database, Search, Server, EyeOff, Eye, CheckCircle, TrendingUp, Edit3, MapPin, SlidersHorizontal, Navigation, Compass } from 'lucide-react';

const MessesTab = ({
    messes,
    searchQuery,
    setSearchQuery,
    handleToggleVisibility,
    handleToggleSponsored,
    handleEditItem
}) => {
    const [visibilityFilter, setVisibilityFilter] = useState('all'); // 'all', 'public', 'private', 'sponsored', 'sourced'

    // Handle Google Maps URL
    const getGoogleMapsUrl = (lat, lng) => {
        return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    };

    // Filter messes based on search and visibility filters
    const filteredMesses = messes.filter(mess => {
        // Text Search
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch = !q ||
            (mess.name || '').toLowerCase().includes(q) ||
            (mess.address || '').toLowerCase().includes(q) ||
            (mess.district || '').toLowerCase().includes(q) ||
            (mess.id || '').toLowerCase().includes(q);

        // Visibility Filter
        if (!matchesSearch) return false;
        
        switch (visibilityFilter) {
            case 'public':
                return !mess.hidden;
            case 'private':
                return !!mess.hidden;
            case 'sponsored':
                return !!mess.isSponsored;
            case 'sourced':
                return !!mess.isUserSourced;
            case 'all':
            default:
                return true;
        }
    });

    const sortedMesses = [...filteredMesses].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Title & Filter Control Bar */}
            <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
                <h2 className="text-2xl font-bold flex items-center gap-3 text-indigo-400">
                    <Database size={28} />
                    Mess Directory
                </h2>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* Search Input */}
                    <div className="relative flex-grow sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text"
                            placeholder="Search messes..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none text-sm shadow-inner"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Visibility Dropdown */}
                    <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 shrink-0">
                        <SlidersHorizontal size={14} className="text-slate-400" />
                        <span className="text-xs font-semibold text-slate-400">Type:</span>
                        <select
                            value={visibilityFilter}
                            onChange={(e) => setVisibilityFilter(e.target.value)}
                            className="bg-transparent text-slate-200 text-sm focus:outline-none cursor-pointer"
                        >
                            <option value="all" className="bg-slate-800">All Messes</option>
                            <option value="public" className="bg-slate-800">Public Listings</option>
                            <option value="private" className="bg-slate-800">Private (Hidden)</option>
                            <option value="sponsored" className="bg-slate-800">Sponsored</option>
                            <option value="sourced" className="bg-slate-800">User Sourced</option>
                        </select>
                    </div>

                    <span className="bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full text-xs font-bold border border-indigo-500/20 shrink-0 text-center">
                        {sortedMesses.length} Total
                    </span>
                </div>
            </div>

            {/* Messes directory cards */}
            <div className="grid grid-cols-1 gap-4">
                {sortedMesses.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 bg-slate-800/50 rounded-2xl border border-slate-700 border-dashed">
                        No messes found matching your filter criteria.
                    </div>
                ) : (
                    sortedMesses.map(mess => {
                        const hasGPS = mess.latitude !== undefined && mess.latitude !== null && mess.longitude !== undefined && mess.longitude !== null;
                        
                        return (
                            <div key={mess.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 md:p-6 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-6 group hover:border-indigo-500/50 transition-all shadow-lg hover:shadow-indigo-500/5">
                                <div className="flex items-start gap-4 flex-grow">
                                    <div className="relative shrink-0">
                                        <div className="w-16 h-16 rounded-2xl bg-slate-700/50 flex items-center justify-center text-indigo-400 overflow-hidden border border-slate-650">
                                            {mess.posterUrl ? (
                                                <img src={mess.posterUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <Server size={24} />
                                            )}
                                        </div>
                                        {mess.hidden && (
                                            <div className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full shadow-lg border border-rose-600">
                                                <EyeOff size={10} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="text-lg font-bold text-white leading-tight">
                                                {mess.name || mess.messName || '(No Name)'}
                                            </h3>

                                            {/* Sourced Badge */}
                                            {mess.isUserSourced && (
                                                <span className="text-[9px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20 uppercase font-black tracking-wide">
                                                    Sourced
                                                </span>
                                            )}

                                            {/* Mess Type Badges */}
                                            {Array.isArray(mess.messType) ? (
                                                mess.messType.map((t, idx) => (
                                                    <span key={idx} className="text-[9px] bg-indigo-500/15 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/25 font-bold uppercase tracking-wider">
                                                        {t}
                                                    </span>
                                                ))
                                            ) : mess.messType && (
                                                <span className="text-[9px] bg-indigo-500/15 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/25 font-bold uppercase tracking-wider">
                                                    {mess.messType}
                                                </span>
                                            )}

                                            {/* District Badge */}
                                            <span className="text-[9px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 font-bold uppercase tracking-wide">
                                                {mess.district || 'balasore'}
                                            </span>
                                        </div>
                                        
                                        <p className="text-slate-400 text-sm line-clamp-1 flex items-center gap-1.5 font-medium">
                                            <MapPin size={13} className="text-amber-500 shrink-0" /> 
                                            {mess.address || mess.landmark || '—'}
                                        </p>
                                        
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 text-[10px] font-mono">
                                            <span>ID: {mess.id}</span>
                                            {mess.contact && <span>• Phone: {mess.contact}</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-row md:flex-row items-center gap-3 shrink-0 justify-end">
                                    {/* GPS Maps Button */}
                                    {hasGPS && (
                                        <a
                                            href={getGoogleMapsUrl(mess.latitude, mess.longitude)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border bg-slate-900 border-slate-750 text-emerald-400 hover:bg-slate-750 hover:border-slate-600"
                                            title="Open Location in Google Maps"
                                        >
                                            <Navigation size={14} className="fill-emerald-400/10" />
                                            Open Maps
                                        </a>
                                    )}

                                    <button
                                        onClick={() => handleToggleVisibility(mess.id, mess.hidden)}
                                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${mess.hidden
                                            ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20'
                                            : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'
                                            }`}
                                        title={mess.hidden ? "Show Listing" : "Hide Listing"}
                                    >
                                        {mess.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                                        {mess.hidden ? 'Private' : 'Public'}
                                    </button>

                                    <button
                                        onClick={() => handleToggleSponsored(mess.id, mess.isSponsored)}
                                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${mess.isSponsored
                                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20'
                                            : 'bg-slate-700/50 text-slate-400 border-slate-650 hover:bg-slate-700'
                                            }`}
                                        title={mess.isSponsored ? "Remove Sponsorship" : "Make Sponsored"}
                                    >
                                        {mess.isSponsored ? <CheckCircle size={14} /> : <TrendingUp size={14} />}
                                        {mess.isSponsored ? 'Sponsored' : 'Sponsor'}
                                    </button>

                                    <button
                                        onClick={() => handleEditItem(mess, 'mess')}
                                        className="p-2 bg-slate-700 hover:bg-slate-650 text-slate-300 rounded-xl transition-all border border-slate-650 shrink-0"
                                        title="Edit Mess Profile"
                                    >
                                        <Edit3 size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default MessesTab;
