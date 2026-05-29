import React, { useState } from 'react';
import { Briefcase, ClipboardCheck, CheckCircle, Trash2, SlidersHorizontal } from 'lucide-react';
import { db } from '../../../firebase';
import { updateDoc, deleteDoc, doc } from 'firebase/firestore';

const ClaimsTab = ({ claims }) => {
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'resolved'
    const [visibleCount, setVisibleCount] = useState(10);

    const [prevStatusFilter, setPrevStatusFilter] = useState(statusFilter);
    const [prevClaims, setPrevClaims] = useState(claims);

    // Reset pagination when filters or data changes
    if (statusFilter !== prevStatusFilter || claims !== prevClaims) {
        setPrevStatusFilter(statusFilter);
        setPrevClaims(claims);
        setVisibleCount(10);
    }

    // Filter claims
    const filteredClaims = claims.filter(claim => {
        if (statusFilter === 'all') return true;
        return claim.status === statusFilter;
    });

    const visibleClaims = filteredClaims.slice(0, visibleCount);

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header and Filter Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-amber-500">
                    <Briefcase />
                    Listing Claim Requests
                </h2>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5">
                        <SlidersHorizontal size={14} className="text-slate-400" />
                        <span className="text-xs font-semibold text-slate-400">Status:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-transparent text-slate-200 text-sm focus:outline-none cursor-pointer"
                        >
                            <option value="all" className="bg-slate-800">All</option>
                            <option value="pending" className="bg-slate-800">Pending</option>
                            <option value="resolved" className="bg-slate-800">Resolved</option>
                        </select>
                    </div>

                    <span className="bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/20">
                        {filteredClaims.length} Found
                    </span>
                </div>
            </div>

            {/* Claims list */}
            <div className="space-y-4">
                {visibleClaims.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 bg-slate-800/50 rounded-2xl border border-slate-700 border-dashed">
                        No claim requests found matching the filter.
                    </div>
                ) : (
                    visibleClaims.map(claim => (
                        <div key={claim.id} className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-sm hover:border-slate-600 transition-colors">
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                <div className="space-y-2 flex-grow">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${claim.status === 'resolved' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
                                            {claim.status}
                                        </span>
                                        <span className="text-slate-500 text-xs font-mono">Claim ID: {claim.id.slice(0, 8)}</span>
                                    </div>
                                    <h3 className="font-bold text-white text-xl flex flex-wrap items-center gap-2">
                                        {claim.messName}
                                        <span className="text-xs font-normal text-slate-400 font-mono">(ID: {claim.messId?.slice(0, 8)}...)</span>
                                    </h3>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 text-xs">
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-wider">Claimant Name</p>
                                            <p className="text-slate-200 font-semibold">{claim.userName}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-wider">Email Address</p>
                                            <p className="text-slate-200 font-semibold">{claim.userEmail}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-wider">Phone Number</p>
                                            <p className="text-slate-200 font-semibold">{claim.userPhone}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-wider">Request Date</p>
                                            <p className="text-slate-200 font-semibold">
                                                {claim.createdAt?.seconds ? new Date(claim.createdAt.seconds * 1000).toLocaleString() : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-row md:flex-col gap-2 self-start md:self-stretch justify-end md:justify-center min-w-[150px]">
                                    {claim.status === 'pending' ? (
                                        <button
                                            onClick={async () => {
                                                try {
                                                    await updateDoc(doc(db, "claims", claim.id), { status: 'resolved' });
                                                } catch { alert("Update failed"); }
                                            }}
                                            className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-emerald-950/20 active:scale-95"
                                        >
                                            <ClipboardCheck size={14} /> Mark Resolved
                                        </button>
                                    ) : (
                                        <>
                                            <span className="w-full text-center text-emerald-500 text-xs font-bold flex items-center justify-center gap-1 bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20">
                                                <CheckCircle size={14} /> Resolved
                                            </span>
                                            <button
                                                onClick={async () => {
                                                    if (window.confirm("Delete this resolved claim record?")) {
                                                        try {
                                                            await deleteDoc(doc(db, "claims", claim.id));
                                                        } catch { alert("Delete failed"); }
                                                    }
                                                }}
                                                className="w-full flex items-center justify-center gap-1 px-4 py-2 bg-slate-700 hover:bg-red-500/20 hover:text-red-400 text-slate-400 rounded-lg text-xs font-bold transition-all border border-slate-600"
                                            >
                                                <Trash2 size={14} /> Delete Claim
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination View More Button */}
            {visibleCount < filteredClaims.length && (
                <div className="flex justify-center pt-4">
                    <button
                        onClick={() => setVisibleCount(prev => prev + 10)}
                        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700 transition-all hover:scale-105 active:scale-95 shadow-md flex items-center gap-2 text-sm"
                    >
                        View More ({filteredClaims.length - visibleCount} remaining)
                    </button>
                </div>
            )}
        </div>
    );
};

export default ClaimsTab;
