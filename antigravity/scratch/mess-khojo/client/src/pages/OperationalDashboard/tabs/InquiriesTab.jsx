import React, { useState } from 'react';
import { Shield, Phone, CheckCircle, Trash2, Search, SlidersHorizontal } from 'lucide-react';
import { db } from '../../../firebase';
import { updateDoc, deleteDoc, doc } from 'firebase/firestore';

const InquiriesTab = ({ inquiries }) => {
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'resolved'
    const [searchQuery, setSearchQuery] = useState('');
    const [visibleCount, setVisibleCount] = useState(10);

    const [prevStatusFilter, setPrevStatusFilter] = useState(statusFilter);
    const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery);
    const [prevInquiries, setPrevInquiries] = useState(inquiries);

    // Reset pagination when filters or data change
    if (statusFilter !== prevStatusFilter || searchQuery !== prevSearchQuery || inquiries !== prevInquiries) {
        setPrevStatusFilter(statusFilter);
        setPrevSearchQuery(searchQuery);
        setPrevInquiries(inquiries);
        setVisibleCount(10);
    }

    // Filter inquiries
    const filteredInquiries = inquiries.filter(inquiry => {
        const matchesStatus = statusFilter === 'all' || inquiry.status === statusFilter;
        
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch = !q || 
            (inquiry.name || '').toLowerCase().includes(q) ||
            (inquiry.phone || '').toLowerCase().includes(q) ||
            (inquiry.messName || '').toLowerCase().includes(q);

        return matchesStatus && matchesSearch;
    });

    const visibleInquiries = filteredInquiries.slice(0, visibleCount);

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header & Filters Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Shield className="text-rose-500" size={28} />
                    <div>
                        <h2 className="text-2xl font-bold text-white">Unregistered Queries</h2>
                        <p className="text-slate-400 text-xs mt-0.5 font-medium">Handle student inquiries and availability requests for sold-out rooms</p>
                    </div>
                </div>

                <span className="bg-rose-500/10 text-rose-500 px-3 py-1 rounded-full text-xs font-bold border border-rose-500/20 self-start md:self-auto">
                    {filteredInquiries.length} Found
                </span>
            </div>

            {/* Filter controls panel */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50">
                {/* Search Bar */}
                <div className="flex-grow flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-300">
                    <Search size={16} className="text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search by name, phone, target mess..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent text-sm focus:outline-none w-full text-white placeholder-slate-500"
                    />
                </div>

                {/* Status Dropdown */}
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 shrink-0">
                    <SlidersHorizontal size={14} className="text-slate-500" />
                    <span className="text-xs font-semibold text-slate-400">Status:</span>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-transparent text-slate-200 text-sm focus:outline-none cursor-pointer"
                    >
                        <option value="all" className="bg-slate-900">All</option>
                        <option value="pending" className="bg-slate-900">Pending</option>
                        <option value="resolved" className="bg-slate-900">Resolved</option>
                    </select>
                </div>
            </div>

            {/* Inquiries Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleInquiries.length === 0 ? (
                    <div className="col-span-full text-center py-20 text-slate-500 bg-slate-800/50 rounded-2xl border border-slate-700 border-dashed">
                        No queries found matching the search criteria.
                    </div>
                ) : (
                    visibleInquiries.map(inquiry => (
                        <div key={inquiry.id} className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl flex flex-col justify-between hover:border-slate-600 transition-colors">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${inquiry.status === 'resolved' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'}`}>
                                        {inquiry.status}
                                    </span>
                                    <span className="text-slate-500 text-[10px] font-mono tracking-tighter">#{inquiry.id.slice(-6)}</span>
                                </div>

                                <div className="mb-4">
                                    <h3 className="text-lg font-bold text-white mb-1.5">{inquiry.name}</h3>
                                    <a href={`tel:${inquiry.phone}`} className="text-slate-300 hover:text-emerald-400 text-sm flex items-center gap-1.5 font-mono">
                                        <Phone size={14} className="text-emerald-500" />
                                        {inquiry.phone}
                                    </a>
                                </div>

                                <div className="bg-slate-900/50 rounded-xl p-4 mb-6 border border-slate-700/50">
                                    <div className="flex flex-col gap-3 text-xs">
                                        <div>
                                            <p className="text-[9px] text-slate-500 uppercase font-black tracking-wider mb-1">Target Mess</p>
                                            <p className="text-slate-200 font-bold">{inquiry.messName}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 border-t border-slate-800 pt-2">
                                            <div>
                                                <p className="text-[9px] text-slate-500 uppercase font-black tracking-wider mb-1">Looking For</p>
                                                <p className="text-emerald-400 font-extrabold">{inquiry.seating || inquiry.roomType || 'Standard'}</p>
                                            </div>
                                            {inquiry.type === 'availability_request' && (
                                                <div>
                                                    <p className="text-[9px] text-indigo-400 uppercase font-black tracking-wider mb-1">Request Type</p>
                                                    <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                                        SOLD-OUT ALERT
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        {inquiry.message && (
                                            <div className="pt-2 border-t border-slate-800">
                                                <p className="text-[9px] text-slate-500 uppercase font-black tracking-wider mb-1">Message</p>
                                                <p className="text-slate-400 italic font-medium leading-relaxed">"{inquiry.message}"</p>
                                            </div>
                                        )}
                                        <div className="pt-2 border-t border-slate-700/40">
                                            <p className="text-[9px] text-slate-500 uppercase font-black tracking-wider mb-0.5">Requested On</p>
                                            <p className="text-slate-400 text-[10px]">
                                                {inquiry.createdAt?.seconds ? new Date(inquiry.createdAt.seconds * 1000).toLocaleString() : 'Recently'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions panel */}
                            <div className="grid grid-cols-2 gap-3 mt-auto pt-3 border-t border-slate-750">
                                {inquiry.status === 'pending' ? (
                                    <button
                                        onClick={async () => {
                                            try {
                                                await updateDoc(doc(db, "inquiries", inquiry.id), { status: 'resolved' });
                                            } catch { alert("Failed to resolve"); }
                                        }}
                                        className="col-span-2 flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-950/20 active:scale-95"
                                    >
                                        <CheckCircle size={14} /> Mark Resolved
                                    </button>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-center gap-1.5 bg-emerald-500/10 text-emerald-500 py-2.5 rounded-xl text-xs font-bold border border-emerald-500/20">
                                            <CheckCircle size={14} /> Resolved
                                        </div>
                                        <button
                                            onClick={async () => {
                                                if (window.confirm("Delete this solved query?")) {
                                                    try {
                                                        await deleteDoc(doc(db, "inquiries", inquiry.id));
                                                    } catch { alert("Delete failed"); }
                                                }
                                            }}
                                            className="flex items-center justify-center gap-1.5 bg-slate-700 hover:bg-red-500/20 hover:text-red-400 text-slate-400 py-2.5 rounded-xl text-xs font-bold transition-all border border-slate-600"
                                        >
                                            <Trash2 size={14} /> Delete
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))
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

export default InquiriesTab;
