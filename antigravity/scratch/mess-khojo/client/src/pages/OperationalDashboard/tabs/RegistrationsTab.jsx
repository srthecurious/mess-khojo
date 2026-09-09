import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Building2, Calendar, Trash2, Phone, MapPin, Monitor, CheckCircle, Navigation, User, ArrowUpDown, SlidersHorizontal, X, Plus, Sparkles } from 'lucide-react';
import { db } from '../../../firebase';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { DISTRICTS_CONFIG, getLocalitiesForCity } from '../../../context/DistrictContext';
import { useDistrict } from '../../../context/DistrictContext';

const RegistrationsTab = ({ registrations, handleApproveRegistration }) => {
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'approved'
    const [sortOrder, setSortOrder] = useState('newest'); // 'newest', 'oldest'
    const [visibleCount, setVisibleCount] = useState(10);
    const [editingRegistration, setEditingRegistration] = useState(null);
    const [editForm, setEditForm] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const { localitiesConfig } = useDistrict();

    // Reset pagination only when the user actively changes a filter or sort — NOT on data refresh
    useEffect(() => {
        setVisibleCount(10);
    }, [statusFilter, sortOrder]);

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

        const resolvedAdv = typeof reg.advancePayment === 'object' && reg.advancePayment !== null
            ? {
                type: reg.advancePayment.type || 'None',
                customAmount: reg.advancePayment.customAmount || reg.advancePaymentCustom || ''
            }
            : {
                type: reg.advancePayment || 'None',
                customAmount: reg.advancePaymentCustom || ''
            };

        setEditingRegistration(reg);
        setEditForm({
            messName: reg.messName || '',
            phoneNumber: reg.phoneNumber || '',
            district: reg.district || 'balasore',
            city: reg.city || '',
            gender: reg.gender || (Array.isArray(reg.messType) ? reg.messType[0] : reg.messType) || 'Boys',
            managedBy: reg.managedBy || '',
            totalBeds: reg.totalBeds || reg.totalRooms || '',
            totalRooms: reg.totalRooms || reg.totalBeds || '',
            messType: reg.messType || [],
            landmark: reg.landmark || '',   // kept for legacy read
            locality: reg.locality || reg.landmark || '',  // new field, fallback to landmark
            address: reg.address || '',
            gpsLatitude: reg.gpsLatitude !== undefined && reg.gpsLatitude !== null ? String(reg.gpsLatitude) : '',
            gpsLongitude: reg.gpsLongitude !== undefined && reg.gpsLongitude !== null ? String(reg.gpsLongitude) : '',
            rentCycle: reg.rentCycle || 'monthly',
            minStayDuration: reg.minStayDuration || 1,
            facilities: reg.facilities || [],
            includedInRent: reg.includedInRent || [],
            advancePayment: resolvedAdv,
            maintenanceCharge: reg.maintenanceCharge || { taken: false, amount: '', frequency: 'Per Month' },
            roomVariants: loadedRoomVariants,

            // Page 3: Food & Facilities
            foodAvailability: reg.foodAvailability || '',
            mealsPerDay: reg.mealsPerDay || '',
            foodType: reg.foodType || '',
            waterFacility: reg.waterFacility || '',
            laundryFacility: reg.laundryFacility || '',
            cleaningService: reg.cleaningService || '',
            wifi: reg.wifi ?? false,
            powerBackup: reg.powerBackup ?? false,
            cctv: reg.cctv ?? false,
            wardenWatchman: reg.wardenWatchman ?? false,
            extraSpace: reg.extraSpace || [],

            // Page 4: Charges & Policies
            securityDeposit: reg.securityDeposit || 'No Deposit',
            securityDepositCustom: reg.securityDepositCustom || '',
            electricityBill: reg.electricityBill || 'Included in Rent',
            electricityBillAmount: reg.electricityBillAmount || '',
            maintenanceFee: reg.maintenanceFee || 'Included',
            maintenanceFeeAmount: reg.maintenanceFeeAmount || '',
            cleaningCharges: reg.cleaningCharges || 'Included in Rent',
            cleaningChargesAmount: reg.cleaningChargesAmount || '',
            foodBill: reg.foodBill || 'Included in Rent',
            utensilsCharges: reg.utensilsCharges || 'Provided',
            noticePeriod: reg.noticePeriod || '1 Month',
            noticePeriodCustom: reg.noticePeriodCustom || '',
            operatingSince: reg.operatingSince || ''
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

            const resolvedNoticePeriod = editForm.noticePeriod === 'Other'
                ? (editForm.noticePeriodCustom || '').trim() || 'Other'
                : editForm.noticePeriod;

            const updatedData = {
                messName: editForm.messName,
                phoneNumber: editForm.phoneNumber,
                district: editForm.district,
                city: editForm.city,
                gender: editForm.gender,
                managedBy: editForm.managedBy,
                totalBeds: editForm.totalBeds || editForm.totalRooms || '',
                totalRooms: editForm.totalRooms || editForm.totalBeds || '',
                messType: editForm.messType,
                landmark: editForm.locality,  // write to both for backwards compat
                locality: editForm.locality,
                address: editForm.address,
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
                vacantRooms: vacantRooms,

                // Page 3: Food & Facilities
                foodAvailability: editForm.foodAvailability || '',
                mealsPerDay: editForm.mealsPerDay || '',
                foodType: editForm.foodType || '',
                waterFacility: editForm.waterFacility || '',
                laundryFacility: editForm.laundryFacility || '',
                cleaningService: editForm.cleaningService || '',
                wifi: editForm.wifi ?? false,
                powerBackup: editForm.powerBackup ?? false,
                cctv: editForm.cctv ?? false,
                wardenWatchman: editForm.wardenWatchman ?? false,
                extraSpace: editForm.extraSpace || [],

                // Page 4: Charges & Policies
                securityDeposit: editForm.securityDeposit || '',
                securityDepositCustom: editForm.securityDepositCustom || '',
                electricityBill: editForm.electricityBill || '',
                electricityBillAmount: editForm.electricityBillAmount || '',
                maintenanceFee: editForm.maintenanceFee || '',
                maintenanceFeeAmount: editForm.maintenanceFeeAmount || '',
                cleaningCharges: editForm.cleaningCharges || '',
                cleaningChargesAmount: editForm.cleaningChargesAmount || '',
                foodBill: editForm.foodBill || '',
                utensilsCharges: editForm.utensilsCharges || '',
                noticePeriod: resolvedNoticePeriod || '',
                noticePeriodCustom: editForm.noticePeriodCustom || '',
                operatingSince: editForm.operatingSince || ''
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
                                            
                                            {/* District & City Badge */}
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-slate-900 text-slate-400 border border-slate-700 flex items-center gap-1">
                                                <MapPin size={10} className="text-amber-500" />
                                                {reg.city ? `${reg.city}, ${reg.district || 'balasore'}` : (reg.district || 'balasore')}
                                            </span>

                                            {/* Gender Badge */}
                                            {(reg.gender || (reg.messType && reg.messType.length > 0)) && (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                                    For: {reg.gender || (Array.isArray(reg.messType) ? reg.messType.join(', ') : reg.messType)}
                                                </span>
                                            )}

                                            {/* Food Facility Managed By Badge */}
                                            {reg.managedBy && (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
                                                    <User size={10} />
                                                    Food: {reg.managedBy}
                                                </span>
                                            )}

                                            {/* Operating Since Badge */}
                                            {reg.operatingSince && (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                                                    <Sparkles size={10} />
                                                    Since {reg.operatingSince}
                                                </span>
                                            )}

                                            {/* Notice Period Badge */}
                                            {reg.noticePeriod && (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-sky-500/10 text-sky-400 border border-sky-500/20">
                                                    Notice: {reg.noticePeriod === 'Other' && reg.noticePeriodCustom ? reg.noticePeriodCustom : reg.noticePeriod}
                                                </span>
                                            )}

                                            {/* Total Beds Badge */}
                                            {(reg.totalBeds || reg.totalRooms) && (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                    Total Beds: {reg.totalBeds || reg.totalRooms}
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
                                                <p className="text-[10px] font-semibold text-slate-400 uppercase">Address & Landmark</p>
                                                {reg.address && (
                                                    <p className="text-slate-200 mt-0.5 text-xs font-semibold">{reg.address}</p>
                                                )}
                                                <p className="text-slate-400 mt-0.5 text-xs">
                                                    {reg.locality || reg.landmark ? `Locality: ${reg.locality || reg.landmark}` : (!reg.address ? 'Not provided' : '')}
                                                    {reg.city ? ` • City: ${reg.city}` : ''}
                                                    {reg.district ? ` • District: ${reg.district}` : ''}
                                                </p>
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
                                                                    <div key={idx} className="border-t border-slate-700/30 pt-1.5 mt-1 first:border-0 first:pt-0 first:mt-0 space-y-1">
                                                                        <div className="flex justify-between text-xs text-slate-300 font-mono">
                                                                            <span className="text-slate-400">{v.label || 'Standard'}</span>
                                                                            <span className="font-bold text-white">
                                                                                ₹{v.price}{cycleSuffix} {v.isVacant ? '(Vacant)' : '(Occupied)'}
                                                                            </span>
                                                                        </div>
                                                                        {v.mediaUrls && v.mediaUrls.length > 0 && (
                                                                            <div className="flex flex-wrap gap-1 pt-1">
                                                                                {v.mediaUrls.map((m, mIdx) => (
                                                                                    <a
                                                                                        key={mIdx}
                                                                                        href={typeof m === 'string' ? m : m.url}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        className="text-[10px] bg-slate-750 hover:bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded border border-slate-650 flex items-center gap-1 transition-colors"
                                                                                    >
                                                                                        {(typeof m === 'object' && m.type === 'video') ? '🎬 Video' : '📷 Photo'}
                                                                                    </a>
                                                                                ))}
                                                                            </div>
                                                                        )}
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

                                {/* Building Photos */}
                                {((reg.buildingPhotos && reg.buildingPhotos.length > 0) || (reg.buildingPhotoUrls && reg.buildingPhotoUrls.length > 0)) && (
                                    <div>
                                        <p className="text-slate-500 text-[10px] uppercase font-bold mb-1 tracking-wider">Building Photos</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {(reg.buildingPhotos || reg.buildingPhotoUrls || []).map((bPhoto, bpIdx) => {
                                                const url = typeof bPhoto === 'string' ? bPhoto : bPhoto?.url;
                                                return (
                                                    <a
                                                        key={bpIdx}
                                                        href={url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[10px] bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 px-2 py-1 rounded border border-purple-500/20 flex items-center gap-1.5 transition-colors font-medium"
                                                    >
                                                        🏢 Building Photo {bpIdx + 1}
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

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

                                {/* Food & Living Services Breakdown (Page 3) */}
                                {(reg.foodAvailability || reg.mealsPerDay || reg.foodType || reg.managedBy || reg.waterFacility || reg.laundryFacility || reg.cleaningService || reg.wifi || reg.powerBackup || reg.cctv || reg.wardenWatchman || (reg.extraSpace && reg.extraSpace.length > 0)) && (
                                    <div className="pt-3 border-t border-slate-700/50 space-y-2 text-xs">
                                        <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Food & Living Services</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                            {(reg.foodAvailability || reg.managedBy) && (
                                                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-750">
                                                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Food Service</span>
                                                    <span className="text-slate-200 font-semibold">{reg.foodAvailability || 'Food Available'} {reg.mealsPerDay ? `(${reg.mealsPerDay})` : ''}</span>
                                                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                        {reg.foodType && <span className="text-[10px] text-amber-400 font-medium">{reg.foodType}</span>}
                                                        {reg.managedBy && <span className="text-[10px] text-purple-400 font-medium">• Managed by: {reg.managedBy}</span>}
                                                    </div>
                                                </div>
                                            )}
                                            {(reg.waterFacility || reg.laundryFacility) && (
                                                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-750">
                                                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Water & Laundry</span>
                                                    <span className="text-slate-200 font-semibold">Water: {reg.waterFacility || 'N/A'}</span>
                                                    <span className="text-slate-400 block text-[10px] mt-0.5">Laundry: {reg.laundryFacility || 'N/A'}</span>
                                                </div>
                                            )}
                                            {reg.cleaningService && (
                                                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-750">
                                                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Cleaning</span>
                                                    <span className="text-slate-200 font-semibold">{reg.cleaningService}</span>
                                                </div>
                                            )}
                                        </div>
                                        {/* Amenity Badges */}
                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                            {reg.wifi && <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[10px] font-bold">WiFi</span>}
                                            {reg.powerBackup && <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded text-[10px] font-bold">Power Backup</span>}
                                            {reg.cctv && <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-bold">CCTV</span>}
                                            {reg.wardenWatchman && <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded text-[10px] font-bold">Warden/Watchman</span>}
                                            {reg.extraSpace?.map((sp, spIdx) => (
                                                <span key={spIdx} className="px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded text-[10px]">
                                                    {sp}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Charges & Policies Breakdown (Page 4) */}
                                {(reg.rentCycle || reg.advancePayment || reg.securityDeposit || reg.electricityBill || reg.maintenanceFee || reg.cleaningCharges || reg.foodBill || reg.utensilsCharges || reg.noticePeriod) && (
                                    <div className="pt-3 border-t border-slate-700/50 space-y-2 text-xs">
                                        <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Charges & Policies Breakdown</p>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            {reg.rentCycle && (
                                                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-750">
                                                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Rent Cycle</span>
                                                    <span className="text-slate-200 font-semibold capitalize">{reg.rentCycle}</span>
                                                </div>
                                            )}
                                            {reg.advancePayment && (
                                                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-750">
                                                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Advance Payment</span>
                                                    <span className="text-slate-200 font-semibold">
                                                        {typeof reg.advancePayment === 'object'
                                                            ? (reg.advancePayment.type === 'Custom Amount' || reg.advancePayment.type === 'Custom' ? `₹${reg.advancePayment.customAmount}` : (reg.advancePayment.type || 'None'))
                                                            : (reg.advancePayment === 'Custom' ? `₹${reg.advancePaymentCustom || ''}` : reg.advancePayment)}
                                                    </span>
                                                </div>
                                            )}
                                            {reg.securityDeposit && (
                                                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-750">
                                                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Security Deposit</span>
                                                    <span className="text-slate-200 font-semibold">{reg.securityDeposit === 'Custom' ? `₹${reg.securityDepositCustom}` : reg.securityDeposit}</span>
                                                </div>
                                            )}
                                            {reg.electricityBill && (
                                                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-750">
                                                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Electricity Bill</span>
                                                    <span className="text-slate-200 font-semibold">
                                                        {reg.electricityBill === 'Extra Fixed' && reg.electricityBillAmount ? `Extra Fixed (₹${reg.electricityBillAmount}/mo)` : reg.electricityBill}
                                                    </span>
                                                </div>
                                            )}
                                            {reg.maintenanceFee && (
                                                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-750">
                                                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Maintenance</span>
                                                    <span className="text-slate-200 font-semibold">{reg.maintenanceFee === 'Extra Charge' ? `₹${reg.maintenanceFeeAmount || ''}/mo` : reg.maintenanceFee}</span>
                                                </div>
                                            )}
                                            {reg.cleaningCharges && (
                                                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-750">
                                                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Cleaning Charges</span>
                                                    <span className="text-slate-200 font-semibold">
                                                        {reg.cleaningCharges === 'Extra Charge' && reg.cleaningChargesAmount ? `Extra Charge (₹${reg.cleaningChargesAmount}/mo)` : reg.cleaningCharges}
                                                    </span>
                                                </div>
                                            )}
                                            {reg.foodBill && (
                                                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-750">
                                                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Food Bill</span>
                                                    <span className="text-slate-200 font-semibold">{reg.foodBill}</span>
                                                </div>
                                            )}
                                            {reg.utensilsCharges && (
                                                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-750">
                                                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Utensils</span>
                                                    <span className="text-slate-200 font-semibold">{reg.utensilsCharges}</span>
                                                </div>
                                            )}
                                            {reg.noticePeriod && (
                                                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-750">
                                                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Notice Period</span>
                                                    <span className="text-slate-200 font-semibold">{reg.noticePeriod === 'Other' && reg.noticePeriodCustom ? reg.noticePeriodCustom : reg.noticePeriod}</span>
                                                </div>
                                            )}
                                        </div>
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
            {editingRegistration && editForm && createPortal(
                <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
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
                                        <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Food Facility Managed By</label>
                                        <input
                                            type="text"
                                            list="regManagedByList"
                                            value={editForm.managedBy}
                                            onChange={e => setEditForm({ ...editForm, managedBy: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                            placeholder="e.g. Owner, Students, Warden"
                                        />
                                        <datalist id="regManagedByList">
                                            <option value="Owner" />
                                            <option value="Students" />
                                            <option value="Warden" />
                                        </datalist>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-emerald-400 mb-1.5 uppercase">Total Beds / Capacity</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={editForm.totalBeds || editForm.totalRooms || ''}
                                            onChange={e => setEditForm({ ...editForm, totalBeds: e.target.value, totalRooms: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-950 border border-emerald-600 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                                            placeholder="e.g. 24"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">District</label>
                                        <select
                                            value={editForm.district}
                                            onChange={e => setEditForm({ ...editForm, district: e.target.value, city: '' })}
                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm cursor-pointer"
                                        >
                                            {Object.values(DISTRICTS_CONFIG).map(dist => (
                                                <option key={dist.id} value={dist.id} className="bg-slate-900">{dist.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">City</label>
                                        <select
                                            value={editForm.city}
                                            onChange={e => setEditForm({ ...editForm, city: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm cursor-pointer"
                                            required
                                        >
                                            <option value="" className="bg-slate-900">Select City</option>
                                            {(editForm.district ? DISTRICTS_CONFIG[editForm.district]?.cities || [] : []).map(city => (
                                                <option key={city.id} value={city.id} className="bg-slate-900">{city.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-purple-400 mb-1.5 uppercase">Locality / Area</label>
                                        <select
                                            value={editForm.locality || ''}
                                            onChange={e => setEditForm({ ...editForm, locality: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-950 border border-purple-700 rounded-xl text-white focus:ring-2 focus:ring-purple-500 outline-none text-sm cursor-pointer"
                                        >
                                            <option value="">— Select Locality —</option>
                                            {editForm.locality && !getLocalitiesForCity(editForm.city, localitiesConfig).includes(editForm.locality) && (
                                                <option value={editForm.locality}>{editForm.locality} (current)</option>
                                            )}
                                            {getLocalitiesForCity(editForm.city, localitiesConfig).map(loc => (
                                                <option key={loc} value={loc} className="bg-slate-900">{loc}</option>
                                            ))}
                                        </select>
                                        {!editForm.city && (
                                            <p className="text-[10px] text-slate-500 mt-1">Select a city above to see localities.</p>
                                        )}
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
                                    <div className="md:col-span-3">
                                        <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Full Address / Street / Near Landmark</label>
                                        <input
                                            type="text"
                                            value={editForm.address || ''}
                                            onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                            placeholder="e.g. Near Old Bus Stand, Mallikashpur, Balasore"
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
                                        {['Boys', 'Girls', 'Co-ed'].map(type => {
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
                                                <option value="No Advance" className="bg-slate-900">No Advance</option>
                                                <option value="1 Month" className="bg-slate-900">1 Month</option>
                                                <option value="1 Month Rent" className="bg-slate-900">1 Month Rent</option>
                                                <option value="2 Months" className="bg-slate-900">2 Months</option>
                                                <option value="2 Months Rent" className="bg-slate-900">2 Months Rent</option>
                                                <option value="Full Amount" className="bg-slate-900">Full Amount</option>
                                                <option value="Custom" className="bg-slate-900">Custom Amount</option>
                                                <option value="Custom Amount" className="bg-slate-900">Custom Amount</option>
                                            </select>
                                        </div>
                                        {(editForm.advancePayment.type === 'Custom Amount' || editForm.advancePayment.type === 'Custom') && (
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Custom Deposit Amount (₹)</label>
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={editForm.advancePayment.customAmount}
                                                    onChange={e => setEditForm({
                                                        ...editForm,
                                                        advancePayment: { ...editForm.advancePayment, customAmount: e.target.value.replace(/[^0-9]/g, '') }
                                                    })}
                                                    onWheel={e => e.target.blur()}
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
                                                        type="text"
                                                        inputMode="numeric"
                                                        value={editForm.maintenanceCharge.amount}
                                                        onChange={e => setEditForm({
                                                            ...editForm,
                                                            maintenanceCharge: { ...editForm.maintenanceCharge, amount: e.target.value.replace(/[^0-9]/g, '') }
                                                        })}
                                                        onWheel={e => e.target.blur()}
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
                                                                            type="text"
                                                                            inputMode="numeric"
                                                                            required
                                                                            value={v.price || ''}
                                                                            onChange={e => {
                                                                                const updated = { ...editForm.roomVariants };
                                                                                updated[roomType][vIdx].price = e.target.value.replace(/[^0-9]/g, '');
                                                                                setEditForm({ ...editForm, roomVariants: updated });
                                                                            }}
                                                                            onWheel={e => e.target.blur()}
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

                            {/* SECTION 6: FOOD & LIVING SERVICES (PAGE 3) */}
                            <div className="space-y-4 pt-4 border-t border-slate-800/80 text-left">
                                <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider border-b border-slate-800 pb-1">
                                    Food & Living Services
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Food Availability */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Food Availability</label>
                                        <select
                                            value={editForm.foodAvailability || 'Food Available'}
                                            onChange={e => setEditForm({ ...editForm, foodAvailability: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs cursor-pointer"
                                        >
                                            <option value="Food Available" className="bg-slate-900">Food Available</option>
                                            <option value="Self Cook" className="bg-slate-900">Self Cook Only</option>
                                        </select>
                                    </div>

                                    {/* Meals Per Day */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Meals Per Day</label>
                                        <select
                                            value={editForm.mealsPerDay || '3 Meals'}
                                            onChange={e => setEditForm({ ...editForm, mealsPerDay: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs cursor-pointer"
                                        >
                                            <option value="1 Meal" className="bg-slate-900">1 Meal</option>
                                            <option value="2 Meals" className="bg-slate-900">2 Meals</option>
                                            <option value="3 Meals" className="bg-slate-900">3 Meals</option>
                                            <option value="4 Meals" className="bg-slate-900">4 Meals</option>
                                        </select>
                                    </div>

                                    {/* Food Type */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Food Type</label>
                                        <select
                                            value={editForm.foodType || 'Veg + Non-Veg'}
                                            onChange={e => setEditForm({ ...editForm, foodType: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs cursor-pointer"
                                        >
                                            <option value="Pure Veg" className="bg-slate-900">Pure Veg</option>
                                            <option value="Veg Only" className="bg-slate-900">Veg Only</option>
                                            <option value="Non-Veg" className="bg-slate-900">Non-Veg</option>
                                            <option value="Veg + Non-Veg" className="bg-slate-900">Veg + Non-Veg</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Water Facility */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Water Facility</label>
                                        <select
                                            value={editForm.waterFacility || 'Both'}
                                            onChange={e => setEditForm({ ...editForm, waterFacility: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs cursor-pointer"
                                        >
                                            <option value="Water Filter" className="bg-slate-900">Water Filter</option>
                                            <option value="Tubewell" className="bg-slate-900">Tubewell</option>
                                            <option value="Borewell" className="bg-slate-900">Borewell</option>
                                            <option value="Municipal" className="bg-slate-900">Municipal Water</option>
                                            <option value="Both" className="bg-slate-900">Both</option>
                                            <option value="None" className="bg-slate-900">None</option>
                                        </select>
                                    </div>

                                    {/* Laundry Facility */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Laundry Facility</label>
                                        <select
                                            value={editForm.laundryFacility || 'Washing Machine'}
                                            onChange={e => setEditForm({ ...editForm, laundryFacility: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs cursor-pointer"
                                        >
                                            <option value="Washing Machine" className="bg-slate-900">Washing Machine</option>
                                            <option value="Laundry" className="bg-slate-900">Laundry Service</option>
                                            <option value="Manual" className="bg-slate-900">Manual Wash Only</option>
                                            <option value="Both" className="bg-slate-900">Both Available</option>
                                            <option value="None" className="bg-slate-900">None</option>
                                        </select>
                                    </div>

                                    {/* Cleaning Service */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Cleaning Service</label>
                                        <select
                                            value={editForm.cleaningService || 'Both'}
                                            onChange={e => setEditForm({ ...editForm, cleaningService: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs cursor-pointer"
                                        >
                                            <option value="Room Cleaning" className="bg-slate-900">Room Cleaning</option>
                                            <option value="Washroom Cleaning" className="bg-slate-900">Washroom Cleaning</option>
                                            <option value="Both" className="bg-slate-900">Both</option>
                                            <option value="Provided" className="bg-slate-900">Provided</option>
                                            <option value="None" className="bg-slate-900">None</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Essential Amenities Toggles */}
                                <div className="space-y-2 pt-2">
                                    <label className="block text-xs font-bold text-slate-400 uppercase">Essential Amenities</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {[
                                            { key: 'wifi', label: 'Wi-Fi' },
                                            { key: 'powerBackup', label: 'Power Backup' },
                                            { key: 'cctv', label: 'CCTV' },
                                            { key: 'wardenWatchman', label: 'Warden/Watchman' },
                                        ].map(({ key, label }) => (
                                            <label key={key} className="flex items-center gap-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800 cursor-pointer text-xs font-bold text-slate-300 hover:border-slate-700 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={!!editForm[key]}
                                                    onChange={e => setEditForm({ ...editForm, [key]: e.target.checked })}
                                                    className="w-4 h-4 accent-blue-500 rounded border-slate-700 cursor-pointer"
                                                />
                                                {label}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Extra Space Options */}
                                <div className="space-y-2 pt-2">
                                    <label className="block text-xs font-bold text-slate-400 uppercase">Extra Spaces Available</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['Parking', 'Access to Terrace', 'Dining Hall', 'Library', 'Terrace', 'Garden', 'Study Room', 'Recreation Area'].map(space => {
                                            const current = editForm.extraSpace || [];
                                            const isSelected = current.includes(space);
                                            return (
                                                <button
                                                    type="button"
                                                    key={space}
                                                    onClick={() => {
                                                        if (isSelected) {
                                                            setEditForm({ ...editForm, extraSpace: current.filter(s => s !== space) });
                                                        } else {
                                                            setEditForm({ ...editForm, extraSpace: [...current, space] });
                                                        }
                                                    }}
                                                    className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                                                        isSelected
                                                            ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                                            : 'bg-slate-950 text-slate-500 border-slate-800 hover:border-slate-700'
                                                    }`}
                                                >
                                                    {space}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 7: CHARGES & POLICIES (PAGE 4) */}
                            <div className="space-y-4 pt-4 border-t border-slate-800/80 text-left">
                                <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider border-b border-slate-800 pb-1">
                                    Charges & Policies Breakdown
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {/* Security Deposit */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Security Deposit</label>
                                        <select
                                            value={editForm.securityDeposit || 'No Deposit'}
                                            onChange={e => setEditForm({ ...editForm, securityDeposit: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs cursor-pointer"
                                        >
                                            <option value="No Deposit" className="bg-slate-900">No Deposit</option>
                                            <option value="1 Month" className="bg-slate-900">1 Month</option>
                                            <option value="2 Months" className="bg-slate-900">2 Months</option>
                                            <option value="3 Months" className="bg-slate-900">3 Months</option>
                                            <option value="Custom" className="bg-slate-900">Custom Amount</option>
                                        </select>
                                        {editForm.securityDeposit === 'Custom' && (
                                            <input
                                                type="text"
                                                placeholder="Deposit Amount (₹)"
                                                value={editForm.securityDepositCustom || ''}
                                                onChange={e => setEditForm({ ...editForm, securityDepositCustom: e.target.value })}
                                                className="w-full mt-2 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                                            />
                                        )}
                                    </div>

                                    {/* Electricity Bill */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Electricity Bill</label>
                                        <select
                                            value={editForm.electricityBill || 'Included in Rent'}
                                            onChange={e => setEditForm({ ...editForm, electricityBill: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs cursor-pointer"
                                        >
                                            <option value="Included in Rent" className="bg-slate-900">Included in Rent</option>
                                            <option value="As per Meter" className="bg-slate-900">As per Meter</option>
                                            <option value="Extra Fixed" className="bg-slate-900">Extra Fixed Charge</option>
                                        </select>
                                        {editForm.electricityBill === 'Extra Fixed' && (
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                placeholder="Fixed Bill per Month (₹)"
                                                value={editForm.electricityBillAmount || ''}
                                                onChange={e => setEditForm({ ...editForm, electricityBillAmount: e.target.value.replace(/[^0-9]/g, '') })}
                                                onWheel={e => e.target.blur()}
                                                className="w-full mt-2 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                                            />
                                        )}
                                    </div>

                                    {/* Maintenance Fee */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Maintenance Fee</label>
                                        <select
                                            value={editForm.maintenanceFee || 'Included'}
                                            onChange={e => {
                                                const val = e.target.value;
                                                setEditForm({
                                                    ...editForm,
                                                    maintenanceFee: val,
                                                    maintenanceCharge: {
                                                        ...editForm.maintenanceCharge,
                                                        taken: val === 'Extra Charge'
                                                    }
                                                });
                                            }}
                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs cursor-pointer"
                                        >
                                            <option value="Included" className="bg-slate-900">Included</option>
                                            <option value="Extra Charge" className="bg-slate-900">Extra Charge</option>
                                        </select>
                                        {editForm.maintenanceFee === 'Extra Charge' && (
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                placeholder="Fee per Month (₹)"
                                                value={editForm.maintenanceFeeAmount || ''}
                                                onChange={e => {
                                                    const amt = e.target.value.replace(/[^0-9]/g, '');
                                                    setEditForm({
                                                        ...editForm,
                                                        maintenanceFeeAmount: amt,
                                                        maintenanceCharge: {
                                                            ...editForm.maintenanceCharge,
                                                            amount: amt
                                                        }
                                                    });
                                                }}
                                                onWheel={e => e.target.blur()}
                                                className="w-full mt-2 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                                            />
                                        )}
                                    </div>

                                    {/* Cleaning Charges */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Cleaning Charges</label>
                                        <select
                                            value={editForm.cleaningCharges || 'Included in Rent'}
                                            onChange={e => setEditForm({ ...editForm, cleaningCharges: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs cursor-pointer"
                                        >
                                            <option value="Included in Rent" className="bg-slate-900">Included in Rent</option>
                                            <option value="Extra Charge" className="bg-slate-900">Extra Charge</option>
                                            <option value="None" className="bg-slate-900">None</option>
                                        </select>
                                        {editForm.cleaningCharges === 'Extra Charge' && (
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                placeholder="Fixed Cleaning Fee per Month (₹)"
                                                value={editForm.cleaningChargesAmount || ''}
                                                onChange={e => setEditForm({ ...editForm, cleaningChargesAmount: e.target.value.replace(/[^0-9]/g, '') })}
                                                onWheel={e => e.target.blur()}
                                                className="w-full mt-2 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                                            />
                                        )}
                                    </div>

                                    {/* Food Bill */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Food Bill</label>
                                        <select
                                            value={editForm.foodBill || 'Included in Rent'}
                                            onChange={e => setEditForm({ ...editForm, foodBill: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs cursor-pointer"
                                        >
                                            <option value="Included in Rent" className="bg-slate-900">Included in Rent</option>
                                            <option value="Separate" className="bg-slate-900">Separate</option>
                                            <option value="Self Cook" className="bg-slate-900">Self Cook</option>
                                        </select>
                                    </div>

                                    {/* Utensils Charges */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Utensils Charges</label>
                                        <select
                                            value={editForm.utensilsCharges || 'Provided'}
                                            onChange={e => setEditForm({ ...editForm, utensilsCharges: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs cursor-pointer"
                                        >
                                            <option value="Provided" className="bg-slate-900">Provided</option>
                                            <option value="Chargeable" className="bg-slate-900">Chargeable</option>
                                            <option value="Bring Own" className="bg-slate-900">Bring Own</option>
                                        </select>
                                    </div>

                                    {/* Notice Period */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Notice Period</label>
                                        <select
                                            value={editForm.noticePeriod || '1 Month'}
                                            onChange={e => setEditForm({ ...editForm, noticePeriod: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs cursor-pointer"
                                        >
                                            <option value="No Notice" className="bg-slate-900">No Notice</option>
                                            <option value="15 Days" className="bg-slate-900">15 Days</option>
                                            <option value="1 Month" className="bg-slate-900">1 Month</option>
                                            <option value="2 Months" className="bg-slate-900">2 Months</option>
                                            <option value="3 Months" className="bg-slate-900">3 Months</option>
                                            <option value="Other" className="bg-slate-900">Other</option>
                                        </select>
                                        {editForm.noticePeriod === 'Other' && (
                                            <input
                                                type="text"
                                                placeholder="e.g. 45 Days"
                                                value={editForm.noticePeriodCustom || ''}
                                                onChange={e => setEditForm({ ...editForm, noticePeriodCustom: e.target.value })}
                                                className="w-full mt-2 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                                            />
                                        )}
                                    </div>

                                    {/* Operating Since */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Operating Since</label>
                                        <select
                                            value={editForm.operatingSince || ''}
                                            onChange={e => setEditForm({ ...editForm, operatingSince: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs cursor-pointer"
                                        >
                                            <option value="" className="bg-slate-900">Select Year</option>
                                            {Array.from({ length: 27 }, (_, i) => 2026 - i).map(year => (
                                                <option key={year} value={String(year)} className="bg-slate-900">{year}</option>
                                            ))}
                                            <option value="Before 2000" className="bg-slate-900">Before 2000</option>
                                        </select>
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
                                type="button"
                                onClick={(e) => { e.preventDefault(); handleSaveEdits(e); }}
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
                </div>,
                document.body
            )}
        </div>
    );
};

export default RegistrationsTab;
