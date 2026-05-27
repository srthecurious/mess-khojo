import React from 'react';
import { Shield, Phone, CheckCircle, Trash2 } from 'lucide-react';
import { db } from '../../../firebase';
import { updateDoc, deleteDoc, doc } from 'firebase/firestore';

const InquiriesTab = ({ inquiries }) => {
    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-rose-500">
                    <Shield />
                    Unregistered Queries
                </h2>
                <span className="bg-rose-500/10 text-rose-500 px-3 py-1 rounded-full text-sm font-bold border border-rose-500/20">
                    {inquiries.length} Total
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {inquiries.length === 0 ? (
                    <div className="col-span-full text-center py-20 text-slate-500 bg-slate-800/50 rounded-2xl border border-slate-700 border-dashed">
                        No unregistered queries found.
                    </div>
                ) : (
                    inquiries.map(inquiry => (
                        <div key={inquiry.id} className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl flex flex-col h-full">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${inquiry.status === 'resolved' ? 'bg-green-500/20 text-green-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                    {inquiry.status}
                                </div>
                                <span className="text-slate-500 text-[10px] font-mono tracking-tighter">#{inquiry.id.slice(-6)}</span>
                            </div>

                            <div className="mb-4">
                                <h3 className="text-lg font-bold text-white mb-1">{inquiry.name}</h3>
                                <p className="text-slate-400 text-sm flex items-center gap-2">
                                    <Phone size={14} className="text-emerald-500" />
                                    {inquiry.phone}
                                </p>
                            </div>

                            <div className="bg-slate-900/50 rounded-xl p-4 mb-6 border border-slate-700/50 flex-grow">
                                <div className="flex flex-col gap-3">
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Target Mess</p>
                                        <p className="text-slate-200 text-sm font-medium">{inquiry.messName}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Looking For</p>
                                        <p className="text-emerald-400 text-sm font-bold">{inquiry.seating}</p>
                                    </div>
                                    <div className="pt-2 border-t border-slate-700/50">
                                        <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Requested On</p>
                                        <p className="text-slate-400 text-[11px]">
                                            {inquiry.createdAt?.seconds ? new Date(inquiry.createdAt.seconds * 1000).toLocaleString() : 'Recently'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-auto">
                                {inquiry.status === 'pending' ? (
                                    <button
                                        onClick={async () => {
                                            try {
                                                await updateDoc(doc(db, "inquiries", inquiry.id), { status: 'resolved' });
                                            } catch { alert("Failed to resolve"); }
                                        }}
                                        className="col-span-2 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-900/20"
                                    >
                                        <CheckCircle size={14} /> Resolve
                                    </button>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-center gap-2 bg-emerald-500/10 text-emerald-500 py-2.5 rounded-xl text-xs font-bold border border-emerald-500/20">
                                            <CheckCircle size={14} /> Done
                                        </div>
                                        <button
                                            onClick={async () => {
                                                if (window.confirm("Delete this solved query?")) {
                                                    try {
                                                        await deleteDoc(doc(db, "inquiries", inquiry.id));
                                                    } catch { alert("Delete failed"); }
                                                }
                                            }}
                                            className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-red-500/20 hover:text-red-400 text-slate-400 py-2.5 rounded-xl text-xs font-bold transition-all border border-slate-600"
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
        </div>
    );
};

export default InquiriesTab;
