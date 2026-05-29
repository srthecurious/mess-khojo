import React, { useState, useMemo } from 'react';
import { Phone, Users, Clock, CheckCircle2, AlertTriangle, XCircle, HelpCircle, PhoneCall, ChevronDown, SlidersHorizontal, MapPin, Search } from 'lucide-react';
import { db, auth } from '../../../firebase';
import { updateDoc, doc, serverTimestamp } from 'firebase/firestore';

const OwnerCallsTab = ({ bookings, messes }) => {
    const [timeframe, setTimeframe] = useState('prev_month'); // 'prev_month', 'current_month', 'all_time'
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'all_done', 'not_received', 'no_data_given'
    const [searchQuery, setSearchQuery] = useState('');
    const [visibleCount, setVisibleCount] = useState(10);
    const [expandedMesses, setExpandedMesses] = useState({}); // { messId: true/false }

    const [prevTimeframe, setPrevTimeframe] = useState(timeframe);
    const [prevStatusFilter, setPrevStatusFilter] = useState(statusFilter);
    const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery);

    // Reset pagination when filter states change
    if (timeframe !== prevTimeframe || statusFilter !== prevStatusFilter || searchQuery !== prevSearchQuery) {
        setPrevTimeframe(timeframe);
        setPrevStatusFilter(statusFilter);
        setPrevSearchQuery(searchQuery);
        setVisibleCount(10);
    }

    // Calculate dates
    const { currentMonthStart, currentMonthEnd, prevMonthStart, prevMonthEnd, prevMonthName, currentMonthName } = useMemo(() => {
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth();

        const currentStart = new Date(y, m, 1);
        const currentEnd = new Date(y, m + 1, 0, 23, 59, 59, 999);

        const prevStart = new Date(y, m - 1, 1);
        const prevEnd = new Date(y, m, 0, 23, 59, 59, 999);

        const formatter = new Intl.DateTimeFormat('en-US', { month: 'long' });

        return {
            currentMonthStart: currentStart,
            currentMonthEnd: currentEnd,
            prevMonthStart: prevStart,
            prevMonthEnd: prevEnd,
            prevMonthName: formatter.format(prevStart),
            currentMonthName: formatter.format(now)
        };
    }, []);

    // Date range helper
    const isWithinRange = (createdAt, start, end) => {
        if (!createdAt) return false;
        const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
        return date >= start && date <= end;
    };

    // Main grouping and filtering logic - memoized for nation-wide scale
    const uniqueOwnerCalls = useMemo(() => {
        // 1. Filter bookings by selected timeframe
        const timeframeBookings = bookings.filter(b => {
            if (timeframe === 'all_time') return true;
            const start = timeframe === 'current_month' ? currentMonthStart : prevMonthStart;
            const end = timeframe === 'current_month' ? currentMonthEnd : prevMonthEnd;
            return isWithinRange(b.createdAt, start, end);
        });

        // 2. Group bookings by messId
        const groups = {};
        timeframeBookings.forEach(booking => {
            if (!booking.messId) return;
            if (!groups[booking.messId]) {
                groups[booking.messId] = {
                    messId: booking.messId,
                    messName: booking.messName || 'N/A',
                    ownerPhone: booking.ownerPhone || 'N/A',
                    studentRequests: []
                };
            }
            groups[booking.messId].studentRequests.push(booking);
        });

        // 3. Match with actual mess profiles to pull district, address, and live call status
        const allCallsList = Object.values(groups).map(group => {
            const messInfo = messes.find(m => m.id === group.messId) || {};
            return {
                ...group,
                messName: messInfo.name || group.messName,
                address: messInfo.address || messInfo.landmark || '—',
                district: messInfo.district || 'balasore',
                contact: messInfo.contact || group.ownerPhone,
                ownerCallStatus: messInfo.ownerCallStatus || 'pending',
                ownerCallStatusAt: messInfo.ownerCallStatusAt || null,
                ownerCallStatusBy: messInfo.ownerCallStatusBy || null,
            };
        });

        // 4. Filter by Call Status
        const statusFiltered = allCallsList.filter(call => {
            if (statusFilter === 'all') return true;
            return call.ownerCallStatus === statusFilter;
        });

        // 5. Filter by Search Query (name, phone, address, district)
        const q = searchQuery.toLowerCase().trim();
        const searchFiltered = statusFiltered.filter(call => {
            if (!q) return true;
            return (call.messName || '').toLowerCase().includes(q) ||
                (call.contact || '').toLowerCase().includes(q) ||
                (call.address || '').toLowerCase().includes(q) ||
                (call.district || '').toLowerCase().includes(q);
        });

        // 6. Sort alphabetically by Mess Name
        return searchFiltered.sort((a, b) => (a.messName || '').localeCompare(b.messName || ''));

    }, [bookings, messes, timeframe, statusFilter, searchQuery, currentMonthStart, currentMonthEnd, prevMonthStart, prevMonthEnd]);

    const visibleCalls = uniqueOwnerCalls.slice(0, visibleCount);

    // Update Call Status in Firestore
    const handleUpdateCallStatus = async (messId, status) => {
        try {
            await updateDoc(doc(db, "messes", messId), {
                ownerCallStatus: status,
                ownerCallStatusAt: serverTimestamp(),
                ownerCallStatusBy: auth.currentUser?.email || 'Operator'
            });
        } catch (err) {
            console.error("Failed to update owner call status:", err);
            alert("Failed to update call status");
        }
    };

    // Toggle requests accordion
    const toggleExpand = (messId) => {
        setExpandedMesses(prev => ({
            ...prev,
            [messId]: !prev[messId]
        }));
    };

    // Render status dot indicator
    const renderStatusBadge = (status) => {
        switch (status) {
            case 'all_done':
                return (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/25 px-2 py-0.5 rounded-full uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                        All Done
                    </span>
                );
            case 'not_received':
                return (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/25 px-2 py-0.5 rounded-full uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                        Not Received
                    </span>
                );
            case 'no_data_given':
                return (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        No Data Given
                    </span>
                );
            case 'pending':
            default:
                return (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-700/30 border border-slate-750 px-2 py-0.5 rounded-full uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse"></span>
                        Pending
                    </span>
                );
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header and Counters */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-500/10 p-2.5 rounded-2xl text-indigo-400">
                        <PhoneCall size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Owner Outbound Calls</h2>
                        <p className="text-slate-400 text-xs mt-0.5">Manage operator outreach to mess owners whose rooms were contacted</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                    <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-xs font-bold border border-slate-700">
                        {uniqueOwnerCalls.length} Messes Contacted
                    </span>
                    <span className="bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/20">
                        {uniqueOwnerCalls.filter(m => m.ownerCallStatus === 'pending').length} Pending
                    </span>
                </div>
            </div>

            {/* Filter Panel */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50">
                {/* Search Bar */}
                <div className="md:col-span-2 flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-300">
                    <Search size={16} className="text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search by mess name, phone, address, district..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent text-sm focus:outline-none w-full text-white placeholder-slate-500"
                    />
                </div>

                {/* Timeframe Dropdown */}
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 shrink-0">
                    <SlidersHorizontal size={14} className="text-slate-400" />
                    <span className="text-xs font-semibold text-slate-400">Month:</span>
                    <select
                        value={timeframe}
                        onChange={(e) => setTimeframe(e.target.value)}
                        className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer w-full"
                    >
                        <option value="prev_month" className="bg-slate-900">Prev Month ({prevMonthName})</option>
                        <option value="current_month" className="bg-slate-900">Current Month ({currentMonthName})</option>
                        <option value="all_time" className="bg-slate-900">All Time</option>
                    </select>
                </div>

                {/* Status Dropdown */}
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 shrink-0">
                    <SlidersHorizontal size={14} className="text-slate-400" />
                    <span className="text-xs font-semibold text-slate-400">Call Status:</span>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer w-full"
                    >
                        <option value="all" className="bg-slate-900">All Statuses</option>
                        <option value="pending" className="bg-slate-900">Pending</option>
                        <option value="all_done" className="bg-slate-900">All Done</option>
                        <option value="not_received" className="bg-slate-900">Not Received</option>
                        <option value="no_data_given" className="bg-slate-900">No Data Given</option>
                    </select>
                </div>
            </div>

            {/* Outreach List */}
            <div className="space-y-4">
                {visibleCalls.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 bg-slate-800/50 rounded-2xl border border-slate-700 border-dashed">
                        No contacted messes found matching the selected timeframe and filter.
                    </div>
                ) : (
                    visibleCalls.map(call => {
                        const isExpanded = !!expandedMesses[call.messId];
                        return (
                            <div key={call.messId} className="bg-slate-800 rounded-2xl p-5 border border-slate-700 shadow-xl flex flex-col gap-4 hover:border-slate-650 transition-colors">
                                {/* Card Header */}
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-700/50 pb-4">
                                    <div className="space-y-1 flex-grow">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="font-bold text-white text-lg leading-tight">{call.messName}</h3>
                                            
                                            {/* Live Status Badge */}
                                            {renderStatusBadge(call.ownerCallStatus)}

                                            {/* District Badge */}
                                            <span className="text-[9px] bg-slate-950 text-slate-400 px-1.5 py-0.5 rounded border border-slate-750 font-bold uppercase tracking-wide">
                                                {call.district}
                                            </span>
                                        </div>

                                        <p className="text-slate-400 text-xs line-clamp-1 flex items-center gap-1">
                                            <MapPin size={12} className="text-amber-500 shrink-0" />
                                            {call.address}
                                        </p>
                                    </div>

                                    {/* Action items: Outbound Call & Outbound Status Dropdown */}
                                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0 justify-start md:justify-end">
                                        {/* Dialer Click to Call button */}
                                        <a
                                            href={`tel:${call.contact}`}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md active:scale-95 text-center"
                                        >
                                            <Phone size={14} className="fill-white/10" />
                                            Call Owner ({call.contact})
                                        </a>

                                        {/* Status Dropdown */}
                                        <div className="relative">
                                            <select
                                                value={call.ownerCallStatus}
                                                onChange={(e) => handleUpdateCallStatus(call.messId, e.target.value)}
                                                className="bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer pr-8 appearance-none font-bold"
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="all_done">All Done</option>
                                                <option value="not_received">Not Received</option>
                                                <option value="no_data_given">No Data Given</option>
                                            </select>
                                            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* Student Request details Accordion */}
                                <div className="space-y-2">
                                    <button
                                        onClick={() => toggleExpand(call.messId)}
                                        className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors bg-slate-900/40 px-3 py-2 rounded-xl border border-slate-750/50"
                                    >
                                        <Users size={14} className="text-indigo-400" />
                                        <span>Student Call Requests ({call.studentRequests.length})</span>
                                        <ChevronDown size={14} className={`text-slate-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                    </button>

                                    {isExpanded && (
                                        <div className="bg-slate-900/60 rounded-2xl border border-slate-750 p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {call.studentRequests.map((req, idx) => (
                                                    <div key={req.id || idx} className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/50 flex flex-col gap-1 text-xs">
                                                        <div className="flex items-center justify-between text-slate-400">
                                                            <span className="font-bold text-slate-200">{req.userName}</span>
                                                            <span className="text-[10px] font-mono tracking-tighter opacity-60">Req: #{req.id?.slice(-5)}</span>
                                                        </div>
                                                        <p className="text-blue-400 font-mono font-medium">{req.userPhone}</p>
                                                        <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1.5 pt-1.5 border-t border-slate-700/40">
                                                            <span>Room: {req.roomType || 'Any'}</span>
                                                            <span className="flex items-center gap-1">
                                                                <Clock size={10} />
                                                                {req.createdAt?.seconds ? new Date(req.createdAt.seconds * 1000).toLocaleString() : 'Just now'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Call Log Info Footer */}
                                {call.ownerCallStatus !== 'pending' && call.ownerCallStatusAt && (
                                    <p className="text-[10px] text-slate-500 italic mt-1 font-mono">
                                        Outreach status updated {call.ownerCallStatusAt?.seconds ? new Date(call.ownerCallStatusAt.seconds * 1000).toLocaleString() : 'Just now'}{call.ownerCallStatusBy ? ` by ${call.ownerCallStatusBy}` : ''}
                                    </p>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination View More Button */}
            {visibleCount < uniqueOwnerCalls.length && (
                <div className="flex justify-center pt-4">
                    <button
                        onClick={() => setVisibleCount(prev => prev + 10)}
                        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700 transition-all hover:scale-105 active:scale-95 shadow-md flex items-center gap-2 text-sm"
                    >
                        View More ({uniqueOwnerCalls.length - visibleCount} remaining)
                    </button>
                </div>
            )}
        </div>
    );
};

export default OwnerCallsTab;
