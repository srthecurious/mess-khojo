import React from 'react';
import { Building2, Calendar, Trash2, Phone, MapPin, Monitor, CheckCircle } from 'lucide-react';
import { db } from '../../../firebase';
import { deleteDoc, doc } from 'firebase/firestore';

const RegistrationsTab = ({ registrations, handleApproveRegistration }) => {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-blue-500">
                <Building2 />
                New Mess Registrations
            </h2>
            <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
                {registrations.map(reg => (
                    <div key={reg.id} className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-500/10 rounded-lg">
                                    <Building2 className="text-blue-500" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">{reg.messName}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${reg.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>
                                            {reg.status}
                                        </span>
                                        <span className="text-slate-500 text-xs flex items-center gap-1">
                                            <Calendar size={12} />
                                            {reg.createdAt?.seconds ? new Date(reg.createdAt.seconds * 1000).toLocaleDateString() : 'Recently'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={async () => {
                                    if (window.confirm("Delete this registration?")) {
                                        try {
                                            await deleteDoc(doc(db, "mess_registrations", reg.id));
                                        } catch { alert("Delete failed"); }
                                    }
                                }}
                                className="p-2 hover:bg-red-500/20 hover:text-red-400 text-slate-400 rounded-lg transition-colors border border-transparent hover:border-red-500/30"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>

                        <div className="space-y-3 bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-slate-500 text-xs uppercase font-bold mb-1">Mess Type</p>
                                    <div className="flex flex-wrap gap-1">
                                        {reg.messType?.map((t, i) => (
                                            <span key={i} className="px-2 py-1 bg-slate-800 rounded text-xs text-white border border-slate-700">
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs uppercase font-bold mb-1">Phone</p>
                                    <a href={`tel:${reg.phoneNumber}`} className="text-blue-400 hover:underline flex items-center gap-1 font-mono text-sm">
                                        <Phone size={14} /> {reg.phoneNumber}
                                    </a>
                                </div>
                            </div>

                            <div>
                                <p className="text-slate-500 text-xs uppercase font-bold mb-1">Location Details</p>
                                <div className="space-y-2">
                                    <div className="flex items-start gap-2 text-slate-300 text-sm bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/30">
                                        <MapPin size={16} className="mt-0.5 shrink-0 text-amber-500" />
                                        <div>
                                            <p className="text-[10px] font-semibold text-slate-400 uppercase">Landmark / Address</p>
                                            <p className="text-slate-200 mt-0.5">{reg.landmark || "Not provided"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2 text-slate-300 text-sm bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/30">
                                        <Monitor size={16} className="mt-0.5 shrink-0 text-blue-500" />
                                        <div>
                                            <p className="text-[10px] font-semibold text-slate-400 uppercase">GPS Coordinates</p>
                                            {reg.gpsLatitude !== undefined && reg.gpsLatitude !== null && reg.gpsLongitude !== undefined && reg.gpsLongitude !== null ? (
                                                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                                                    <span className="font-mono text-slate-200 bg-slate-950 px-2 py-0.5 rounded text-xs">
                                                        {Number(reg.gpsLatitude).toFixed(6)}, {Number(reg.gpsLongitude).toFixed(6)}
                                                    </span>
                                                    {reg.gpsAccuracy !== undefined && reg.gpsAccuracy !== null && (
                                                        <span className="text-[10px] text-slate-500">
                                                            (Accuracy: ±{Number(reg.gpsAccuracy).toFixed(1)}m)
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-slate-500 italic mt-0.5">No GPS coordinates captured</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <p className="text-slate-500 text-xs uppercase font-bold mb-1">Rooms & Rent</p>
                                <div className="flex flex-col gap-1 mt-1">
                                    {reg.roomVariants
                                        ? Object.entries(reg.roomVariants).map(([type, variants], i) => {
                                            const lowestPrice = Array.isArray(variants)
                                                ? Math.min(...variants.map(v => Number(v.price) || 0))
                                                : null;
                                            const cycleSuffix = reg.rentCycle === 'yearly' ? '/yr' : '/mo';
                                            return (
                                                <div key={i} className="flex justify-between items-center text-sm bg-slate-800/50 px-3 py-1.5 rounded border border-slate-700/50">
                                                    <span className="text-emerald-400 font-medium">{type}</span>
                                                    <span className="text-slate-300 font-mono text-xs">
                                                        {lowestPrice ? `₹${lowestPrice}${cycleSuffix}` : 'See variants'}
                                                    </span>
                                                </div>
                                            );
                                        })
                                        : reg.roomTypes?.map((t, i) => (
                                            <div key={i} className="flex justify-between items-center text-sm bg-slate-800/50 px-3 py-1.5 rounded border border-slate-700/50">
                                                <span className="text-emerald-400 font-medium">{t}</span>
                                                <span className="text-slate-300 font-mono text-xs">
                                                    {reg.rentInfo?.[t] ? `₹${reg.rentInfo[t]}${reg.rentCycle === 'yearly' ? '/yr' : '/mo'}` : 'No rent info'}
                                                </span>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>

                            {reg.vacantRooms && reg.vacantRooms.length > 0 && (
                                <p className="text-xs text-slate-400 mt-2">
                                    <span className="font-bold text-slate-300">Vacant:</span> {reg.vacantRooms.join(', ')}
                                </p>
                            )}

                            {(reg.advancePayment?.type || reg.maintenanceCharge?.taken) && (
                                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-700/50">
                                    {reg.advancePayment?.type && (
                                        <div>
                                            <p className="text-slate-500 text-[10px] uppercase font-bold mb-1">Advance Payment</p>
                                            <p className="text-slate-300 text-sm font-medium">
                                                {reg.advancePayment.type === 'Custom Amount' ? `₹${reg.advancePayment.customAmount}` : reg.advancePayment.type}
                                            </p>
                                        </div>
                                    )}
                                    {reg.maintenanceCharge?.taken && (
                                        <div>
                                            <p className="text-slate-500 text-[10px] uppercase font-bold mb-1">Maintenance Charge</p>
                                            <p className="text-slate-300 text-sm font-medium">
                                                ₹{reg.maintenanceCharge.amount} <span className="text-xs text-slate-500">({reg.maintenanceCharge.frequency})</span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div>
                                <p className="text-slate-500 text-xs uppercase font-bold mb-1">Facilities & Inclusions</p>
                                <div className="flex flex-wrap gap-1 mb-2">
                                    {reg.facilities?.map((f, i) => (
                                        <span key={`fac-${i}`} className="px-2 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded text-[10px] font-medium">
                                            {f}
                                        </span>
                                    ))}
                                    {reg.includedInRent?.map((inc, i) => (
                                        <span key={`inc-${i}`} className="px-2 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded text-[10px] font-bold flex items-center gap-1">
                                            <CheckCircle size={10} /> {inc}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {reg.status === 'pending' ? (
                                <div className="mt-4 pt-4 border-t border-slate-700/50 flex gap-3">
                                    <button
                                        onClick={() => handleApproveRegistration(reg)}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/20 active:scale-95 transition-all text-sm"
                                    >
                                        <CheckCircle size={16} /> Approve & Register (1-Click)
                                    </button>
                                </div>
                            ) : (
                                <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-2 text-xs">
                                    <div className="flex items-center gap-2 text-green-400 bg-green-500/10 px-3 py-2.5 rounded-lg border border-green-500/20">
                                        <CheckCircle size={16} className="shrink-0" />
                                        <div>
                                            <p className="font-bold">Approved & Mess Registered</p>
                                            {reg.partnerId && <p className="text-[10px] text-slate-400 mt-0.5">Partner ID: <code className="text-green-300 bg-slate-950 px-1.5 py-0.5 rounded font-mono">{reg.partnerId}</code></p>}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {registrations.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-500 border-2 border-dashed border-slate-700 rounded-xl">
                        <Building2 size={48} className="mb-4 opacity-50" />
                        <p className="text-lg font-medium">No mess registrations yet</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RegistrationsTab;
