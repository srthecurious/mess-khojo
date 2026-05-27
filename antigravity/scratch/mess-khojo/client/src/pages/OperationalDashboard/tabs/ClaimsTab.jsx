import React from 'react';
import { Briefcase, ClipboardCheck, CheckCircle, Trash2 } from 'lucide-react';
import { db } from '../../../firebase';
import { updateDoc, deleteDoc, doc } from 'firebase/firestore';

const ClaimsTab = ({ claims }) => {
    return (
        <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-amber-500">
                <Briefcase />
                Listing Claim Requests
            </h2>
            <div className="space-y-4">
                {claims.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 bg-slate-800/50 rounded-2xl border border-slate-700 border-dashed">
                        No claim requests found.
                    </div>
                ) : (
                    claims.map(claim => (
                        <div key={claim.id} className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-sm">
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${claim.status === 'resolved' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                            {claim.status}
                                        </span>
                                        <span className="text-slate-500 text-xs">Claim ID: {claim.id.slice(0, 8)}</span>
                                    </div>
                                    <h3 className="font-bold text-white text-xl flex items-center gap-2">
                                        {claim.messName}
                                        <span className="text-xs font-normal text-slate-400">(ID: {claim.messId?.slice(0, 6)}...)</span>
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mt-4 bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Claimant Name</p>
                                            <p className="text-slate-200 font-medium">{claim.userName}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Email Address</p>
                                            <p className="text-slate-200 font-medium">{claim.userEmail}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Phone Number</p>
                                            <p className="text-slate-200 font-medium">{claim.userPhone}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Request Date</p>

                                            <p className="text-slate-200 font-medium">
                                                {claim.createdAt?.seconds ? new Date(claim.createdAt.seconds * 1000).toLocaleString() : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-row md:flex-col gap-2 self-start md:justify-center">
                                    {claim.status === 'pending' ? (
                                        <button
                                            onClick={async () => {
                                                try {
                                                    await updateDoc(doc(db, "claims", claim.id), { status: 'resolved' });
                                                } catch { alert("Update failed"); }
                                            }}
                                            className="flex items-center gap-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-emerald-900/20"
                                        >
                                            <ClipboardCheck size={16} /> Mark Resolved
                                        </button>
                                    ) : (
                                        <>
                                            <span className="text-emerald-500 text-sm font-bold flex items-center gap-1 bg-emerald-500/10 px-3 py-2 rounded-lg">
                                                <CheckCircle size={16} /> Resolved
                                            </span>
                                            <button
                                                onClick={async () => {
                                                    if (window.confirm("Delete this resolved claim record?")) {
                                                        try {
                                                            await deleteDoc(doc(db, "claims", claim.id));
                                                        } catch { alert("Delete failed"); }
                                                    }
                                                }}
                                                className="flex items-center gap-1 px-4 py-2 bg-slate-700 hover:bg-red-500/20 hover:text-red-400 text-slate-400 rounded-lg text-sm font-medium transition-all border border-slate-600"
                                            >
                                                <Trash2 size={16} /> Delete
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ClaimsTab;
