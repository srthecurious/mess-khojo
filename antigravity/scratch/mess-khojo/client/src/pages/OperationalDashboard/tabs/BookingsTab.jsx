import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Users, Eye, EyeOff, Trash2, Clock, Phone, Search, ChevronDown, XCircle } from 'lucide-react';
import { db } from '../../../firebase';
import { deleteDoc, doc } from 'firebase/firestore';

const BookingsTab = ({
    bookings,
    revealedIds = {},
    setRevealedIds = () => {}
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [datePreset, setDatePreset] = useState('all');
    const [visibleCount, setVisibleCount] = useState(10);
    const [expandedGroups, setExpandedGroups] = useState({});

    const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

    // Reset pagination when user changes a filter
    const [prevFilter, setPrevFilter] = useState({ searchQuery, startDate, endDate });
    if (prevFilter.searchQuery !== searchQuery || prevFilter.startDate !== startDate || prevFilter.endDate !== endDate) {
        setPrevFilter({ searchQuery, startDate, endDate });
        setVisibleCount(10);
    }

    const getLocalDateString = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handlePresetChange = (e) => {
        const preset = e.target.value;
        setDatePreset(preset);

        const today = new Date();
        if (preset === 'all') {
            setStartDate('');
            setEndDate('');
        } else if (preset === 'today') {
            const todayStr = getLocalDateString(today);
            setStartDate(todayStr);
            setEndDate(todayStr);
        } else if (preset === 'yesterday') {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = getLocalDateString(yesterday);
            setStartDate(yesterdayStr);
            setEndDate(yesterdayStr);
        } else if (preset === '7days') {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(today.getDate() - 6);
            setStartDate(getLocalDateString(sevenDaysAgo));
            setEndDate(getLocalDateString(today));
        } else if (preset === '30days') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(today.getDate() - 29);
            setStartDate(getLocalDateString(thirtyDaysAgo));
            setEndDate(getLocalDateString(today));
        }
    };

    const handleDateInputChange = (start, end) => {
        setStartDate(start);
        setEndDate(end);
        
        const today = new Date();
        const todayStr = getLocalDateString(today);
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = getLocalDateString(yesterday);
        
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 6);
        const sevenDaysAgoStr = getLocalDateString(sevenDaysAgo);
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 29);
        const thirtyDaysAgoStr = getLocalDateString(thirtyDaysAgo);

        if (!start && !end) {
            setDatePreset('all');
        } else if (start === todayStr && end === todayStr) {
            setDatePreset('today');
        } else if (start === yesterdayStr && end === yesterdayStr) {
            setDatePreset('yesterday');
        } else if (start === sevenDaysAgoStr && end === todayStr) {
            setDatePreset('7days');
        } else if (start === thirtyDaysAgoStr && end === todayStr) {
            setDatePreset('30days');
        } else {
            setDatePreset('custom');
        }
    };

    // Keep reference time updated every minute
    useEffect(() => {
        const interval = setInterval(() => {
            setNow(Math.floor(Date.now() / 1000));
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    // Format relative time helper
    const getRelativeTime = (timestamp) => {
        if (!timestamp) return 'Just now';
        const seconds = timestamp.seconds || Math.floor(new Date(timestamp).getTime() / 1000);
        const diff = now - seconds;

        if (diff < 60) return 'Just now';
        const mins = Math.floor(diff / 60);
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 30) return `${days}d ago`;
        
        return new Date(seconds * 1000).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Filter bookings by date range & search query
    const filteredBookings = useMemo(() => {
        return bookings.filter(booking => {
            // Search Filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const nameMatch = booking.userName?.toLowerCase().includes(q);
                const phoneMatch = booking.userPhone?.toLowerCase().includes(q);
                const messMatch = booking.messName?.toLowerCase().includes(q);
                const idMatch = booking.userId?.toLowerCase().includes(q) || booking.id?.toLowerCase().includes(q);
                if (!nameMatch && !phoneMatch && !messMatch && !idMatch) return false;
            }

            // Date Range Filter
            if (startDate || endDate) {
                let bookingDate = null;
                if (booking.createdAt) {
                    if (booking.createdAt.seconds) {
                        bookingDate = new Date(booking.createdAt.seconds * 1000);
                    } else if (booking.createdAt.toDate && typeof booking.createdAt.toDate === 'function') {
                        bookingDate = booking.createdAt.toDate();
                    } else {
                        bookingDate = new Date(booking.createdAt);
                    }
                }

                if (!bookingDate || isNaN(bookingDate.getTime())) return false;

                if (startDate) {
                    const start = new Date(startDate + "T00:00:00");
                    if (bookingDate < start) return false;
                }
                if (endDate) {
                    const end = new Date(endDate + "T23:59:59");
                    if (bookingDate > end) return false;
                }
            }

            return true;
        });
    }, [bookings, searchQuery, startDate, endDate]);

    // Group bookings by User ID / User Identity
    const userGroups = useMemo(() => {
        const map = new Map();

        filteredBookings.forEach(booking => {
            // Key by userId if available, else userPhone or userName
            const groupKey = booking.userId || booking.userPhone || booking.userName || 'unknown_user';

            if (!map.has(groupKey)) {
                map.set(groupKey, {
                    groupKey,
                    userId: booking.userId || null,
                    userName: booking.userName || 'Guest User',
                    userPhone: booking.userPhone || 'N/A',
                    userEmail: booking.userEmail || '',
                    logs: []
                });
            }

            const group = map.get(groupKey);
            if (booking.userName && group.userName === 'Guest User') group.userName = booking.userName;
            if (booking.userPhone && group.userPhone === 'N/A') group.userPhone = booking.userPhone;
            group.logs.push(booking);
        });

        // Convert map to array & sort logs within each group (latest first)
        const groupsArray = Array.from(map.values()).map(group => {
            group.logs.sort((a, b) => {
                const timeA = a.createdAt?.seconds || (new Date(a.createdAt).getTime() / 1000) || 0;
                const timeB = b.createdAt?.seconds || (new Date(b.createdAt).getTime() / 1000) || 0;
                return timeB - timeA;
            });
            group.latestTimestamp = group.logs[0]?.createdAt;
            return group;
        });

        // Sort groups by latest call activity
        groupsArray.sort((a, b) => {
            const timeA = a.latestTimestamp?.seconds || (new Date(a.latestTimestamp).getTime() / 1000) || 0;
            const timeB = b.latestTimestamp?.seconds || (new Date(b.latestTimestamp).getTime() / 1000) || 0;
            return timeB - timeA;
        });

        return groupsArray;
    }, [filteredBookings]);

    const visibleUserGroups = userGroups.slice(0, visibleCount);

    const toggleGroupExpand = (groupKey) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupKey]: !prev[groupKey]
        }));
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
                    <Phone className="text-emerald-500" />
                    User call logs
                </h2>
                
                {/* Search & Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Search Input */}
                    <div className="relative flex items-center bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 shrink-0 w-full sm:w-auto">
                        <Search size={14} className="text-slate-400 mr-2 shrink-0" />
                        <input
                            type="text"
                            placeholder="Search name, phone, mess..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent text-slate-200 text-xs focus:outline-none w-full sm:w-44"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="text-slate-500 hover:text-white text-xs ml-1"
                            >
                                <XCircle size={14} />
                            </button>
                        )}
                    </div>

                    {/* Date Filters */}
                    <div className="flex flex-wrap items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 shrink-0">
                        <Calendar size={14} className="text-slate-400 shrink-0" />
                        <span className="text-xs font-semibold text-slate-400 shrink-0">Dates:</span>
                        <select
                            value={datePreset}
                            onChange={handlePresetChange}
                            className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer border-r border-slate-700 pr-2 mr-1"
                        >
                            <option value="all" style={{ backgroundColor: '#1e293b', color: '#f1f5f9' }}>All Time</option>
                            <option value="today" style={{ backgroundColor: '#1e293b', color: '#f1f5f9' }}>Today</option>
                            <option value="yesterday" style={{ backgroundColor: '#1e293b', color: '#f1f5f9' }}>Yesterday</option>
                            <option value="7days" style={{ backgroundColor: '#1e293b', color: '#f1f5f9' }}>Last 7 Days</option>
                            <option value="30days" style={{ backgroundColor: '#1e293b', color: '#f1f5f9' }}>Last 30 Days</option>
                            <option value="custom" style={{ backgroundColor: '#1e293b', color: '#f1f5f9' }}>Custom Range</option>
                        </select>

                        {datePreset !== 'all' && (
                            <div className="flex items-center gap-1.5 animate-fadeIn">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => handleDateInputChange(e.target.value, endDate)}
                                    style={{ colorScheme: 'dark' }}
                                    className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer w-[110px]"
                                />
                                <span className="text-slate-600 text-xs">-</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => handleDateInputChange(startDate, e.target.value)}
                                    style={{ colorScheme: 'dark' }}
                                    className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer w-[110px]"
                                />
                                {(startDate || endDate) && (
                                    <button
                                        onClick={() => {
                                            setStartDate('');
                                            setEndDate('');
                                            setDatePreset('all');
                                        }}
                                        className="text-slate-500 hover:text-white transition-colors ml-1 shrink-0"
                                        title="Clear dates"
                                    >
                                        <XCircle size={14} />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/20">
                            {userGroups.length} Users
                        </span>
                        <span className="bg-slate-700/50 text-slate-300 px-3 py-1 rounded-full text-xs font-bold border border-slate-600">
                            {filteredBookings.length} Call Logs
                        </span>
                    </div>
                </div>
            </div>

            {/* Unified User Group Cards */}
            <div className="space-y-4">
                {visibleUserGroups.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 bg-slate-800/50 rounded-2xl border border-slate-700 border-dashed">
                        No user call logs found matching the filters.
                    </div>
                ) : (
                    visibleUserGroups.map(group => {
                        const isExpanded = !!expandedGroups[group.groupKey]; // Default collapsed
                        const isPhoneRevealed = revealedIds[group.groupKey];

                        return (
                            <div 
                                key={group.groupKey} 
                                className="bg-slate-800 rounded-2xl border border-slate-700/80 shadow-md overflow-hidden hover:border-slate-600 transition-colors"
                            >
                                {/* User Header */}
                                <div 
                                    onClick={() => toggleGroupExpand(group.groupKey)}
                                    className="p-5 bg-slate-800/90 border-b border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                                            {group.userName ? group.userName.charAt(0).toUpperCase() : <Users size={18} />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-bold text-white text-lg">{group.userName}</h3>
                                                {group.userId && (
                                                    <span className="text-[10px] font-mono bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                                                        UID: {group.userId.slice(0, 10)}...
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 text-xs">
                                                <div className="text-slate-300 flex items-center gap-1.5 font-mono" onClick={(e) => e.stopPropagation()}>
                                                    <Phone size={12} className="text-slate-500" />
                                                    <span className="bg-slate-900/80 px-2 py-0.5 rounded text-slate-200">
                                                        {isPhoneRevealed ? group.userPhone : group.userPhone?.replace(/\d(?=\d{4})/g, "*")}
                                                    </span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setRevealedIds(prev => ({ ...prev, [group.groupKey]: !prev[group.groupKey] }));
                                                        }}
                                                        className="text-slate-500 hover:text-emerald-400 transition-colors p-0.5"
                                                        title={isPhoneRevealed ? "Hide Number" : "Show Number"}
                                                    >
                                                        {isPhoneRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
                                                    </button>
                                                </div>
                                                <span className="text-slate-500">•</span>
                                                <span className="text-slate-400 flex items-center gap-1">
                                                    <Clock size={12} className="text-slate-500" />
                                                    Latest: {getRelativeTime(group.latestTimestamp)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Header Badges & Collapse Toggle */}
                                    <div className="flex items-center gap-3 self-end md:self-auto">
                                        <span className="bg-emerald-500/15 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/20">
                                            {group.logs.length} {group.logs.length === 1 ? 'Call Log' : 'Call Logs'}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleGroupExpand(group.groupKey);
                                            }}
                                            className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                                            title={isExpanded ? "Collapse logs" : "Expand logs"}
                                        >
                                            <ChevronDown size={18} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                        </button>
                                    </div>
                                </div>

                                {/* Call Logs List for this User */}
                                {isExpanded && (
                                    <div className="p-4 bg-slate-900/40 space-y-3">
                                        {group.logs.map((log, idx) => (
                                            <div 
                                                key={log.id || idx}
                                                className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-650 transition-colors"
                                            >
                                                <div className="space-y-1 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h4 className="font-semibold text-slate-100 text-base">{log.messName || 'Mess Details'}</h4>
                                                        <span className="text-slate-500 text-[11px] font-mono">ID: {log.id?.slice(0, 8)}</span>
                                                    </div>
                                                    <p className="text-slate-400 text-xs">
                                                        {log.roomType || 'Standard'} Room • ₹{log.price || 0}/{log.rentCycle === 'yearly' ? 'yr' : 'mo'}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px] pt-1">
                                                        <Clock size={12} />
                                                        <span>Contacted {getRelativeTime(log.createdAt)}</span>
                                                        {log.createdAt?.seconds && (
                                                            <span className="text-[10px] opacity-60">({new Date(log.createdAt.seconds * 1000).toLocaleString()})</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    <button
                                                        onClick={async () => {
                                                            if (window.confirm("Delete this call log record?")) {
                                                                try {
                                                                    await deleteDoc(doc(db, "bookings", log.id));
                                                                } catch { alert("Delete failed"); }
                                                            }
                                                        }}
                                                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-700/60 hover:bg-red-500/20 hover:text-red-400 text-slate-400 rounded-lg text-xs font-semibold transition-all border border-slate-650"
                                                    >
                                                        <Trash2 size={14} /> Delete Log
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination View More Button */}
            {visibleCount < userGroups.length && (
                <div className="flex justify-center pt-4">
                    <button
                        onClick={() => setVisibleCount(prev => prev + 10)}
                        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700 transition-all hover:scale-105 active:scale-95 shadow-md flex items-center gap-2 text-sm"
                    >
                        View More Users ({userGroups.length - visibleCount} remaining)
                    </button>
                </div>
            )}
        </div>
    );
};

export default BookingsTab;
