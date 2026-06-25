import React, { useState } from 'react';
import { Database, Search, Server, EyeOff, Eye, CheckCircle, TrendingUp, Edit3, MapPin, SlidersHorizontal, Navigation, XCircle, ChevronDown, ChevronRight, BedDouble, Layout, Copy, Check } from 'lucide-react';

const MessesTab = ({
    messes,
    rooms,
    searchQuery,
    setSearchQuery,
    handleToggleVisibility,
    handleToggleSponsored,
    handleEditItem
}) => {
    const [visibilityFilter, setVisibilityFilter] = useState('all'); // 'all', 'public', 'private', 'sponsored', 'sourced'
    const [expandedMessId, setExpandedMessId] = useState(null);
    const [copiedRoomId, setCopiedRoomId] = useState(null);

    const handleCopyRoomId = (id) => {
        navigator.clipboard.writeText(id);
        setCopiedRoomId(id);
        setTimeout(() => {
            setCopiedRoomId(null);
        }, 2000);
    };

    // Handle Google Maps URL
    const getGoogleMapsUrl = (lat, lng) => {
        return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    };

    // Toggle expanded mess
    const toggleExpand = (messId) => {
        setExpandedMessId(prev => prev === messId ? null : messId);
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
                    Mess &amp; Rooms Directory
                </h2>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* Search Input */}
                    <div className="relative flex-grow sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text"
                            placeholder="Search messes..."
                            className="w-full pl-10 pr-10 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none text-sm shadow-inner"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                            >
                                <XCircle size={16} />
                            </button>
                        )}
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
            <div className="grid grid-cols-1 gap-3">
                {sortedMesses.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 bg-slate-800/50 rounded-2xl border border-slate-700 border-dashed">
                        No messes found matching your filter criteria.
                    </div>
                ) : (
                    sortedMesses.map(mess => {
                        const hasGPS = mess.latitude !== undefined && mess.latitude !== null && mess.longitude !== undefined && mess.longitude !== null;
                        const messRooms = (rooms || []).filter(r => r.messId === mess.id);
                        const isExpanded = expandedMessId === mess.id;

                        return (
                            <div
                                key={mess.id}
                                className={`bg-slate-800 border rounded-2xl shadow-lg transition-all duration-200 ${isExpanded ? 'border-indigo-500/60 shadow-indigo-500/10' : 'border-slate-700 hover:border-indigo-500/40'}`}
                            >
                                {/* ── Mess Row ─────────────────────────────────── */}
                                <div className="p-4 md:p-5 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                                    {/* Left: thumbnail + info */}
                                    <div className="flex items-start gap-4 flex-grow min-w-0">
                                        {/* Expand toggle */}
                                        <button
                                            onClick={() => toggleExpand(mess.id)}
                                            className="shrink-0 mt-1 text-slate-500 hover:text-indigo-400 transition-colors"
                                            title={isExpanded ? 'Collapse rooms' : 'Expand rooms'}
                                        >
                                            {isExpanded
                                                ? <ChevronDown size={20} />
                                                : <ChevronRight size={20} />
                                            }
                                        </button>

                                        {/* Thumbnail */}
                                        <div className="relative shrink-0">
                                            <div className="w-14 h-14 rounded-xl bg-slate-700/50 flex items-center justify-center text-indigo-400 overflow-hidden border border-slate-650">
                                                {mess.posterUrl ? (
                                                    <img src={mess.posterUrl} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Server size={22} />
                                                )}
                                            </div>
                                            {mess.hidden && (
                                                <div className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full shadow-lg border border-rose-600">
                                                    <EyeOff size={10} />
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="space-y-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="text-base font-bold text-white leading-tight">
                                                    {mess.name || mess.messName || '(No Name)'}
                                                </h3>

                                                {/* Room count badge */}
                                                <button
                                                    onClick={() => toggleExpand(mess.id)}
                                                    className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-bold transition-all ${
                                                        messRooms.length > 0
                                                            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20'
                                                            : 'bg-slate-700 text-slate-500 border-slate-600'
                                                    }`}
                                                    title="Toggle rooms"
                                                >
                                                    <BedDouble size={11} />
                                                    {messRooms.length} {messRooms.length === 1 ? 'Room' : 'Rooms'}
                                                </button>

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

                                    {/* Right: action buttons */}
                                    <div className="flex flex-row items-center gap-2 shrink-0 justify-end flex-wrap">
                                        {hasGPS && (
                                            <a
                                                href={getGoogleMapsUrl(mess.latitude, mess.longitude)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border bg-slate-900 border-slate-700 text-emerald-400 hover:bg-slate-700 hover:border-slate-600"
                                                title="Open Location in Google Maps"
                                            >
                                                <Navigation size={14} className="fill-emerald-400/10" />
                                                Maps
                                            </a>
                                        )}

                                        <button
                                            onClick={() => handleToggleVisibility(mess.id, mess.hidden)}
                                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${mess.hidden
                                                ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20'
                                                : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'
                                                }`}
                                            title={mess.hidden ? 'Show Listing' : 'Hide Listing'}
                                        >
                                            {mess.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                                            {mess.hidden ? 'Private' : 'Public'}
                                        </button>

                                        <button
                                            onClick={() => handleToggleSponsored(mess.id, mess.isSponsored)}
                                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${mess.isSponsored
                                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20'
                                                : 'bg-slate-700/50 text-slate-400 border-slate-650 hover:bg-slate-700'
                                                }`}
                                            title={mess.isSponsored ? 'Remove Sponsorship' : 'Make Sponsored'}
                                        >
                                            {mess.isSponsored ? <CheckCircle size={14} /> : <TrendingUp size={14} />}
                                            {mess.isSponsored ? 'Sponsored' : 'Sponsor'}
                                        </button>

                                        <button
                                            onClick={() => handleEditItem(mess, 'mess')}
                                            className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl transition-all border border-slate-650 shrink-0"
                                            title="Edit Mess Profile"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* ── Inline Rooms Panel ────────────────────────── */}
                                {isExpanded && (
                                    <div className="border-t border-slate-700/60 bg-slate-900/40 rounded-b-2xl px-4 md:px-6 py-4">
                                        <div className="flex items-center gap-2 mb-4">
                                            <BedDouble size={16} className="text-cyan-400" />
                                            <span className="text-sm font-bold text-cyan-400 uppercase tracking-wider">Rooms</span>
                                            <span className="bg-cyan-500/10 text-cyan-400 text-[10px] px-2 py-0.5 rounded-full border border-cyan-500/20 font-bold">
                                                {messRooms.length}
                                            </span>
                                        </div>

                                        {messRooms.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-8 text-slate-600 border border-dashed border-slate-700 rounded-xl">
                                                <BedDouble size={28} className="mb-2 opacity-40" />
                                                <p className="text-sm font-medium">No rooms registered for this mess yet</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                                {messRooms.map(room => (
                                                    <div
                                                        key={room.id}
                                                        className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col gap-3 hover:border-cyan-500/40 transition-all group"
                                                    >
                                                        {/* Room header */}
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex flex-col gap-1">
                                                                <span className="bg-cyan-500/10 text-cyan-400 text-[10px] px-2 py-0.5 rounded-md border border-cyan-500/20 font-black uppercase tracking-wider w-fit">
                                                                    {room.occupancy || '—'} Room
                                                                </span>
                                                                {room.category && (
                                                                    <p className="text-slate-400 text-[11px] flex items-center gap-1">
                                                                        <Layout size={10} className="opacity-50 shrink-0" />
                                                                        {room.category}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <button
                                                                onClick={() => handleCopyRoomId(room.id)}
                                                                title={`Full ID: ${room.id} (Click to copy)`}
                                                                className="flex items-center gap-1 text-slate-500 hover:text-cyan-400 text-[10px] font-mono shrink-0 transition-colors bg-slate-900/40 hover:bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700/50"
                                                            >
                                                                {copiedRoomId === room.id ? (
                                                                    <>
                                                                        <Check size={10} className="text-emerald-400" />
                                                                        <span className="text-emerald-400 text-[9px]">Copied</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Copy size={10} className="opacity-60" />
                                                                        <span>#{room.id.slice(-6)}</span>
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>

                                                        {/* Room stats */}
                                                        <div className="bg-slate-900/60 rounded-lg p-3 space-y-1.5 border border-slate-700/50 flex-grow">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-[10px] text-slate-500 uppercase font-black">Price</span>
                                                                <span className="text-emerald-400 font-bold text-sm">
                                                                    ₹{room.price}/{room.rentCycle === 'yearly' ? 'yr' : 'mo'}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-[10px] text-slate-500 uppercase font-black">Available</span>
                                                                <span className="text-white font-bold text-sm">
                                                                    {room.availableCount} {room.occupancy === 'Single' ? 'Bed' : 'Seat'}{Number(room.availableCount) !== 1 ? 's' : ''}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Edit button */}
                                                        <button
                                                            onClick={() => handleEditItem(room, 'room')}
                                                            className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 py-2 rounded-lg text-xs font-bold transition-all border border-slate-600 group-hover:border-cyan-500/30"
                                                        >
                                                            <Edit3 size={13} /> Edit Room
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default MessesTab;
