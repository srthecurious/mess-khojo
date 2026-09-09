import React from 'react';
import { Pencil, Trash2, X, Plus, MapPin, Map } from 'lucide-react';
import MultiSelectDropdown from '../../../components/MultiSelectDropdown';

const MessProfileTab = ({
    messProfile,
    messForm,
    setMessForm,
    setPosterFile,
    setGalleryFiles,
    isEditingMess,

    uploading,
    handleMessSubmit,
    handleEditMessClick,
    handleCancelEditMess,
    removeGalleryImage,
    geocoding,
    handleGeocode,
    setShowMapPicker,
    handleLocationUrlChange
}) => {
    return (
        <>
            {/* Modal/Pop-out overlay for Edit/Create Mess Profile */}
            {(isEditingMess || !messProfile) && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl border-t-4 border-brand-primary relative max-h-[90vh] flex flex-col my-8">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white rounded-t-2xl z-10">
                            <h2 className="text-2xl font-bold text-brand-text-dark">
                                {isEditingMess ? 'Edit Mess Profile' : 'Create Mess Profile'}
                            </h2>
                            {messProfile && (
                                <button
                                    type="button"
                                    onClick={handleCancelEditMess}
                                    className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            )}
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex-grow">
                            <form id="mess-profile-form" onSubmit={handleMessSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-1.5">Mess Name</label>
                        <input
                            type="text"
                            className="w-full p-2.5 border border-gray-300 rounded-lg text-gray-900 font-semibold bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                            value={messForm.name}
                            onChange={(e) => setMessForm({ ...messForm, name: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-1.5">District</label>
                        <div className="w-full p-2.5 border border-dashed border-gray-300 rounded-lg bg-gray-50 text-gray-800 font-semibold capitalize flex items-center gap-2">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-50"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            {messForm.district || 'balasore'}
                            <span className="ml-auto text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-bold">Managed by Operator</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-1.5">Mess Type</label>
                        <select
                            className="w-full p-2.5 border border-gray-300 rounded-lg text-gray-900 font-semibold bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                            value={messForm.messType}
                            onChange={(e) => setMessForm({ ...messForm, messType: e.target.value })}
                        >
                            <option value="Boys">Boys Mess</option>
                            <option value="Girls">Girls Mess</option>
                            <option value="Co-ed">Co-ed Mess</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-1.5">Address</label>
                        <input
                            type="text"
                            className="w-full p-2.5 border border-gray-300 rounded-lg text-gray-900 font-semibold bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                            value={messForm.address}
                            onChange={(e) => setMessForm({ ...messForm, address: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-1.5">Description / About Mess</label>
                        <textarea
                            className="w-full p-2.5 border border-gray-300 rounded-lg text-gray-900 font-semibold bg-white h-32 resize-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all placeholder:text-gray-400 placeholder:font-normal"
                            value={messForm.description || ''}
                            onChange={(e) => setMessForm({ ...messForm, description: e.target.value })}
                            placeholder="Enter a detailed description about your mess..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-1.5">Contact Number</label>
                        <input
                            type="text"
                            className="w-full p-2.5 border border-gray-300 rounded-lg text-gray-900 font-semibold bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                            value={messForm.contact}
                            onChange={(e) => setMessForm({ ...messForm, contact: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-1.5">Google Maps Location URL</label>
                        <input
                            type="url"
                            className="w-full p-2.5 border border-gray-300 rounded-lg text-gray-900 font-semibold bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all placeholder:text-gray-400 placeholder:font-normal"
                            value={messForm.locationUrl}
                            onChange={(e) => handleLocationUrlChange(e.target.value)}
                            placeholder="Paste Google Maps URL (coordinates will auto-extract)"
                        />
                        <div className="flex flex-wrap items-center gap-3 mt-3">
                            <button
                                type="button"
                                onClick={handleGeocode}
                                disabled={geocoding || !messForm.address}
                                className="px-4 py-2 bg-brand-primary hover:bg-[#250453] text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2 transition-all shadow-sm"
                            >
                                <MapPin size={16} />
                                {geocoding ? 'Geocoding...' : 'Auto-fill Coordinates'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowMapPicker(true)}
                                className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-brand-primary border border-purple-200 rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-sm"
                            >
                                <Map size={16} />
                                Pick on Map
                            </button>
                        </div>
                    </div>
                    <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-4">
                        <div className="flex items-start gap-2 mb-3">
                            <svg className="w-5 h-5 text-brand-primary mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <div>
                                <p className="text-sm font-bold text-gray-900">Location Coordinates (For Distance Calculation)</p>
                                <p className="text-xs text-gray-600 font-medium mt-0.5">Use the button above to auto-fill from address, or enter manually</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-1.5">Latitude</label>
                                <input
                                    type="number"
                                    step="any"
                                    className="w-full p-2.5 border border-gray-300 rounded-lg text-gray-900 font-semibold bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all placeholder:text-gray-400 placeholder:font-normal"
                                    value={messForm.latitude || ''}
                                    onChange={(e) => setMessForm({ ...messForm, latitude: parseFloat(e.target.value) })}
                                    placeholder="e.g. 23.2599"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-1.5">Longitude</label>
                                <input
                                    type="number"
                                    step="any"
                                    className="w-full p-2.5 border border-gray-300 rounded-lg text-gray-900 font-semibold bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all placeholder:text-gray-400 placeholder:font-normal"
                                    value={messForm.longitude || ''}
                                    onChange={(e) => setMessForm({ ...messForm, longitude: parseFloat(e.target.value) })}
                                    placeholder="e.g. 77.4126"
                                />
                            </div>
                        </div>
                        {messForm.latitude && messForm.longitude && (
                            <p className="text-xs text-emerald-700 mt-2 font-bold">✓ Coordinates set - distances will be calculated</p>
                        )}
                    </div>

                    {/* Food Facility Managed By */}
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-1.5">Food Facility Managed By</label>
                        <select
                            className="w-full p-2.5 border border-gray-300 rounded-lg text-gray-900 font-semibold bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                            value={messForm.managedBy}
                            onChange={(e) => setMessForm({ ...messForm, managedBy: e.target.value })}
                        >
                            <option value="Owner">Owner</option>
                            <option value="Students">Students</option>
                            <option value="Warden">Warden</option>
                        </select>
                    </div>

                    {/* Food & Living Services (Page 3) */}
                    <div className="bg-purple-50/40 border border-purple-100 rounded-xl p-4 space-y-4">
                        <div className="flex items-center gap-2 border-b border-purple-100 pb-2">
                            <span className="text-sm font-bold text-brand-primary uppercase tracking-wider">Food & Living Services</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-800 mb-1">Food Availability</label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded-lg text-xs font-semibold bg-white focus:ring-2 focus:ring-brand-primary outline-none"
                                    value={messForm.foodAvailability || 'Food Available'}
                                    onChange={(e) => setMessForm({ ...messForm, foodAvailability: e.target.value })}
                                >
                                    <option value="Food Available">Food Available</option>
                                    <option value="Self Cook">Self Cook Only</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-800 mb-1">Meals Per Day</label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded-lg text-xs font-semibold bg-white focus:ring-2 focus:ring-brand-primary outline-none"
                                    value={messForm.mealsPerDay || '3 Meals'}
                                    onChange={(e) => setMessForm({ ...messForm, mealsPerDay: e.target.value })}
                                >
                                    <option value="1 Meal">1 Meal</option>
                                    <option value="2 Meals">2 Meals</option>
                                    <option value="3 Meals">3 Meals</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-800 mb-1">Food Type</label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded-lg text-xs font-semibold bg-white focus:ring-2 focus:ring-brand-primary outline-none"
                                    value={messForm.foodType || 'Veg + Non-Veg'}
                                    onChange={(e) => setMessForm({ ...messForm, foodType: e.target.value })}
                                >
                                    <option value="Veg + Non-Veg">Veg + Non-Veg</option>
                                    <option value="Veg Only">Veg Only</option>
                                    <option value="Non-Veg Only">Non-Veg Only</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-800 mb-1">Water Facility</label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded-lg text-xs font-semibold bg-white focus:ring-2 focus:ring-brand-primary outline-none"
                                    value={messForm.waterFacility || 'Both'}
                                    onChange={(e) => setMessForm({ ...messForm, waterFacility: e.target.value })}
                                >
                                    <option value="Both">Both (Purifier + Tank)</option>
                                    <option value="Water Filter">Water Filter</option>
                                    <option value="Tubewell">Tubewell</option>
                                    <option value="Water Purifier Only">Water Purifier Only</option>
                                    <option value="Water Tank Only">Water Tank Only</option>
                                    <option value="None">None</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-800 mb-1">Laundry Facility</label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded-lg text-xs font-semibold bg-white focus:ring-2 focus:ring-brand-primary outline-none"
                                    value={messForm.laundryFacility || 'Washing Machine'}
                                    onChange={(e) => setMessForm({ ...messForm, laundryFacility: e.target.value })}
                                >
                                    <option value="Washing Machine">Washing Machine</option>
                                    <option value="By Hand">By Hand</option>
                                    <option value="Both">Both</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-800 mb-1">Cleaning / Housekeeping</label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded-lg text-xs font-semibold bg-white focus:ring-2 focus:ring-brand-primary outline-none"
                                    value={messForm.cleaningService || 'Both'}
                                    onChange={(e) => setMessForm({ ...messForm, cleaningService: e.target.value })}
                                >
                                    <option value="Daily">Daily</option>
                                    <option value="Weekly">Weekly</option>
                                    <option value="Both">Both</option>
                                    <option value="None">None</option>
                                </select>
                            </div>
                        </div>

                        {/* Essential Amenities (Y/N) */}
                        <div>
                            <label className="block text-xs font-bold text-gray-800 mb-1.5">Essential Amenities</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {[
                                    { key: 'wifi', label: 'WiFi', facilityName: 'Wifi' },
                                    { key: 'powerBackup', label: 'Power Backup', facilityName: 'InverterPower' },
                                    { key: 'cctv', label: 'CCTV', facilityName: 'CCTV' },
                                    { key: 'wardenWatchman', label: 'Warden / Guard', facilityName: null }
                                ].map(({ key, label, facilityName }) => (
                                    <label key={key} className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800 cursor-pointer hover:border-brand-primary transition-all">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 accent-brand-primary"
                                            checked={!!messForm[key]}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                let updatedFacilities = [...(messForm.facilities || [])];
                                                if (facilityName) {
                                                    updatedFacilities = checked
                                                        ? [...new Set([...updatedFacilities, facilityName])]
                                                        : updatedFacilities.filter(x => x !== facilityName);
                                                }
                                                setMessForm({ ...messForm, [key]: checked, facilities: updatedFacilities });
                                            }}
                                        />
                                        {label}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Extra Spaces */}
                        <div>
                            <label className="block text-xs font-bold text-gray-800 mb-1.5">Extra Spaces Available</label>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                {['Parking', 'Balcony', 'Study Room', 'Terrace', 'Common Room'].map(space => {
                                    const isChecked = (messForm.extraSpace || []).includes(space);
                                    return (
                                        <label key={space} className="flex items-center gap-1.5 p-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800 cursor-pointer hover:border-brand-primary transition-all">
                                            <input
                                                type="checkbox"
                                                className="w-3.5 h-3.5 accent-brand-primary"
                                                checked={isChecked}
                                                onChange={(e) => {
                                                    const current = messForm.extraSpace || [];
                                                    const updated = e.target.checked ? [...current, space] : current.filter(x => x !== space);
                                                    setMessForm({ ...messForm, extraSpace: updated });
                                                }}
                                            />
                                            {space}
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Facilities */}
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Facilities Available</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                            {['Wifi', 'AC', 'Food Facility', 'InverterPower', 'CCTV'].map(f => (
                                <label key={f} className="flex items-center gap-2 cursor-pointer text-sm font-bold text-gray-900">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 accent-brand-primary"
                                        checked={messForm.facilities.includes(f)}
                                        onChange={(e) => {
                                            const updated = e.target.checked
                                                ? [...messForm.facilities, f]
                                                : messForm.facilities.filter(x => x !== f);
                                            setMessForm({ ...messForm, facilities: updated });
                                        }}
                                    />
                                    {f === 'InverterPower' ? 'Inverter/Backup' : f}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Included in Rent */}
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Included in Rent</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                            {['electricity', 'food', 'water'].map(item => (
                                <label key={item} className="flex items-center gap-2 cursor-pointer text-sm font-bold text-gray-900 capitalize">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 accent-brand-primary"
                                        checked={messForm.includedInRent.includes(item)}
                                        onChange={(e) => {
                                            const updated = e.target.checked
                                                ? [...messForm.includedInRent, item]
                                                : messForm.includedInRent.filter(x => x !== item);
                                            setMessForm({ ...messForm, includedInRent: updated });
                                        }}
                                    />
                                    {item.charAt(0).toUpperCase() + item.slice(1)} Bill
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Advance Payment */}
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-1.5">Advance / Security Deposit</label>
                        <select
                            className="w-full p-2.5 border border-gray-300 rounded-lg text-gray-900 font-semibold bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all mb-2"
                            value={messForm.advancePayment.type}
                            onChange={(e) => setMessForm({ ...messForm, advancePayment: { ...messForm.advancePayment, type: e.target.value } })}
                        >
                            <option value="None">None</option>
                            <option value="1 Month">1 Month</option>
                            <option value="2 Months">2 Months</option>
                            <option value="3 Months">3 Months</option>
                            <option value="4 Months">4 Months</option>
                            <option value="5 Months">5 Months</option>
                            <option value="6 Months">6 Months</option>
                            <option value="1 Month Rent">1 Month Rent (Legacy)</option>
                            <option value="2 Month Rent">2 Month Rent (Legacy)</option>
                            <option value="Full Amount">Full Amount</option>
                            <option value="Custom Amount">Custom Amount</option>
                        </select>
                        {messForm.advancePayment.type === 'Custom Amount' && (
                            <input
                                type="number"
                                placeholder="Enter amount (₹)"
                                className="w-full p-2.5 border border-gray-300 rounded-lg text-gray-900 font-semibold bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                                value={messForm.advancePayment.customAmount}
                                onChange={(e) => setMessForm({ ...messForm, advancePayment: { ...messForm.advancePayment, customAmount: e.target.value } })}
                            />
                        )}
                    </div>

                    {/* Maintenance Charge */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-2 cursor-pointer">
                            <input
                                type="checkbox"
                                className="w-4 h-4 accent-brand-primary"
                                checked={messForm.maintenanceCharge.taken}
                                onChange={(e) => setMessForm({ ...messForm, maintenanceCharge: { ...messForm.maintenanceCharge, taken: e.target.checked } })}
                            />
                            Maintenance Charge Applicable?
                        </label>
                        {messForm.maintenanceCharge.taken && (
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="number"
                                    placeholder="Amount (₹)"
                                    className="p-2.5 border border-gray-300 rounded-lg text-gray-900 font-semibold bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                                    value={messForm.maintenanceCharge.amount}
                                    onChange={(e) => setMessForm({ ...messForm, maintenanceCharge: { ...messForm.maintenanceCharge, amount: e.target.value } })}
                                />
                                <select
                                    className="p-2.5 border border-gray-300 rounded-lg text-gray-900 font-semibold bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                                    value={messForm.maintenanceCharge.frequency}
                                    onChange={(e) => setMessForm({ ...messForm, maintenanceCharge: { ...messForm.maintenanceCharge, frequency: e.target.value } })}
                                >
                                    <option value="Per Month">Per Month</option>
                                    <option value="Per Year">Per Year</option>
                                    <option value="Per Semester">Per Semester</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Charges & Policies Breakdown (Page 4) */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                            <span className="text-sm font-bold text-gray-900 uppercase tracking-wider">Charges & Policies Breakdown</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {/* Security Deposit */}
                            <div>
                                <label className="block text-xs font-bold text-gray-800 mb-1">Security Deposit</label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded-lg text-xs font-semibold bg-white focus:ring-2 focus:ring-brand-primary outline-none cursor-pointer"
                                    value={messForm.securityDeposit || 'No Deposit'}
                                    onChange={(e) => setMessForm({ ...messForm, securityDeposit: e.target.value })}
                                >
                                    <option value="No Deposit">No Deposit</option>
                                    <option value="1 Month">1 Month</option>
                                    <option value="2 Months">2 Months</option>
                                    <option value="3 Months">3 Months</option>
                                    <option value="Custom">Custom Amount</option>
                                </select>
                                {messForm.securityDeposit === 'Custom' && (
                                    <input
                                        type="text"
                                        placeholder="Amount (₹)"
                                        className="w-full mt-1.5 p-1.5 border border-gray-300 rounded text-xs font-semibold"
                                        value={messForm.securityDepositCustom || ''}
                                        onChange={(e) => setMessForm({ ...messForm, securityDepositCustom: e.target.value })}
                                    />
                                )}
                            </div>

                            {/* Electricity Bill */}
                            <div>
                                <label className="block text-xs font-bold text-gray-800 mb-1">Electricity Bill</label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded-lg text-xs font-semibold bg-white focus:ring-2 focus:ring-brand-primary outline-none cursor-pointer"
                                    value={messForm.electricityBill || 'Included in Rent'}
                                    onChange={(e) => setMessForm({ ...messForm, electricityBill: e.target.value })}
                                >
                                    <option value="Included in Rent">Included in Rent</option>
                                    <option value="As per Meter">As per Meter</option>
                                    <option value="Extra Fixed">Extra Fixed Charge</option>
                                </select>
                                {messForm.electricityBill === 'Extra Fixed' && (
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="Fixed Bill per Month (₹)"
                                        className="w-full mt-1.5 p-1.5 border border-gray-300 rounded text-xs font-semibold"
                                        value={messForm.electricityBillAmount || ''}
                                        onChange={(e) => setMessForm({ ...messForm, electricityBillAmount: e.target.value.replace(/[^0-9]/g, '') })}
                                        onWheel={(e) => e.target.blur()}
                                    />
                                )}
                            </div>

                            {/* Maintenance Fee */}
                            <div>
                                <label className="block text-xs font-bold text-gray-800 mb-1">Maintenance Fee</label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded-lg text-xs font-semibold bg-white focus:ring-2 focus:ring-brand-primary outline-none cursor-pointer"
                                    value={messForm.maintenanceFee || 'Included'}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setMessForm({
                                            ...messForm,
                                            maintenanceFee: val,
                                            maintenanceCharge: {
                                                ...messForm.maintenanceCharge,
                                                taken: val === 'Extra Charge'
                                            }
                                        });
                                    }}
                                >
                                    <option value="Included">Included</option>
                                    <option value="Extra Charge">Extra Charge</option>
                                </select>
                                {messForm.maintenanceFee === 'Extra Charge' && (
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="Fee per Month (₹)"
                                        className="w-full mt-1.5 p-1.5 border border-gray-300 rounded text-xs font-semibold"
                                        value={messForm.maintenanceFeeAmount || ''}
                                        onChange={(e) => {
                                            const amt = e.target.value.replace(/[^0-9]/g, '');
                                            setMessForm({
                                                ...messForm,
                                                maintenanceFeeAmount: amt,
                                                maintenanceCharge: {
                                                    ...messForm.maintenanceCharge,
                                                    amount: amt
                                                }
                                            });
                                        }}
                                        onWheel={(e) => e.target.blur()}
                                    />
                                )}
                            </div>

                            {/* Cleaning Charges */}
                            <div>
                                <label className="block text-xs font-bold text-gray-800 mb-1">Cleaning Charges</label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded-lg text-xs font-semibold bg-white focus:ring-2 focus:ring-brand-primary outline-none cursor-pointer"
                                    value={messForm.cleaningCharges || 'Included in Rent'}
                                    onChange={(e) => setMessForm({ ...messForm, cleaningCharges: e.target.value })}
                                >
                                    <option value="Included in Rent">Included in Rent</option>
                                    <option value="Extra Charge">Extra Charge</option>
                                    <option value="None">None</option>
                                </select>
                                {messForm.cleaningCharges === 'Extra Charge' && (
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="Cleaning Fee per Month (₹)"
                                        className="w-full mt-1.5 p-1.5 border border-gray-300 rounded text-xs font-semibold"
                                        value={messForm.cleaningChargesAmount || ''}
                                        onChange={(e) => setMessForm({ ...messForm, cleaningChargesAmount: e.target.value.replace(/[^0-9]/g, '') })}
                                        onWheel={(e) => e.target.blur()}
                                    />
                                )}
                            </div>

                            {/* Food Bill */}
                            <div>
                                <label className="block text-xs font-bold text-gray-800 mb-1">Food Bill</label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded-lg text-xs font-semibold bg-white focus:ring-2 focus:ring-brand-primary outline-none cursor-pointer"
                                    value={messForm.foodBill || 'Included in Rent'}
                                    onChange={(e) => setMessForm({ ...messForm, foodBill: e.target.value })}
                                >
                                    <option value="Included in Rent">Included in Rent</option>
                                    <option value="Separate">Separate</option>
                                    <option value="Self Cook">Self Cook</option>
                                </select>
                            </div>

                            {/* Utensils Charges */}
                            <div>
                                <label className="block text-xs font-bold text-gray-800 mb-1">Utensils Charges</label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded-lg text-xs font-semibold bg-white focus:ring-2 focus:ring-brand-primary outline-none cursor-pointer"
                                    value={messForm.utensilsCharges || 'Provided'}
                                    onChange={(e) => setMessForm({ ...messForm, utensilsCharges: e.target.value })}
                                >
                                    <option value="Provided">Provided</option>
                                    <option value="Chargeable">Chargeable</option>
                                    <option value="Bring Own">Bring Own</option>
                                </select>
                            </div>

                            {/* Notice Period */}
                            <div>
                                <label className="block text-xs font-bold text-gray-800 mb-1">Notice Period</label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded-lg text-xs font-semibold bg-white focus:ring-2 focus:ring-brand-primary outline-none cursor-pointer"
                                    value={messForm.noticePeriod || '1 Month'}
                                    onChange={(e) => setMessForm({ ...messForm, noticePeriod: e.target.value })}
                                >
                                    <option value="No Notice">No Notice</option>
                                    <option value="15 Days">15 Days</option>
                                    <option value="1 Month">1 Month</option>
                                    <option value="2 Months">2 Months</option>
                                    <option value="3 Months">3 Months</option>
                                    <option value="Other">Other</option>
                                </select>
                                {messForm.noticePeriod === 'Other' && (
                                    <input
                                        type="text"
                                        placeholder="e.g. 45 Days"
                                        className="w-full mt-1.5 p-1.5 border border-gray-300 rounded text-xs font-semibold"
                                        value={messForm.noticePeriodCustom || ''}
                                        onChange={(e) => setMessForm({ ...messForm, noticePeriodCustom: e.target.value })}
                                    />
                                )}
                            </div>

                            {/* Operating Since */}
                            <div>
                                <label className="block text-xs font-bold text-gray-800 mb-1">Operating Since</label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded-lg text-xs font-semibold bg-white focus:ring-2 focus:ring-brand-primary outline-none cursor-pointer"
                                    value={messForm.operatingSince || ''}
                                    onChange={(e) => setMessForm({ ...messForm, operatingSince: e.target.value })}
                                >
                                    <option value="">Select Year</option>
                                    {Array.from({ length: 27 }, (_, i) => 2026 - i).map(year => (
                                        <option key={year} value={String(year)}>{year}</option>
                                    ))}
                                    <option value="Before 2000">Before 2000</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Billing Cycle & Stay Commitment */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1.5">Rent Billing Cycle</label>
                            <select
                                className="w-full p-2.5 border border-gray-300 rounded-lg text-gray-900 font-semibold bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                                value={messForm.rentCycle || 'monthly'}
                                onChange={(e) => setMessForm({ ...messForm, rentCycle: e.target.value })}
                            >
                                <option value="monthly">Monthly Basis</option>
                                <option value="yearly">Yearly Basis</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1.5">Minimum Stay (Months)</label>
                            <input
                                type="number"
                                className="w-full p-2.5 border border-gray-300 rounded-lg text-gray-900 font-semibold bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                                value={messForm.minStayDuration || 1}
                                onChange={(e) => setMessForm({ ...messForm, minStayDuration: parseInt(e.target.value) || 1 })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1.5">Extra Electric Appliances</label>
                            <input
                                type="text"
                                placeholder="e.g. Iron, Kettle allowed"
                                className="w-full p-2.5 border border-gray-300 rounded-lg text-gray-900 font-semibold bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all placeholder:text-gray-400 placeholder:font-normal"
                                value={messForm.extraAppliances}
                                onChange={(e) => setMessForm({ ...messForm, extraAppliances: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1.5">Food Facility Details</label>
                            <input
                                type="text"
                                placeholder="e.g. 3 Meals, Pure Veg"
                                className="w-full p-2.5 border border-gray-300 rounded-lg text-gray-900 font-semibold bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all placeholder:text-gray-400 placeholder:font-normal"
                                value={messForm.foodFacility}
                                onChange={(e) => setMessForm({ ...messForm, foodFacility: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1.5">Security Details</label>
                            <input
                                type="text"
                                placeholder="e.g. CCTV, Guard 24/7"
                                className="w-full p-2.5 border border-gray-300 rounded-lg text-gray-900 font-semibold bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all placeholder:text-gray-400 placeholder:font-normal"
                                value={messForm.security || ''}
                                onChange={(e) => setMessForm({ ...messForm, security: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="bg-brand-secondary p-4 rounded-lg border border-brand-light-gray">
                        <div className="flex items-center gap-4 mb-3">
                            <label className="flex items-center gap-2 cursor-pointer font-medium text-brand-text-dark">
                                <input
                                    type="checkbox"
                                    className="w-5 h-5 accent-brand-primary"
                                    checked={messForm.isUserSourced}
                                    onChange={(e) => setMessForm({ ...messForm, isUserSourced: e.target.checked })}
                                />
                                Mark as "User Sourced"
                            </label>
                        </div>
                        {messForm.isUserSourced && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="block text-sm font-medium mb-1 text-brand-text-dark">Last Date of Update</label>
                                <input
                                    type="date"
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-primary outline-none"
                                    value={messForm.lastUpdatedDate}
                                    onChange={(e) => setMessForm({ ...messForm, lastUpdatedDate: e.target.value })}
                                    required={messForm.isUserSourced}
                                />
                                <p className="text-xs text-gray-500 mt-1 italic">Note: This will be shown to users as unverified information.</p>
                            </div>
                        )}
                    </div>

                    <div>
                        <MultiSelectDropdown
                            label="Amenities Available"
                            options={[
                                { key: 'wifi', label: 'Wifi Availability' },
                                { key: 'inverter', label: 'Electricity Backup' },
                                { key: 'food', label: 'Food Service' }
                            ]}
                            selected={messForm.amenities}
                            onChange={(key, checked) => setMessForm({
                                ...messForm,
                                amenities: { ...messForm.amenities, [key]: checked }
                            })}
                            color="brand"
                            theme="light"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Mess Poster {isEditingMess && '(Leave empty to keep current)'}</label>
                        <input
                            type="file"
                            onChange={(e) => setPosterFile(e.target.files[0])}
                            className="w-full"
                            accept="image/*"
                        />
                        {isEditingMess && messProfile?.posterUrl && (
                            <div className="mt-2 text-center md:text-left">
                                <p className="text-xs text-gray-500 mb-1">Current Poster:</p>
                                <img src={messProfile.posterUrl} alt="Current Poster" className="h-20 w-auto rounded border" />
                            </div>
                        )}
                    </div>

                    <div className="pt-2 border-t border-gray-100">
                        <label className="block text-sm font-medium mb-1 text-brand-primary flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                            Mess Photo Gallery (Max 15 Images)
                        </label>
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => setGalleryFiles(e.target.files)}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-accent-blue/10 file:text-brand-accent-blue hover:file:bg-brand-accent-blue/20"
                        />
                        <p className="text-xs text-gray-400 mt-1 italic">Select multiple stunning photos showcasing your mess (dining area, building exterior, sitting area, etc.)</p>

                        {isEditingMess && messProfile?.galleryUrls?.length > 0 && (
                            <div className="mt-4">
                                <p className="text-xs text-gray-500 mb-2 font-medium">Current Gallery ({messProfile.galleryUrls.length}/15):</p>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                    {messProfile.galleryUrls.map((url, idx) => (
                                        <div key={idx} className="relative group rounded-md overflow-hidden border shadow-sm aspect-square bg-gray-50">
                                            <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={(e) => { e.preventDefault(); removeGalleryImage(url); }}
                                                className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Remove Image"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                            </form>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 sm:px-6 sm:py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-white rounded-b-2xl sticky bottom-0 z-20 shadow-md">
                            {messProfile && (
                                <button
                                    type="button"
                                    onClick={handleCancelEditMess}
                                    className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-semibold text-sm"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                type="submit"
                                form="mess-profile-form"
                                disabled={uploading}
                                className="px-6 py-2.5 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary-hover shadow-md hover:shadow-lg transition-all text-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {uploading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                        </svg>
                                        Saving...
                                    </span>
                                ) : (
                                    isEditingMess ? 'Update Profile' : 'Create Profile'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Display Card when Profile exists or Creation Banner when empty */}
            {messProfile ? (
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-md mb-8 border border-gray-200 relative">
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h2 className="text-3xl font-extrabold text-gray-950 tracking-tight">{messProfile.name}</h2>
                                <span className="text-sm bg-purple-100 text-purple-800 px-3 py-1 rounded-lg font-bold capitalize">{messProfile.district || 'balasore'}</span>
                                <span className="text-sm bg-gray-100 text-gray-800 px-3 py-1 rounded-lg font-bold">{messProfile.messType}</span>
                                {messProfile.rentCycle === 'yearly' && (
                                    <span className="text-sm bg-amber-100 text-amber-800 px-3 py-1 rounded-lg font-bold">Yearly Billing</span>
                                )}
                                {messProfile.minStayDuration > 1 && (
                                    <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-lg font-bold">{messProfile.minStayDuration}m min stay</span>
                                )}
                            </div>

                            <p className="text-gray-800 text-base md:text-lg font-semibold leading-relaxed max-w-2xl">{messProfile.address}</p>

                            <p className="text-gray-950 text-base md:text-lg font-bold flex items-center gap-2">
                                📞 <span className="text-brand-primary">{messProfile.contact}</span>
                            </p>

                            <div className="flex items-center gap-3 pt-1 flex-wrap text-sm font-bold">
                                {messProfile.operatingSince && (
                                    <span className="text-purple-800 bg-purple-50 border border-purple-200 px-3 py-1 rounded-md">📅 Since {messProfile.operatingSince}</span>
                                )}
                                {messProfile.noticePeriod && (
                                    <span className="text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-md">⏳ {messProfile.noticePeriod} Notice</span>
                                )}
                                {messProfile.foodAvailability && (
                                    <span className="text-indigo-800 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-md">🍽️ {messProfile.foodAvailability}</span>
                                )}
                                {messProfile.latitude && messProfile.longitude && (
                                    <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-md">✓ GPS Set</span>
                                )}
                                {messProfile.galleryUrls?.length > 0 && (
                                    <span className="text-gray-700 bg-gray-50 border border-gray-200 px-3 py-1 rounded-md">🖼️ {messProfile.galleryUrls.length} gallery photos</span>
                                )}
                                {messProfile.isVerified && (
                                    <span className="text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-md">✓ Verified</span>
                                )}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleEditMessClick}
                            className="p-3 text-gray-700 hover:text-brand-primary hover:bg-purple-50 rounded-full transition-all shrink-0 border-2 border-gray-200 hover:border-brand-primary shadow-sm"
                            title="Edit Profile"
                            aria-label="Edit Profile"
                        >
                            <Pencil size={22} />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-white p-8 rounded-2xl shadow-md mb-8 border border-dashed border-gray-300 text-center">
                    <h2 className="text-xl font-bold text-gray-800 mb-2">No Mess Profile Found</h2>
                    <p className="text-gray-500 text-sm mb-4">Create your Mess Profile to list your mess and start managing room types.</p>
                    <button
                        type="button"
                        onClick={handleEditMessClick}
                        className="px-6 py-2.5 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-primary-hover shadow-md transition-all inline-flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Create Mess Profile
                    </button>
                </div>
            )}
        </>
    );
};

export default MessProfileTab;
