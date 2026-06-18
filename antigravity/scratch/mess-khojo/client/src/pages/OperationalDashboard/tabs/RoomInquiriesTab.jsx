import React, { useState } from 'react';
import { BedDouble, Phone, Trash2, PhoneCall, PhoneOff, Search, SlidersHorizontal } from 'lucide-react';
import { db } from '../../../firebase';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';

const RoomInquiriesTab = ({ roomInquiries }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [calledFilter, setCalledFilter] = useState('all'); // 'all', 'called', 'not_called'
    const [visibleCount, setVisibleCount] = useState(10);

    const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery);
    const [prevCalledFilter, setPrevCalledFilter] = useState(calledFilter);
    const [prevRoomInquiries, setPrevRoomInquiries] = useState(roomInquiries);

    // Reset pagination when search query, filter, or data changes
    if (searchQuery !== prevSearchQuery || calledFilter !== prevCalledFilter || roomInquiries !== prevRoomInquiries) {
        setPrevSearchQuery(searchQuery);
        setPrevCalledFilter(calledFilter);
        setPrevRoomInquiries(roomInquiries);
        setVisibleCount(10);
    }

    // Toggle Called status in Firestore
    const handleToggleCalled = async (inquiryId, currentCalled) => {
        try {
            await updateDoc(doc(db, "room_inquiries", inquiryId), {
                called: !currentCalled,
                calledAt: !currentCalled ? new Date() : null
            });
        } catch (err) {
            console.error("Failed to update call status:", err);
            alert("Failed to update call status");
        }
    };

    // Filter inquiries based on search and called filter
    const filteredInquiries = roomInquiries.filter(inquiry => {
        const matchesCalled = calledFilter === 'all' || 
            (calledFilter === 'called' && !!inquiry.called) || 
            (calledFilter === 'not_called' && !inquiry.called);

        const q = searchQuery.toLowerCase().trim();
        const matchesSearch = !q ||
            (inquiry.name || '').toLowerCase().includes(q) ||
            (inquiry.phone || '').toLowerCase().includes(q) ||
            (inquiry.city || '').toLowerCase().includes(q) ||
            (inquiry.location || '').toLowerCase().includes(q) ||
            (inquiry.requirements || '').toLowerCase().includes(q) ||
            (inquiry.occupancy || '').toLowerCase().includes(q);

        return matchesCalled && matchesSearch;
    });

    const visibleInquiries = filteredInquiries.slice(0, visibleCount);

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-orange-500">
                    <BedDouble />
                    Find Your Room Requests
                </h2>
                <span className="bg-orange-500/10 text-orange-400 px-3 py-1 rounded-full text-xs font-bold border border-orange-500/20">
                    {filteredInquiries.length} Found
                </span>
            </div>

            {/* Search & Filter Panel */}
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50">
                {/* Search Bar */}
                <div className="flex-grow flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-300">
                    <Search size={16} className="text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search by name, phone, location, occupancy, requirements..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent text-sm focus:outline-none w-full text-white placeholder-slate-500"
                    />
                </div>

                {/* Called Dropdown */}
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 shrink-0">
                    <SlidersHorizontal size={14} className="text-slate-500" />
                    <span className="text-xs font-semibold text-slate-400">Call Track:</span>
                    <select
                        value={calledFilter}
                        onChange={(e) => setCalledFilter(e.target.value)}
                        className="bg-transparent text-slate-200 text-sm focus:outline-none cursor-pointer"
                    >
                        <option value="all" className="bg-slate-900">All</option>
                        <option value="called" className="bg-slate-900">Called</option>
                        <option value="not_called" className="bg-slate-900">Not Called</option>
                    </select>
                </div>
            </div>

            {/* Grid display */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleInquiries.length === 0 ? (
                    <div className="col-span-full text-center py-20 text-slate-500 bg-slate-800/50 rounded-2xl border border-slate-700 border-dashed">
                        No room inquiries found matching your filters.
                    </div>
                ) : (
                    visibleInquiries.map(inquiry => {
                        const isCalled = !!inquiry.called;
                        return (
                            <div key={inquiry.id} className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-sm relative group hover:border-slate-600 transition-colors flex flex-col justify-between">
                                <div>
                                    <button
                                        onClick={async () => {
                                            if (window.confirm("Delete this inquiry?")) {
                                                try {
                                                    await deleteDoc(doc(db, "room_inquiries", inquiry.id));
                                                } catch { alert("Delete failed"); }
                                            }
                                        }}
                                        className="absolute top-4 right-4 p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 border border-transparent hover:border-red-500/20"
                                        title="Delete inquiry"
                                    >
                                        <Trash2 size={16} />
                                    </button>

                                    <div className="mb-4 space-y-1.5">
                                        <h3 className="text-lg font-bold text-white leading-tight">{inquiry.name}</h3>
                                        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
                                            <Phone size={14} className="text-orange-500 shrink-0" />
                                            <a href={`tel:${inquiry.phone}`} className="text-slate-350 hover:text-emerald-400 font-mono text-xs">
                                                {inquiry.phone}
                                            </a>
                                            {inquiry.contactMethod && (
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded border font-black uppercase ${inquiry.contactMethod === 'whatsapp' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                                                    {inquiry.contactMethod.toUpperCase()}
                                                </span>
                                            )}
                                            
                                            {/* Called Badges */}
                                            {isCalled ? (
                                                <span className="text-[9px] px-1.5 py-0.5 rounded border font-black bg-emerald-500/15 text-emerald-400 border-emerald-500/20 flex items-center gap-1 shrink-0 uppercase tracking-wide">
                                                    <PhoneCall size={9} /> Called
                                                </span>
                                            ) : (
                                                <span className="text-[9px] px-1.5 py-0.5 rounded border font-black bg-slate-900 text-slate-450 border-slate-700/80 flex items-center gap-1 shrink-0 uppercase tracking-wide">
                                                    <PhoneOff size={9} /> Not Called
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-3 bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 text-sm">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-500">Location</p>
                                                <p className="text-slate-200 font-semibold">
                                                    {inquiry.city ? `${inquiry.city === 'baleshwar' ? 'Balasore' : inquiry.city.charAt(0).toUpperCase() + inquiry.city.slice(1)}, ` : ''}
                                                    {inquiry.location}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-500">Budget</p>
                                                <p className="text-emerald-400 font-bold">{inquiry.budget}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-slate-500">Occupancy</p>
                                            <p className="text-slate-200 capitalize font-medium">{inquiry.occupancy}</p>
                                        </div>
                                        {inquiry.requirements && (
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-500">Requirements</p>
                                                <p className="text-slate-400 italic">"{inquiry.requirements}"</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-700 flex flex-col gap-3">
                                    {/* Mark Called / Not Called Toggle */}
                                    <button
                                        onClick={() => handleToggleCalled(inquiry.id, isCalled)}
                                        className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 border ${
                                            isCalled
                                                ? 'bg-slate-900 text-slate-400 border-slate-750 hover:bg-slate-750'
                                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                        }`}
                                    >
                                        <PhoneCall size={12} />
                                        {isCalled ? 'Mark as Not Called' : 'Mark as Called'}
                                    </button>

                                    <div className="text-[10px] text-slate-500 flex justify-between items-center">
                                        <span>Submitted: {inquiry.createdAt?.seconds ? new Date(inquiry.createdAt.seconds * 1000).toLocaleString() : 'Just now'}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination View More Button */}
            {visibleCount < filteredInquiries.length && (
                <div className="flex justify-center pt-4">
                    <button
                        onClick={() => setVisibleCount(prev => prev + 10)}
                        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700 transition-all hover:scale-105 active:scale-95 shadow-md flex items-center gap-2 text-sm"
                    >
                        View More ({filteredInquiries.length - visibleCount} remaining)
                    </button>
                </div>
            )}
        </div>
    );
};

export default RoomInquiriesTab;
