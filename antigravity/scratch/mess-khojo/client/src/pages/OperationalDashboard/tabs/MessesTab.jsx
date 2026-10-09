import React, { useState } from 'react';
import { 
    Database, Search, Server, EyeOff, Eye, CheckCircle, TrendingUp, Edit3, MapPin, 
    SlidersHorizontal, Navigation, XCircle, ChevronDown, ChevronRight, BedDouble, 
    Layout, Copy, Check, Camera, CameraOff, CloudUpload, CloudDownload, PhoneForwarded, 
    AlertTriangle, Loader2, ExternalLink, X, RefreshCw 
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { auth } from '../../../firebase';
import {
    pushToGoogleSheet,
    pushCallingTasksToGoogleSheet,
    pullFromGoogleSheet,
    computeDiff,
    applyDiffToFirestore
} from '../../../services/googleSheetSyncService';

const MessesTab = ({
    messes,
    rooms,
    searchQuery,
    setSearchQuery,
    handleToggleVisibility,
    handleToggleSponsored,
    handleEditItem
}) => {
    const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();
    const [visibilityFilter, setVisibilityFilter] = useState('all'); // 'all', 'public', 'private', 'sponsored', 'sourced'
    const [expandedMessId, setExpandedMessId] = useState(null);
    const [copiedRoomId, setCopiedRoomId] = useState(null);

    // Sync & Diff Modal States
    const [isSyncingAdmin, setIsSyncingAdmin] = useState(false);
    const [isExportingTasks, setIsExportingTasks] = useState(false);
    const [isPulling, setIsPulling] = useState(false);
    const [diffModalOpen, setDiffModalOpen] = useState(false);
    const [pendingDiffs, setPendingDiffs] = useState([]);
    const [isApplyingDiff, setIsApplyingDiff] = useState(false);

    // Handlers
    const handleSyncToAdmin = async () => {
        try {
            setIsSyncingAdmin(true);
            const res = await pushToGoogleSheet(messes, rooms);
            if (res.status === 'success') {
                toastSuccess(`Admin Master synced! Inserted: ${res.inserted || 0}, Updated: ${res.updated || 0}`);
            } else {
                toastError(res.message || 'Failed to sync to Admin Master Sheet');
            }
        } catch (err) {
            toastError(err.message || 'Error syncing to Google Sheet');
        } finally {
            setIsSyncingAdmin(false);
        }
    };

    const handleExportCallingBoard = async () => {
        try {
            setIsExportingTasks(true);
            const res = await pushCallingTasksToGoogleSheet(messes, rooms);
            if (res.status === 'success') {
                toastSuccess(`Calling Board tasks updated! Added: ${res.added || 0}, Refreshed: ${res.refreshed || 0}`);
            } else {
                toastError(res.message || 'Failed to export calling tasks');
            }
        } catch (err) {
            toastError(err.message || 'Error exporting to Calling Board');
        } finally {
            setIsExportingTasks(false);
        }
    };

    const handlePullFromSheet = async (target = 'calling') => {
        try {
            setIsPulling(true);
            const sheetRows = await pullFromGoogleSheet(target);
            const diffs = computeDiff(sheetRows, messes, rooms);
            if (diffs.length === 0) {
                toastInfo(`No pending updates found in ${target === 'master' ? 'Admin Master' : 'Calling Board'} sheet.`);
            } else {
                setPendingDiffs(diffs);
                setDiffModalOpen(true);
            }
        } catch (err) {
            toastError(err.message || 'Error pulling updates from Sheet');
        } finally {
            setIsPulling(false);
        }
    };

    const handleApplyDiffs = async () => {
        try {
            setIsApplyingDiff(true);
            const operatorEmail = auth.currentUser?.email || 'operator';
            await applyDiffToFirestore(pendingDiffs, operatorEmail);
            toastSuccess(`Successfully updated ${pendingDiffs.length} mess(es) in Firestore!`);
            setDiffModalOpen(false);
            setPendingDiffs([]);
        } catch (err) {
            toastError(err.message || 'Failed to apply updates to Firestore');
        } finally {
            setIsApplyingDiff(false);
        }
    };

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
            case 'missing_photos': {
                const messRooms = rooms.filter(r => r.messId === mess.id);
                return messRooms.length === 0 || messRooms.some(r => !(r.imageUrls && r.imageUrls.length > 0) && !r.imageUrl);
            }
            case 'all_photos': {
                const messRooms = rooms.filter(r => r.messId === mess.id);
                return messRooms.length > 0 && messRooms.every(r => (r.imageUrls && r.imageUrls.length > 0) || !!r.imageUrl);
            }
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
                            <option value="missing_photos" className="bg-slate-800">📷 Photos Not Available</option>
                            <option value="all_photos" className="bg-slate-800">📸 All Room Photos Uploaded</option>
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

            {/* Google Sheets & Diallogs Sync Center */}
            <div className="bg-slate-850/80 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                        <Server size={20} />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                            Google Sheets &amp; Calling Board Sync
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                                Dual-SIM Verified
                            </span>
                        </div>
                        <p className="text-xs text-slate-400">
                            Two-way sync between website database and Google spreadsheets with Diallogs call verification.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                        onClick={handleSyncToAdmin}
                        disabled={isSyncingAdmin}
                        className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                        title="Upload all messes & private listings to Admin Master Sheet"
                    >
                        {isSyncingAdmin ? <Loader2 size={14} className="animate-spin" /> : <CloudUpload size={14} />}
                        Sync Admin Sheet
                    </button>

                    <button
                        onClick={handleExportCallingBoard}
                        disabled={isExportingTasks}
                        className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                        title="Push public & assigned private messes to Freelancer Calling Sheet"
                    >
                        {isExportingTasks ? <Loader2 size={14} className="animate-spin" /> : <PhoneForwarded size={14} />}
                        Push Tasks to Calling Board
                    </button>

                    <button
                        onClick={() => handlePullFromSheet('calling')}
                        disabled={isPulling}
                        className="flex items-center gap-2 px-3.5 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-600 active:scale-95 cursor-pointer"
                        title="Pull rent/vacancies updates & verified calls from Freelancer Calling Board"
                    >
                        {isPulling ? <Loader2 size={14} className="animate-spin" /> : <CloudDownload size={14} />}
                        Pull Calling Board
                    </button>

                    <button
                        onClick={() => handlePullFromSheet('master')}
                        disabled={isPulling}
                        className="flex items-center gap-2 px-3 py-2 bg-slate-700/60 hover:bg-slate-600 disabled:opacity-50 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-600/60 active:scale-95 cursor-pointer"
                        title="Pull manual edits and visibility changes from Admin Master Sheet"
                    >
                        {isPulling ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                        Pull Admin Sheet
                    </button>
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

                                                {/* Operating Since Badge */}
                                                {mess.operatingSince && (
                                                    <span className="text-[9px] bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/25 font-bold uppercase tracking-wider">
                                                        Since {mess.operatingSince}
                                                    </span>
                                                )}

                                                {/* Notice Period Badge */}
                                                {mess.noticePeriod && (
                                                    <span className="text-[9px] bg-sky-500/15 text-sky-400 px-1.5 py-0.5 rounded border border-sky-500/25 font-bold uppercase tracking-wider">
                                                        Notice: {mess.noticePeriod}
                                                    </span>
                                                )}

                                                {/* Food Availability Badge */}
                                                {mess.foodAvailability && (
                                                    <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/25 font-bold uppercase tracking-wider">
                                                        {mess.foodAvailability}
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-slate-400 text-sm line-clamp-1 flex items-center gap-1.5 font-medium">
                                                <MapPin size={13} className="text-amber-500 shrink-0" />
                                                {mess.address || mess.landmark || '—'}
                                            </p>

                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 text-[10px] font-mono">
                                                <span>ID: {mess.id}</span>
                                                {mess.contact && <span>• Phone: {mess.contact}</span>}
                                            </div>

                                            {/* Room Photo Status Breakdown Chips */}
                                            {messRooms.length > 0 && (
                                                <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                                                    <span className="text-[10px] text-slate-400 font-semibold mr-0.5">Room Photos:</span>
                                                    {messRooms.map(room => {
                                                        const photoCount = (room.imageUrls && room.imageUrls.length) || (room.imageUrl ? 1 : 0);
                                                        const hasPhoto = photoCount > 0;
                                                        return (
                                                            <span
                                                                key={room.id}
                                                                className={`text-[9px] px-2 py-0.5 rounded-lg border font-bold flex items-center gap-1.5 transition-all ${
                                                                    hasPhoto
                                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                                                        : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                                                }`}
                                                                title={hasPhoto ? `${room.occupancy || 'Room'} has ${photoCount} photo(s)` : `${room.occupancy || 'Room'} has NO photos!`}
                                                            >
                                                                {hasPhoto ? <Camera size={10} className="text-emerald-400" /> : <CameraOff size={10} className="text-rose-400" />}
                                                                <span>{room.occupancy || 'Room'}</span>
                                                                <span className={`px-1 rounded text-[8px] font-black ${hasPhoto ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                                                                    {hasPhoto ? `${photoCount} Pic${photoCount > 1 ? 's' : ''}` : 'No Pic'}
                                                                </span>
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            )}
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
                                        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                                            <div className="flex items-center gap-2">
                                                <BedDouble size={16} className="text-cyan-400" />
                                                <span className="text-sm font-bold text-cyan-400 uppercase tracking-wider">Rooms</span>
                                                <span className="bg-cyan-500/10 text-cyan-400 text-[10px] px-2 py-0.5 rounded-full border border-cyan-500/20 font-bold">
                                                    {messRooms.length}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleEditItem({ messId: mess.id }, 'add_room')}
                                                className="flex items-center gap-1 text-[11px] font-bold text-cyan-400 hover:text-white bg-cyan-500/10 hover:bg-cyan-500/30 px-2.5 py-1.5 rounded-lg border border-cyan-500/20 hover:border-cyan-500/30 transition-all active:scale-95"
                                            >
                                                + Add Room
                                            </button>
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

                                                            {/* Room Photo Status Badge */}
                                                            {(() => {
                                                                const photoCount = (room.imageUrls && room.imageUrls.length) || (room.imageUrl ? 1 : 0);
                                                                const hasPhoto = photoCount > 0;
                                                                return (
                                                                    <div className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold flex items-center justify-between mt-2 ${
                                                                        hasPhoto
                                                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                                            : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                                                    }`}>
                                                                        <span className="flex items-center gap-1">
                                                                            {hasPhoto ? <Camera size={11} /> : <CameraOff size={11} />}
                                                                            {hasPhoto ? 'Photos Uploaded' : 'Missing Photos'}
                                                                        </span>
                                                                        <span>{hasPhoto ? `${photoCount} Pic(s)` : '0 Photos'}</span>
                                                                    </div>
                                                                );
                                                            })()}
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

            {/* Diff Review Modal */}
            {diffModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                        {/* Modal Header */}
                        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-850/50">
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <CloudDownload size={20} className="text-indigo-400" />
                                    Review Updates from Google Sheet
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Found pending updates or call records for <span className="text-indigo-400 font-bold">{pendingDiffs.length}</span> mess(es).
                                </p>
                            </div>
                            <button
                                onClick={() => setDiffModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body: Diffs list */}
                        <div className="p-6 overflow-y-auto space-y-4 flex-1">
                            {pendingDiffs.map((diff, idx) => (
                                <div key={idx} className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 space-y-3">
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                        <div className="flex items-center gap-2.5">
                                            <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-mono font-bold">
                                                {diff.taskCode}
                                            </span>
                                            <span className="font-bold text-white text-sm">
                                                {diff.messName}
                                                {diff.roomTitle && (
                                                    <span className="ml-1.5 text-xs text-indigo-300 font-medium">
                                                        ({diff.roomTitle})
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                                                diff.verificationBadge.includes('VERIFIED')
                                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                    : diff.verificationBadge.includes('SHORT')
                                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                            }`}>
                                                {diff.verificationBadge}
                                            </span>
                                            {diff.duration && (
                                                <span className="text-xs text-slate-400 font-medium">
                                                    ({diff.duration}{diff.attempts > 1 ? `, ${diff.attempts} calls` : ''})
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Changed fields list */}
                                    <div className="space-y-1.5 pt-2 border-t border-slate-700/50">
                                        {diff.changes.length === 0 ? (
                                            <p className="text-xs text-slate-400 italic">Call logged with no rent or vacancy modifications.</p>
                                        ) : (
                                            diff.changes.map((c, cIdx) => (
                                                <div key={cIdx} className={`text-xs flex items-center justify-between p-2 rounded-xl ${
                                                    c.isWarning ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300' : 'bg-slate-900/40 text-slate-300'
                                                }`}>
                                                    <div className="flex items-center gap-2">
                                                        {c.isWarning && <AlertTriangle size={14} className="text-amber-400 shrink-0" />}
                                                        <span className="font-semibold">{c.label}:</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 font-mono">
                                                        <span className="text-slate-500 line-through">{c.oldVal}</span>
                                                        <span className="text-slate-400">➔</span>
                                                        <span className="text-emerald-400 font-bold">{c.newVal}</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Remarks if any */}
                                    {diff.remarks && (
                                        <div className="text-xs text-slate-400 bg-slate-900/30 p-2.5 rounded-xl border border-slate-750">
                                            <span className="font-semibold text-slate-300">Freelancer Notes: </span>
                                            {diff.remarks}
                                        </div>
                                    )}

                                    {/* Recording URL if any */}
                                    {diff.recordingUrl && (
                                        <div className="flex items-center gap-2 text-xs text-cyan-400 pt-1">
                                            <ExternalLink size={13} />
                                            <a href={diff.recordingUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                Listen to Call Recording
                                            </a>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-slate-800 bg-slate-850/50 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setDiffModalOpen(false)}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleApplyDiffs}
                                disabled={isApplyingDiff}
                                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95 cursor-pointer"
                            >
                                {isApplyingDiff ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                                Confirm &amp; Update Firestore
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MessesTab;
