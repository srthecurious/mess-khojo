import React, { useState, useEffect } from 'react';
import { Calendar, Users, Eye, EyeOff, CheckCircle, XCircle, Trash2, Clock } from 'lucide-react';
import { db } from '../../../firebase';
import { deleteDoc, doc } from 'firebase/firestore';

const BookingsTab = ({
    bookings,
    revealedIds,
    setRevealedIds,
    bookingRemarks,
    setBookingRemarks,
    bookingActionLoading,
    handleBookingAction
}) => {
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'confirmed', 'rejected'
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [datePreset, setDatePreset] = useState('all');
    const [visibleCount, setVisibleCount] = useState(10);

    const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
    const [prevStatusFilter, setPrevStatusFilter] = useState(statusFilter);
    const [prevStartDate, setPrevStartDate] = useState(startDate);
    const [prevEndDate, setPrevEndDate] = useState(endDate);
    const [prevBookings, setPrevBookings] = useState(bookings);

    // Reset pagination when filter or bookings prop change
    if (
        statusFilter !== prevStatusFilter || 
        startDate !== prevStartDate ||
        endDate !== prevEndDate ||
        bookings !== prevBookings
    ) {
        setPrevStatusFilter(statusFilter);
        setPrevStartDate(startDate);
        setPrevEndDate(endDate);
        setPrevBookings(bookings);
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
        
        // Find if the start/end match any preset
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

    // Keep the reference time updated every minute
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

    // Filter bookings by status and date range
    const filteredBookings = bookings.filter(booking => {
        const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;

        let matchesDate = true;
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

            if (!bookingDate || isNaN(bookingDate.getTime())) {
                matchesDate = false;
            } else {
                if (startDate) {
                    const start = new Date(startDate + "T00:00:00");
                    if (bookingDate < start) matchesDate = false;
                }
                if (endDate) {
                    const end = new Date(endDate + "T23:59:59");
                    if (bookingDate > end) matchesDate = false;
                }
            }
        }

        return matchesStatus && matchesDate;
    });

    const visibleBookings = filteredBookings.slice(0, visibleCount);

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Calendar className="text-emerald-500" />
                    All Call Requests
                </h2>
                
                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Status filter */}
                    <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 shrink-0">
                        <span className="text-xs font-semibold text-slate-400">Status:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-transparent text-slate-200 text-sm focus:outline-none cursor-pointer"
                        >
                            <option value="all" style={{ backgroundColor: '#1e293b', color: '#f1f5f9' }}>All</option>
                            <option value="pending" style={{ backgroundColor: '#1e293b', color: '#f1f5f9' }}>Pending</option>
                            <option value="confirmed" style={{ backgroundColor: '#1e293b', color: '#f1f5f9' }}>Approved</option>
                            <option value="rejected" style={{ backgroundColor: '#1e293b', color: '#f1f5f9' }}>Rejected</option>
                        </select>
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

                    <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/20">
                        {filteredBookings.length} Found
                    </span>
                </div>
            </div>

            <div className="space-y-4">
                {visibleBookings.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 bg-slate-800/50 rounded-2xl border border-slate-700 border-dashed">
                        No call requests found matching the filters.
                    </div>
                ) : (
                    visibleBookings.map(booking => {
                        return (
                            <div key={booking.id} className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-sm flex flex-col md:flex-row justify-between gap-4 hover:border-slate-600 transition-colors">
                                <div className="flex-1 space-y-1">
                                    <div className="flex flex-wrap items-center gap-3 mb-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${booking.status === 'confirmed' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                            booking.status === 'rejected' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                                'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                            }`}>
                                            {booking.status}
                                        </span>
                                        <span className="text-slate-500 text-xs">ID: {booking.id.slice(0, 8)}</span>
                                    </div>
                                    <h3 className="font-bold text-white text-lg">{booking.messName}</h3>
                                    <p className="text-slate-400 text-sm">{booking.roomType} Room • ₹{booking.price}/{booking.rentCycle === 'yearly' ? 'yr' : 'mo'}</p>
                                    <div className="pt-2 flex flex-wrap items-center gap-4 text-sm">
                                        <div className="flex items-center gap-1 text-slate-300">
                                            <Users size={14} className="text-slate-500" /> {booking.userName}
                                        </div>
                                        <div className="text-slate-400 flex items-center gap-2">
                                            <span className="font-mono bg-slate-900 px-2 py-1 rounded text-xs text-slate-300">
                                                {revealedIds[booking.id] ? booking.userPhone : booking.userPhone?.replace(/\d(?=\d{4})/g, "*")}
                                            </span>
                                            <button
                                                onClick={() => setRevealedIds(prev => ({ ...prev, [booking.id]: !prev[booking.id] }))}
                                                className="text-slate-500 hover:text-emerald-400 transition-colors"
                                                title={revealedIds[booking.id] ? "Hide Number" : "Show Number"}
                                            >
                                                {revealedIds[booking.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-1 text-slate-500 text-xs font-medium">
                                            <Clock size={12} />
                                            {getRelativeTime(booking.createdAt)}
                                            {booking.createdAt?.seconds && (
                                                <span className="text-[10px] opacity-60"> ({new Date(booking.createdAt.seconds * 1000).toLocaleString()})</span>
                                            )}
                                        </div>
                                    </div>

                                    {booking.status !== 'pending' && booking.remark && (
                                        <div className="mt-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 text-xs text-slate-400 italic">
                                            Remark: {booking.remark}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-3 min-w-[280px] justify-center items-end md:items-stretch">
                                    {booking.status === 'pending' ? (
                                        <div className="flex flex-col gap-2 w-full">
                                            <textarea
                                                placeholder="Write a remark (optional)..."
                                                value={bookingRemarks[booking.id] || ''}
                                                onChange={(e) => setBookingRemarks(prev => ({ ...prev, [booking.id]: e.target.value }))}
                                                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none resize-none h-14"
                                            />
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleBookingAction(booking.id, 'confirmed')}
                                                    disabled={!!bookingActionLoading[booking.id]}
                                                    className="flex-1 flex items-center justify-center gap-1 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-400 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-colors shadow-lg shadow-green-950/20 text-xs"
                                                >
                                                    {bookingActionLoading[booking.id] ? '...' : <><CheckCircle size={14} /> Approve</>}
                                                </button>
                                                <button
                                                    onClick={() => handleBookingAction(booking.id, 'rejected')}
                                                    disabled={!!bookingActionLoading[booking.id]}
                                                    className="flex-1 flex items-center justify-center gap-1 px-4 py-2 bg-slate-700 hover:bg-slate-650 disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 rounded-lg font-bold transition-colors border border-slate-600 text-xs"
                                                >
                                                    {bookingActionLoading[booking.id] ? '...' : <><XCircle size={14} /> Reject</>}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={async () => {
                                                if (window.confirm("Delete this completed booking record?")) {
                                                    try {
                                                        await deleteDoc(doc(db, "bookings", booking.id));
                                                    } catch { alert("Delete failed"); }
                                                }
                                            }}
                                            className="flex items-center justify-center gap-1 px-4 py-2.5 bg-slate-700 hover:bg-red-500/20 hover:text-red-400 text-slate-400 rounded-lg text-xs font-bold transition-all border border-slate-600 w-full"
                                        >
                                            <Trash2 size={14} /> Delete Record
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination View More Button */}
            {visibleCount < filteredBookings.length && (
                <div className="flex justify-center pt-4">
                    <button
                        onClick={() => setVisibleCount(prev => prev + 10)}
                        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700 transition-all hover:scale-105 active:scale-95 shadow-md flex items-center gap-2 text-sm"
                    >
                        View More ({filteredBookings.length - visibleCount} remaining)
                    </button>
                </div>
            )}
        </div>
    );
};

export default BookingsTab;
