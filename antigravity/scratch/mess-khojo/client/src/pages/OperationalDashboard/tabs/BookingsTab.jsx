import React from 'react';
import { Calendar, Users, Eye, EyeOff, CheckCircle, XCircle, Trash2 } from 'lucide-react';
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
    return (
        <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Calendar className="text-emerald-500" />
                All Call Requests
            </h2>
            <div className="space-y-4">
                {bookings.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 bg-slate-800/50 rounded-2xl border border-slate-700 border-dashed">
                        No call requests found in the system.
                    </div>
                ) : (
                    bookings.map(booking => (
                        <div key={booking.id} className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-sm flex flex-col md:flex-row justify-between gap-4">
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${booking.status === 'confirmed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                        booking.status === 'rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                            'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                        }`}>
                                        {booking.status}
                                    </span>
                                    <span className="text-slate-500 text-xs">ID: {booking.id.slice(0, 8)}</span>
                                </div>
                                <h3 className="font-bold text-white text-lg">{booking.messName}</h3>
                                <p className="text-slate-400 text-sm">{booking.roomType} Room • ₹{booking.price}/{booking.rentCycle === 'yearly' ? 'yr' : 'mo'}</p>
                                <div className="pt-2 flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-1 text-slate-300">
                                        <Users size={14} /> {booking.userName}
                                    </div>
                                    <div className="text-slate-400 flex items-center gap-2">
                                        <span className="font-mono bg-slate-900 px-2 py-1 rounded">
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
                                </div>

                                {booking.status !== 'pending' && booking.remark && (
                                    <div className="mt-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 text-xs text-slate-400 italic">
                                        Remark: {booking.remark}
                                    </div>
                                )}
                            </div>

                            {booking.status === 'pending' ? (
                                <div className="flex flex-col gap-3 min-w-[280px]">
                                    <textarea
                                        placeholder="Write a remark (optional)..."
                                        value={bookingRemarks[booking.id] || ''}
                                        onChange={(e) => setBookingRemarks(prev => ({ ...prev, [booking.id]: e.target.value }))}
                                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none resize-none h-20"
                                    />
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleBookingAction(booking.id, 'confirmed')}
                                            disabled={!!bookingActionLoading[booking.id]}
                                            className="flex-1 flex items-center justify-center gap-1 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors shadow-lg shadow-green-900/20 text-sm"
                                        >
                                            {bookingActionLoading[booking.id] ? '...' : <><CheckCircle size={16} /> Approve</>}
                                        </button>
                                        <button
                                            onClick={() => handleBookingAction(booking.id, 'rejected')}
                                            disabled={!!bookingActionLoading[booking.id]}
                                            className="flex-1 flex items-center justify-center gap-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 rounded-lg font-medium transition-colors border border-slate-600 text-sm"
                                        >
                                            {bookingActionLoading[booking.id] ? '...' : <><XCircle size={16} /> Reject</>}
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
                                    className="self-end md:self-center flex items-center gap-1 px-4 py-2 bg-slate-700 hover:bg-red-500/20 hover:text-red-400 text-slate-400 rounded-lg text-sm font-medium transition-all border border-slate-600"
                                >
                                    <Trash2 size={16} /> Delete
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default BookingsTab;
