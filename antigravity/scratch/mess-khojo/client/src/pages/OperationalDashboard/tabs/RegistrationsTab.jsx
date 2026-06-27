import React, { useState } from 'react';
import { Building2, Calendar, Trash2, Phone, MapPin, Monitor, CheckCircle, Navigation, User, ArrowUpDown, SlidersHorizontal, X, Plus } from 'lucide-react';
import { db } from '../../../firebase';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { DISTRICTS_CONFIG } from '../../../context/DistrictContext';

const RegistrationsTab = ({ registrations, handleApproveRegistration }) => {
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'approved'
    const [sortOrder, setSortOrder] = useState('newest'); // 'newest', 'oldest'
    const [visibleCount, setVisibleCount] = useState(10);
    const [editingRegistration, setEditingRegistration] = useState(null);
    const [editForm, setEditForm] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

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

    // Initialize edit form and open modal
    const handleEditRegistration = (reg) => {
        const loadedRoomVariants = {};
        if (reg.roomVariants && Object.keys(reg.roomVariants).length > 0) {
            Object.entries(reg.roomVariants).forEach(([type, list]) => {
                loadedRoomVariants[type] = (list || []).map(v => ({
                    label: v.label || '',
                    price: v.price !== undefined ? Number(v.price) : 0,
                    isVacant: v.isVacant !== undefined ? !!v.isVacant : false
                }));
            });
        } else if (reg.roomTypes && reg.roomTypes.length > 0) {
            reg.roomTypes.forEach(type => {
                const isVacant = reg.vacantRooms?.includes(type) || false;
                const price = reg.rentInfo?.[type] !== undefined ? Number(reg.rentInfo[type]) : 0;
                loadedRoomVariants[type] = [{
                    label: '',
                    price: price,
                    isVacant: isVacant
                }];
            });
        }

        setEditingRegistration(reg);
        setEditForm({
            messName: reg.messName || '',
            phoneNumber: reg.phoneNumber || '',
            district: reg.district || 'balasore',
            gender: reg.gender || 'Boys',
            managedBy: reg.managedBy || '',
            messType: reg.messType || [],
            landmark: reg.landmark || '',
            gpsLatitude: reg.gpsLatitude !== undefined && reg.gpsLatitude !== null ? String(reg.gpsLatitude) : '',
            gpsLongitude: reg.gpsLongitude !== undefined && reg.gpsLongitude !== null ? String(reg.gpsLongitude) : '',
            rentCycle: reg.rentCycle || 'monthly',
            minStayDuration: reg.minStayDuration || 1,
            facilities: reg.facilities || [],
            includedInRent: reg.includedInRent || [],
            advancePayment: reg.advancePayment || { type: 'None', customAmount: '' },
            maintenanceCharge: reg.maintenanceCharge || { taken: false, amount: '', frequency: 'Per Month' },
            roomVariants: loadedRoomVariants
        });
    };

    // Save changes to Firestore
    const handleSaveEdits = async (e) => {
        e.preventDefault();
        if (!editForm.messName.trim() || !editForm.phoneNumber.trim()) {
            alert("Mess Name and Phone Number are required.");
            return;
        }

        setIsSaving(true);
        try {
            // Clean up and type cast room variants
            const cleanedRoomVariants = {};
            Object.entries(editForm.roomVariants).forEach(([type, list]) => {
                cleanedRoomVariants[type] = (list || []).map(v => ({
                    label: v.label || '',
                    price: v.price !== '' && !isNaN(Number(v.price)) ? Number(v.price) : 0,
                    isVacant: !!v.isVacant
                }));
            });

            const roomTypes = Object.keys(cleanedRoomVariants).filter(type => cleanedRoomVariants[type].length > 0);
            
            // Build legacy fallbacks for safety
            const rentInfo = {};
            const vacantRooms = [];
            roomTypes.forEach(type => {
                const firstVar = cleanedRoomVariants[type][0];
                if (firstVar) {
                    rentInfo[type] = firstVar.price;
                    if (firstVar.isVacant) {
                        vacantRooms.push(type);
                    }
                }
            });

            // Parse GPS coordinates safely
            const rawLat = String(editForm.gpsLatitude).trim();
            const rawLng = String(editForm.gpsLongitude).trim();
            const parsedLat = rawLat !== '' ? Number(rawLat) : null;
            const parsedLng = rawLng !== '' ? Number(rawLng) : null;
            const gpsLatitude = parsedLat !== null && !isNaN(parsedLat) ? parsedLat : null;
            const gpsLongitude = parsedLng !== null && !isNaN(parsedLng) ? parsedLng : null;

            // Parse stay duration safely
            const rawStay = String(editForm.minStayDuration).trim();
            const parsedStay = rawStay !== '' ? Number(rawStay) : 1;
            const minStayDuration = !isNaN(parsedStay) ? parsedStay : 1;

            // Parse Advance Payment policy safely
            const advType = editForm.advancePayment.type;
            const rawAdvAmt = String(editForm.advancePayment.customAmount).trim();
            const parsedAdvAmt = rawAdvAmt !== '' ? Number(rawAdvAmt) : '';
            const customAmount = advType === 'Custom Amount' && !isNaN(parsedAdvAmt) ? parsedAdvAmt : '';

            // Parse Maintenance Charge safely
            const maintTaken = !!editForm.maintenanceCharge.taken;
            const rawMaintAmt = String(editForm.maintenanceCharge.amount).trim();
            const parsedMaintAmt = rawMaintAmt !== '' ? Number(rawMaintAmt) : '';
            const maintAmount = maintTaken && !isNaN(parsedMaintAmt) ? parsedMaintAmt : '';

            const updatedData = {
                messName: editForm.messName,
                phoneNumber: editForm.phoneNumber,
                district: editForm.district,
                gender: editForm.gender,
                managedBy: editForm.managedBy,
                messType: editForm.messType,
                landmark: editForm.landmark,
                gpsLatitude: gpsLatitude,
                gpsLongitude: gpsLongitude,
                rentCycle: editForm.rentCycle,
                minStayDuration: minStayDuration,
                facilities: editForm.facilities,
                includedInRent: editForm.includedInRent,
                advancePayment: {
                    type: advType,
                    customAmount: customAmount
                },
                maintenanceCharge: {
                    taken: maintTaken,
                    amount: maintAmount,
                    frequency: maintTaken ? editForm.maintenanceCharge.frequency : 'Per Month'
                },
                roomVariants: cleanedRoomVariants,
                roomTypes: roomTypes,
                rentInfo: rentInfo,
                vacantRooms: vacantRooms
            };

            await updateDoc(doc(db, "mess_registrations", editingRegistration.id), updatedData);
            setEditingRegistration(null);
            setEditForm(null);
        } catch (error) {
            console.error("Error saving registration edits:", error);
            alert("Failed to save changes.");
        } finally {
            setIsSaving(false);
        }
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
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <button
                                        onClick={() => handleEditRegistration(reg)}
                                        className="sm:w-1/3 flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-650 text-white font-bold rounded-xl active:scale-95 transition-all text-sm border border-slate-600"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleApproveRegistration(reg)}
                                        className="sm:w-2/3 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/20 active:scale-95 transition-all text-sm"
                                    >
                                        <CheckCircle size={16} /> Approve (1-Click)
                                    </button>
                                </div>
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

            {/* EDIT REGISTRATION MODAL */}
            {editingRegistration && editForm && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/20 sticky top-0 backdrop-blur-md z-10">
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Building2 className="text-blue-500" />
                                    Edit Registration Request
                                </h3>
                                <p className="text-slate-450 text-xs mt-1">Modify details for: <span className="text-white font-semibold">{editingRegistration.messName}</span></p>
                            </div>
                            <button
                                onClick={() => {
                                    setEditingRegistration(null);
                                    setEditForm(null);
                                }}
                                className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Form Content */}
                        <form onSubmit={handleSaveEdits} className="p-6 space-y-6 flex-grow">
                            {/* SECTION 1: PROFILE INFO */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider border-b border-slate-800 pb-1">Mess Profile Info</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Mess Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={editForm.messName}
                                            onChange={e => setEditForm({ ...editForm, messName: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Contact Number</label>
                                        <input
                                            type="text"
                                            required
                                            value={editForm.phoneNumber}
                                            onChange={e => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Managed By</label>
                                        <input
                                            type="text"
                                            value={editForm.managedBy}
                                            onChange={e => setEditForm({ ...editForm, managedBy: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                            placeholder="e.g. Owner, Manager, Warden"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">District</label>
                                        <select
                                            value={editForm.district}
                                            onChange={e => setEditForm({ ...editForm, district: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm cursor-pointer"
                                        >
                                            {Object.values(DISTRICTS_CONFIG).map(dist => (
                                                <option key={dist.id} value={dist.id} className="bg-slate-900">{dist.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Gender Preference</label>
                                        <select
                                            value={editForm.gender}
                                            onChange={e => setEditForm({ ...editForm, gender: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm cursor-pointer"
                                        >
                                            <option value="Boys" className="bg-slate-900">Boys</option>
                                            <option value="Girls" className="bg-slate-900">Girls</option>
                                            <option value="Any" className="bg-slate-900">Any / Coed</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Landmark / Address</label>
                                        <input
                                            type="text"
                                            value={editForm.landmark}
                                            onChange={e => setEditForm({ ...editForm, landmark: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 2: SETTINGS & LOCATION */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Operational Settings */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider border-b border-slate-800 pb-1">Operational Settings</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Rent Cycle</label>
                                            <select
                                                value={editForm.rentCycle}
                                                onChange={e => setEditForm({ ...editForm, rentCycle: e.target.value })}
                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm cursor-pointer"
                                            >
                                                <option value="monthly" className="bg-slate-900">Monthly</option>
                                                <option value="yearly" className="bg-slate-900">Yearly</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Min Stay (Months)</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={editForm.minStayDuration}
                                                onChange={e => setEditForm({ ...editForm, minStayDuration: e.target.value })}
                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* GPS Coordinates */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider border-b border-slate-800 pb-1">GPS Location</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Latitude</label>
                                            <input
                                                type="number"
                                                step="any"
                                                placeholder="e.g. 21.4912"
                                                value={editForm.gpsLatitude}
                                                onChange={e => setEditForm({ ...editForm, gpsLatitude: e.target.value })}
                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Longitude</label>
                                            <input
                                                type="number"
                                                step="any"
                                                placeholder="e.g. 86.9312"
                                                value={editForm.gpsLongitude}
                                                onChange={e => setEditForm({ ...editForm, gpsLongitude: e.target.value })}
                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 3: CATEGORY & FACILITIES */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Categories */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-slate-450 uppercase tracking-wider mb-1">Target Categories</h4>
                                    <div className="flex flex-wrap gap-2 text-left">
                                        {['Boys', 'Girls'].map(type => {
                                            const isSelected = editForm.messType.includes(type);
                                            return (
                                                <button
                                                    type="button"
                                                    key={type}
                                                    onClick={() => {
                                                        const current = [...editForm.messType];
                                                        if (current.includes(type)) {
                                                            setEditForm({ ...editForm, messType: current.filter(t => t !== type) });
                                                        } else {
                                                            setEditForm({ ...editForm, messType: [...current, type] });
                                                        }
                                                    }}
                                                    className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${isSelected ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-slate-950 text-slate-500 border-slate-800'}`}
                                                >
                                                    {type}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Facilities */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-slate-455 uppercase tracking-wider mb-1">Facilities</h4>
                                    <div className="flex flex-wrap gap-2 text-left">
                                        {['Wifi', 'AC', 'Food Facility', 'InverterPower', 'CCTV'].map(facility => {
                                            const isSelected = editForm.facilities.includes(facility);
                                            return (
                                                <button
                                                    type="button"
                                                    key={facility}
                                                    onClick={() => {
                                                        const current = [...editForm.facilities];
                                                        if (current.includes(facility)) {
                                                            setEditForm({ ...editForm, facilities: current.filter(f => f !== facility) });
                                                        } else {
                                                            setEditForm({ ...editForm, facilities: [...current, facility] });
                                                        }
                                                    }}
                                                    className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${isSelected ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : 'bg-slate-950 text-slate-500 border-slate-800'}`}
                                                >
                                                    {facility === 'InverterPower' ? 'Inverter' : facility === 'Food Facility' ? 'Food' : facility}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Inclusions */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-slate-450 uppercase tracking-wider mb-1">Included In Rent</h4>
                                    <div className="flex flex-wrap gap-2 text-left">
                                        {['Food Charges', 'Electricity Bills', 'Cleaning Charges'].map(inc => {
                                            const isSelected = editForm.includedInRent.includes(inc);
                                            return (
                                                <button
                                                    type="button"
                                                    key={inc}
                                                    onClick={() => {
                                                        const current = [...editForm.includedInRent];
                                                        if (current.includes(inc)) {
                                                            setEditForm({ ...editForm, includedInRent: current.filter(i => i !== inc) });
                                                        } else {
                                                            setEditForm({ ...editForm, includedInRent: [...current, inc] });
                                                        }
                                                    }}
                                                    className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${isSelected ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-slate-950 text-slate-500 border-slate-800'}`}
                                                >
                                                    {inc}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 4: ADVANCE PAYMENT & MAINTENANCE POLICIES */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-800/80 text-left">
                                {/* Advance Payment */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-slate-450 uppercase tracking-wider mb-1">Advance Payment Required</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Type</label>
                                            <select
                                                value={editForm.advancePayment.type}
                                                onChange={e => setEditForm({
                                                    ...editForm,
                                                    advancePayment: { ...editForm.advancePayment, type: e.target.value }
                                                })}
                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs cursor-pointer"
                                            >
                                                <option value="None" className="bg-slate-900">None</option>
                                                <option value="1 Month Rent" className="bg-slate-900">1 Month Rent</option>
                                                <option value="2 Months Rent" className="bg-slate-900">2 Months Rent</option>
                                                <option value="Custom Amount" className="bg-slate-900">Custom Amount</option>
                                            </select>
                                        </div>
                                        {editForm.advancePayment.type === 'Custom Amount' && (
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Custom Deposit Amount (₹)</label>
                                                <input
                                                    type="number"
                                                    value={editForm.advancePayment.customAmount}
                                                    onChange={e => setEditForm({
                                                        ...editForm,
                                                        advancePayment: { ...editForm.advancePayment, customAmount: e.target.value }
                                                    })}
                                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Maintenance Charge */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-slate-450 uppercase tracking-wider mb-1">Maintenance Charge Policies</h4>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="flex flex-col justify-end pb-2.5">
                                            <label className="flex items-center gap-2 text-xs font-bold text-slate-450 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={editForm.maintenanceCharge.taken}
                                                    onChange={e => setEditForm({
                                                        ...editForm,
                                                        maintenanceCharge: { ...editForm.maintenanceCharge, taken: e.target.checked }
                                                    })}
                                                    className="w-4 h-4 accent-blue-500 rounded border-slate-700 cursor-pointer"
                                                />
                                                Charge Taken
                                            </label>
                                        </div>
                                        {editForm.maintenanceCharge.taken && (
                                            <>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Amount (₹)</label>
                                                    <input
                                                        type="number"
                                                        value={editForm.maintenanceCharge.amount}
                                                        onChange={e => setEditForm({
                                                            ...editForm,
                                                            maintenanceCharge: { ...editForm.maintenanceCharge, amount: e.target.value }
                                                        })}
                                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Frequency</label>
                                                    <select
                                                        value={editForm.maintenanceCharge.frequency}
                                                        onChange={e => setEditForm({
                                                            ...editForm,
                                                            maintenanceCharge: { ...editForm.maintenanceCharge, frequency: e.target.value }
                                                        })}
                                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs cursor-pointer"
                                                    >
                                                        <option value="Per Month" className="bg-slate-900">Per Month</option>
                                                        <option value="Per Year" className="bg-slate-900">Per Year</option>
                                                    </select>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 5: ROOM VARIANTS EDITOR */}
                            <div className="space-y-4 pt-2 border-t border-slate-800/80">
                                {console.log("editForm.roomVariants:", editForm?.roomVariants)}
                                <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider border-b border-slate-800 pb-1 text-left">Room Configurations & Pricing</h4>
                                
                                <div className="space-y-4">
                                    {/* Active Room Types checkboxes */}
                                    <div className="flex flex-wrap items-center gap-4 bg-slate-950/30 p-3 rounded-xl border border-slate-800 text-left">
                                        <span className="text-xs font-bold text-slate-555 uppercase tracking-wide">Active Types:</span>
                                        {['1 Seater', '2 Seater', '3 Seater', '4 Seater', '5 Seater', '6 Seater', '7 Seater'].map(type => {
                                            const isActive = editForm.roomVariants[type] !== undefined;
                                            return (
                                                <label key={type} className="flex items-center gap-1.5 text-xs font-bold text-slate-350 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={isActive}
                                                        onChange={e => {
                                                            const updated = { ...editForm.roomVariants };
                                                            if (e.target.checked) {
                                                                updated[type] = [{ label: '', price: 0, isVacant: true }];
                                                            } else {
                                                                delete updated[type];
                                                            }
                                                            setEditForm({ ...editForm, roomVariants: updated });
                                                        }}
                                                        className="w-4 h-4 accent-blue-500 rounded border-slate-700 cursor-pointer"
                                                    />
                                                    {type}
                                                </label>
                                            );
                                        })}
                                    </div>

                                    {/* Edit variants for each active room type */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {Object.entries(editForm.roomVariants).map(([roomType, variants]) => (
                                            <div key={roomType} className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 space-y-3 text-left">
                                                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                                                    <span className="text-xs font-black uppercase text-emerald-400 tracking-wider">
                                                        {roomType} Room
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const updated = { ...editForm.roomVariants };
                                                            updated[roomType] = [...(updated[roomType] || []), { label: '', price: 0, isVacant: true }];
                                                            setEditForm({ ...editForm, roomVariants: updated });
                                                        }}
                                                        className="flex items-center gap-1 text-[10px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded font-bold transition-all"
                                                    >
                                                        <Plus size={10} /> Add Variant
                                                    </button>
                                                </div>

                                                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                                                    {variants.length === 0 ? (
                                                        <p className="text-xs text-slate-500 italic py-2">No variants created. Add one above.</p>
                                                    ) : (
                                                        variants.map((v, vIdx) => (
                                                            <div key={vIdx} className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2 relative group/var">
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <div>
                                                                        <label className="block text-[9px] font-bold text-slate-500 mb-0.5 uppercase">Label / Description</label>
                                                                        <input
                                                                            type="text"
                                                                            placeholder="e.g. AC, Non-AC, Deluxe"
                                                                            value={v.label}
                                                                            onChange={e => {
                                                                                const updated = { ...editForm.roomVariants };
                                                                                updated[roomType][vIdx].label = e.target.value;
                                                                                setEditForm({ ...editForm, roomVariants: updated });
                                                                            }}
                                                                            className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white focus:border-blue-500 outline-none"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[9px] font-bold text-slate-500 mb-0.5 uppercase">Price / Rent (₹)</label>
                                                                        <input
                                                                            type="number"
                                                                            required
                                                                            value={v.price || ''}
                                                                            onChange={e => {
                                                                                const updated = { ...editForm.roomVariants };
                                                                                updated[roomType][vIdx].price = e.target.value;
                                                                                setEditForm({ ...editForm, roomVariants: updated });
                                                                            }}
                                                                            className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white focus:border-blue-500 outline-none"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                
                                                                <div className="flex justify-between items-center">
                                                                    <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 cursor-pointer">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={v.isVacant}
                                                                            onChange={e => {
                                                                                const updated = { ...editForm.roomVariants };
                                                                                updated[roomType][vIdx].isVacant = e.target.checked;
                                                                                setEditForm({ ...editForm, roomVariants: updated });
                                                                            }}
                                                                            className="w-3.5 h-3.5 accent-blue-500 rounded border-slate-700 cursor-pointer"
                                                                        />
                                                                        Vacant / Available
                                                                    </label>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const updated = { ...editForm.roomVariants };
                                                                            updated[roomType] = updated[roomType].filter((_, idx) => idx !== vIdx);
                                                                            setEditForm({ ...editForm, roomVariants: updated });
                                                                        }}
                                                                        className="text-[10px] text-red-500 hover:text-red-450 font-bold"
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </form>

                        {/* Modal Footer Controls */}
                        <div className="p-6 border-t border-slate-800 bg-slate-950/20 flex items-center justify-end gap-3 sticky bottom-0 backdrop-blur-md">
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingRegistration(null);
                                    setEditForm(null);
                                }}
                                disabled={isSaving}
                                className="px-4 py-2 border border-slate-750 hover:bg-slate-800 text-slate-350 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEdits}
                                disabled={isSaving}
                                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-blue-950/20"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Saving Changes...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RegistrationsTab;
