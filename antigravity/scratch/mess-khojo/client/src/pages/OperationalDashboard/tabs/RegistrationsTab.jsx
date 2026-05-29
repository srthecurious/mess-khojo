import React, { useState } from 'react';
import { Building2, Calendar, Trash2, Phone, MapPin, Monitor, CheckCircle, Navigation, User, ArrowUpDown, SlidersHorizontal } from 'lucide-react';
import { db } from '../../../firebase';
import { deleteDoc, doc } from 'firebase/firestore';

const RegistrationsTab = ({ registrations, handleApproveRegistration }) => {
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'approved'
    const [sortOrder, setSortOrder] = useState('newest'); // 'newest', 'oldest'
    const [visibleCount, setVisibleCount] = useState(10);

    const [prevStatusFilter, setPrevStatusFilter] = useState(statusFilter);
    const [prevSortOrder, setPrevSortOrder] = useState(sortOrder);
    const [prevRegistrations, setPrevRegistrations] = useState(registrations);

    // Reset pagination when filters, sort or registrations list change
    if (statusFilter !== prevStatusFilter || sortOrder !== prevSortOrder || registrations !== prevRegistrations) {
        setPrevStatusFilter(statusFilter);
        setPrevSortOrder(sortOrder);
        setPrevRegistrations(registrations);
        setVisibleCount(10);
    }

    // Handle Google Maps Redirect
    const getGoogleMapsUrl = (lat, lng) => {
        return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    };

    // Filter & Sort Registrations
    const filteredRegistrations = registrations.filter(reg => {
        if (statusFilter === 'all') return true;
        return reg.status === statusFilter;
    });

    const sortedRegistrations = [...filteredRegistrations].sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });

    const visibleRegistrations = sortedRegistrations.slice(0, visibleCount);

    return (
        <div className="space-y-6">
            {/* Header & Filter Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Building2 className="text-blue-500" size={28} />
                    <div>
                        <h2 className="text-2xl font-bold text-white">New Mess Registrations</h2>
                        <p className="text-slate-400 text-xs mt-0.5">Approve and set up mess profiles for owners</p>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-3">
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
                            <option value="approved" className="bg-slate-800">Approved</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5">
                        <ArrowUpDown size={14} className="text-slate-400" />
                        <span className="text-xs font-semibold text-slate-400">Sort:</span>
                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            className="bg-transparent text-slate-200 text-sm focus:outline-none cursor-pointer"
                        >
                            <option value="newest" className="bg-slate-800">Newest First</option>
                            <option value="oldest" className="bg-slate-800">Oldest First</option>
                        </select>
                    </div>

                    <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-xs font-bold border border-blue-500/20">
                        {filteredRegistrations.length} Total
                    </span>
                </div>
            </div>

            {/* Registrations Cards Grid */}
            <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
                {visibleRegistrations.map(reg => (
                    <div key={reg.id} className="bg-slate-800 rounded-2xl p-5 border border-slate-700 shadow-xl flex flex-col justify-between hover:border-slate-600 transition-colors">
                        <div>
                            {/* Card Header */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-start gap-3">
                                    <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 shrink-0">
                                        <Building2 size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg leading-snug">{reg.messName}</h3>
                                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                            {/* Status Badge */}
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${reg.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30'}`}>
                                                {reg.status}
                                            </span>
                                            
                                            {/* District Badge */}
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-slate-900 text-slate-400 border border-slate-700 flex items-center gap-1">
                                                <MapPin size={10} className="text-amber-500" />
                                                {reg.district || 'balasore'}
                                            </span>

                                            {/* Gender Badge */}
                                            {reg.gender && (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                                    For: {reg.gender}
                                                </span>
                                            )}

                                            {/* Managed By Badge */}
                                            {reg.managedBy && (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
                                                    <User size={10} />
                                                    By: {reg.managedBy}
                                                </span>
                                            )}
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
                                    className="p-2 hover:bg-red-500/20 hover:text-red-400 text-slate-400 rounded-xl transition-all border border-transparent hover:border-red-500/30 shrink-0"
                                    title="Delete registration"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            {/* Card Body Details */}
                            <div className="space-y-4 bg-slate-900/50 rounded-2xl p-4 border border-slate-700/50">
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Mess Types */}
                                    <div>
                                        <p className="text-slate-500 text-[10px] uppercase font-bold mb-1 tracking-wider">Target Types</p>
                                        <div className="flex flex-wrap gap-1">
                                            {reg.messType?.map((t, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-slate-800 rounded text-xs text-white border border-slate-700">
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Phone Link */}
                                    <div>
                                        <p className="text-slate-500 text-[10px] uppercase font-bold mb-1 tracking-wider">Contact Number</p>
                                        <a href={`tel:${reg.phoneNumber}`} className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 font-mono text-sm">
                                            <Phone size={14} /> {reg.phoneNumber}
                                        </a>
                                    </div>
                                </div>

                                {/* Location Details & GPS Map button */}
                                <div>
                                    <p className="text-slate-500 text-[10px] uppercase font-bold mb-1 tracking-wider">Location & Coordinates</p>
                                    <div className="space-y-2">
                                        <div className="flex items-start gap-2 text-slate-300 text-sm bg-slate-850 p-2.5 rounded-lg border border-slate-700/50">
                                            <MapPin size={16} className="mt-0.5 shrink-0 text-amber-500" />
                                            <div className="flex-grow">
                                                <p className="text-[10px] font-semibold text-slate-400 uppercase">Landmark / Address</p>
                                                <p className="text-slate-200 mt-0.5 text-xs">{reg.landmark || "Not provided"}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-855 p-2.5 rounded-lg border border-slate-700/50 text-slate-300 text-sm">
                                            <div className="flex items-start gap-2">
                                                <Monitor size={16} className="mt-0.5 shrink-0 text-blue-500" />
                                                <div>
                                                    <p className="text-[10px] font-semibold text-slate-400 uppercase">GPS Coordinates</p>
                                                    {reg.gpsLatitude !== undefined && reg.gpsLatitude !== null && reg.gpsLongitude !== undefined && reg.gpsLongitude !== null ? (
                                                        <div className="mt-0.5 flex flex-wrap items-center gap-2">
                                                            <span className="font-mono text-slate-200 bg-slate-950 px-2 py-0.5 rounded text-xs">
                                                                {Number(reg.gpsLatitude).toFixed(6)}, {Number(reg.gpsLongitude).toFixed(6)}
                                                            </span>
                                                            {reg.gpsAccuracy !== undefined && reg.gpsAccuracy !== null && (
                                                                <span className="text-[10px] text-slate-500 font-mono">
                                                                    ±{Number(reg.gpsAccuracy).toFixed(1)}m
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <p className="text-slate-500 italic mt-0.5 text-xs">No GPS coordinates captured</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Google Maps Button */}
                                            {reg.gpsLatitude !== undefined && reg.gpsLatitude !== null && reg.gpsLongitude !== undefined && reg.gpsLongitude !== null && (
                                                <a
                                                    href={getGoogleMapsUrl(reg.gpsLatitude, reg.gpsLongitude)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="self-end md:self-center flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-bold transition-all hover:bg-emerald-500/20"
                                                >
                                                    <Navigation size={12} className="fill-emerald-400/20" />
                                                    Open Maps
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Room Variants Details */}
                                <div>
                                    <p className="text-slate-500 text-[10px] uppercase font-bold mb-1.5 tracking-wider">Room Variants & Rent Cycles</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                                        {reg.roomVariants
                                            ? Object.entries(reg.roomVariants).map(([type, variants], i) => {
                                                const cycleSuffix = reg.rentCycle === 'yearly' ? '/yr' : '/mo';
                                                return (
                                                    <div key={i} className="flex flex-col gap-1.5 bg-slate-800/80 p-3 rounded-lg border border-slate-700/50">
                                                        <span className="text-emerald-400 font-bold text-xs">{type}</span>
                                                        <div className="space-y-1">
                                                            {Array.isArray(variants) ? (
                                                                variants.map((v, idx) => (
                                                                    <div key={idx} className="flex justify-between text-xs text-slate-300 font-mono border-t border-slate-700/30 pt-1 mt-1 first:border-0 first:pt-0 first:mt-0">
                                                                        <span className="text-slate-400">{v.label || 'Standard'}</span>
                                                                        <span className="font-bold text-white">
                                                                            ₹{v.price}{cycleSuffix} {v.isVacant ? '(Vacant)' : '(Occupied)'}
                                                                        </span>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <span className="text-slate-500 text-xs italic">No variants details</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                            : reg.roomTypes?.map((t, i) => (
                                                <div key={i} className="flex justify-between items-center text-sm bg-slate-800/50 px-3 py-2 rounded border border-slate-700/50">
                                                    <span className="text-emerald-400 font-medium">{t}</span>
                                                    <span className="text-slate-300 font-mono text-xs font-bold">
                                                        {reg.rentInfo?.[t] ? `₹${reg.rentInfo[t]}${reg.rentCycle === 'yearly' ? '/yr' : '/mo'}` : 'No rent info'}
                                                        {reg.vacantRooms?.includes(t) ? ' (Vacant)' : ''}
                                                    </span>
                                                </div>
                                            ))
                                        }
                                    </div>
                                </div>

                                {/* Inclusions and In-Rent Details */}
                                <div>
                                    <p className="text-slate-500 text-[10px] uppercase font-bold mb-1 tracking-wider">Facilities & Inclusions</p>
                                    <div className="flex flex-wrap gap-1 mb-2 mt-1">
                                        {reg.facilities?.map((f, i) => (
                                            <span key={`fac-${i}`} className="px-2 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded text-[10px] font-semibold">
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

                                {/* Advance Deposit Policies */}
                                {(reg.advancePayment?.type || reg.maintenanceCharge?.taken) && (
                                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-700/50 text-xs">
                                        {reg.advancePayment?.type && (
                                            <div>
                                                <p className="text-slate-500 text-[10px] uppercase font-bold mb-1 tracking-wider">Advance Payment</p>
                                                <p className="text-slate-200 font-medium bg-slate-900/50 px-2 py-1 rounded border border-slate-750">
                                                    {reg.advancePayment.type === 'Custom Amount' ? `₹${reg.advancePayment.customAmount}` : reg.advancePayment.type}
                                                </p>
                                            </div>
                                        )}
                                        {reg.maintenanceCharge?.taken && (
                                            <div>
                                                <p className="text-slate-500 text-[10px] uppercase font-bold mb-1 tracking-wider">Maintenance</p>
                                                <p className="text-slate-200 font-medium bg-slate-900/50 px-2 py-1 rounded border border-slate-750">
                                                    ₹{reg.maintenanceCharge.amount} <span className="text-[10px] text-slate-500">({reg.maintenanceCharge.frequency})</span>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Approve Footer Panel */}
                        <div className="mt-4 pt-4 border-t border-slate-700/50">
                            {reg.status === 'pending' ? (
                                <button
                                    onClick={() => handleApproveRegistration(reg)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/20 active:scale-95 transition-all text-sm"
                                >
                                    <CheckCircle size={16} /> Approve & Register (1-Click)
                                </button>
                            ) : (
                                <div className="flex items-center gap-2 text-green-400 bg-green-500/10 px-3 py-2.5 rounded-xl border border-green-500/20">
                                    <CheckCircle size={16} className="shrink-0" />
                                    <div className="text-xs">
                                        <p className="font-bold">Approved & Mess Registered</p>
                                        {reg.partnerId && <p className="text-[10px] text-slate-400 mt-0.5">Partner ID: <code className="text-green-300 bg-slate-950 px-1.5 py-0.5 rounded font-mono">{reg.partnerId}</code></p>}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {visibleRegistrations.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-500 border-2 border-dashed border-slate-700 rounded-2xl bg-slate-800/20">
                        <Building2 size={48} className="mb-4 opacity-40 text-slate-500" />
                        <p className="text-lg font-medium">No registrations match your search</p>
                    </div>
                )}
            </div>

            {/* Pagination View More Button */}
            {visibleCount < filteredRegistrations.length && (
                <div className="flex justify-center pt-4">
                    <button
                        onClick={() => setVisibleCount(prev => prev + 10)}
                        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700 transition-all hover:scale-105 active:scale-95 shadow-md flex items-center gap-2 text-sm"
                    >
                        View More ({filteredRegistrations.length - visibleCount} remaining)
                    </button>
                </div>
            )}
        </div>
    );
};

export default RegistrationsTab;
