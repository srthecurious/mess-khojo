import React from 'react';
import { BedDouble, Phone, Trash2 } from 'lucide-react';
import { db } from '../../../firebase';
import { deleteDoc, doc } from 'firebase/firestore';

const RoomInquiriesTab = ({ roomInquiries }) => {
    return (
        <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-orange-500">
                <BedDouble />
                Find Your Room Requests
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roomInquiries.length === 0 ? (
                    <div className="col-span-full text-center py-20 text-slate-500 bg-slate-800/50 rounded-2xl border border-slate-700 border-dashed">
                        No room inquiries found.
                    </div>
                ) : (
                    roomInquiries.map(inquiry => (
                        <div key={inquiry.id} className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-sm relative group">
                            <button
                                onClick={async () => {
                                    if (window.confirm("Delete this inquiry?")) {
                                        try {
                                            await deleteDoc(doc(db, "room_inquiries", inquiry.id));
                                        } catch { alert("Delete failed"); }
                                    }
                                }}
                                className="absolute top-4 right-4 p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={16} />
                            </button>

                            <div className="mb-4">
                                <h3 className="text-lg font-bold text-white mb-1">{inquiry.name}</h3>
                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <Phone size={14} className="text-orange-500" />
                                    {inquiry.phone}
                                    {inquiry.contactMethod && (
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${inquiry.contactMethod === 'whatsapp' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                                            {inquiry.contactMethod.toUpperCase()}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3 bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 text-sm">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-500">Location</p>
                                        <p className="text-slate-200">{inquiry.location}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-500">Budget</p>
                                        <p className="text-emerald-400 font-medium">{inquiry.budget}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-500">Occupancy</p>
                                    <p className="text-slate-200 capitalize">{inquiry.occupancy}</p>
                                </div>
                                {inquiry.requirements && (
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-500">Requirements</p>
                                        <p className="text-slate-400 italic">"{inquiry.requirements}"</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-700 text-[10px] text-slate-500 flex justify-between">
                                <span>Submitted: {inquiry.createdAt?.seconds ? new Date(inquiry.createdAt.seconds * 1000).toLocaleString() : 'Just now'}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default RoomInquiriesTab;
