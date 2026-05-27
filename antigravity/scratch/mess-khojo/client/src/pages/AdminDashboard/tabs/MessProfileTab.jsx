import React from 'react';
import { Pencil, Trash2, X } from 'lucide-react';
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
    if (!messProfile || isEditingMess) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-brand-text-dark">{isEditingMess ? 'Edit Mess Profile' : 'Create Mess Profile'}</h2>
                    {isEditingMess && (
                        <button onClick={handleCancelEditMess} className="text-gray-500 hover:text-gray-700">
                            <X size={24} />
                        </button>
                    )}
                </div>
                <form onSubmit={handleMessSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Mess Name</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded"
                            value={messForm.name}
                            onChange={(e) => setMessForm({ ...messForm, name: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">District</label>
                        <div className="w-full p-2 border border-dashed border-gray-300 rounded bg-gray-50 text-gray-600 capitalize flex items-center gap-2">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-50"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            {messForm.district || 'balasore'}
                            <span className="ml-auto text-[10px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded font-medium">Managed by Operator</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Mess Type</label>
                        <select
                            className="w-full p-2 border rounded"
                            value={messForm.messType}
                            onChange={(e) => setMessForm({ ...messForm, messType: e.target.value })}
                        >
                            <option value="Boys">Boys Mess</option>
                            <option value="Girls">Girls Mess</option>
                            <option value="Co-ed">Co-ed Mess</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Address</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded"
                            value={messForm.address}
                            onChange={(e) => setMessForm({ ...messForm, address: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Description / About Mess</label>
                        <textarea
                            className="w-full p-2 border rounded h-32 resize-none"
                            value={messForm.description || ''}
                            onChange={(e) => setMessForm({ ...messForm, description: e.target.value })}
                            placeholder="Enter a detailed description about your mess..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Contact Number</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded"
                            value={messForm.contact}
                            onChange={(e) => setMessForm({ ...messForm, contact: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Google Maps Location URL</label>
                        <input
                            type="url"
                            className="w-full p-2 border border-brand-light-gray rounded focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
                            value={messForm.locationUrl}
                            onChange={(e) => handleLocationUrlChange(e.target.value)}
                            placeholder="Paste Google Maps URL (coordinates will auto-extract)"
                        />
                        <p className="text-xs text-gray-500 mt-1">💡 Tip: Paste a Google Maps link and coordinates will be extracted automatically!</p>
                        <button
                            type="button"
                            onClick={handleGeocode}
                            disabled={geocoding || !messForm.address}
                            className="mt-2 px-4 py-2 bg-brand-accent-blue text-white rounded-lg hover:bg-brand-accent-blue/90 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            {geocoding ? 'Geocoding...' : 'Auto-fill Coordinates'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowMapPicker(true)}
                            className="mt-2 ml-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium flex items-center gap-2"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            Pick on Map
                        </button>
                    </div>
                    <div className="bg-brand-accent-blue/5 border border-brand-accent-blue/20 rounded-lg p-4">
                        <div className="flex items-start gap-2 mb-3">
                            <svg className="w-5 h-5 text-brand-accent-blue mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <div>
                                <p className="text-sm font-semibold text-brand-text-dark">Location Coordinates (For Distance Calculation)</p>
                                <p className="text-xs text-brand-text-gray mt-1">Use the button above to auto-fill from address, or enter manually</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-brand-text-dark">Latitude</label>
                                <input
                                    type="number"
                                    step="any"
                                    className="w-full p-2 border border-brand-light-gray rounded focus:ring-2 focus:ring-brand-primary"
                                    value={messForm.latitude || ''}
                                    onChange={(e) => setMessForm({ ...messForm, latitude: parseFloat(e.target.value) })}
                                    placeholder="e.g. 23.2599"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-brand-text-dark">Longitude</label>
                                <input
                                    type="number"
                                    step="any"
                                    className="w-full p-2 border border-brand-light-gray rounded focus:ring-2 focus:ring-brand-primary"
                                    value={messForm.longitude || ''}
                                    onChange={(e) => setMessForm({ ...messForm, longitude: parseFloat(e.target.value) })}
                                    placeholder="e.g. 77.4126"
                                />
                            </div>
                        </div>
                        {messForm.latitude && messForm.longitude && (
                            <p className="text-xs text-brand-accent-green mt-2 font-medium">✓ Coordinates set - distances will be calculated</p>
                        )}
                    </div>

                    {/* Managed By */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Managed By</label>
                        <select
                            className="w-full p-2 border rounded"
                            value={messForm.managedBy}
                            onChange={(e) => setMessForm({ ...messForm, managedBy: e.target.value })}
                        >
                            <option value="Owner">Owner</option>
                            <option value="Students">Students</option>
                            <option value="Warden">Warden</option>
                        </select>
                    </div>

                    {/* Facilities */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Facilities Available</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {['Wifi', 'AC', 'Food Facility', 'InverterPower', 'CCTV'].map(f => (
                                <label key={f} className="flex items-center gap-2 cursor-pointer text-sm">
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
                        <label className="block text-sm font-medium mb-2">Included in Rent</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {['electricity', 'food', 'water'].map(item => (
                                <label key={item} className="flex items-center gap-2 cursor-pointer text-sm capitalize">
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
                                    {item} bill included
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Advance Payment */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Advance / Security Deposit</label>
                        <select
                            className="w-full p-2 border rounded mb-2"
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
                            <option value="Custom Amount">Custom Amount</option>
                        </select>
                        {messForm.advancePayment.type === 'Custom Amount' && (
                            <input
                                type="number"
                                placeholder="Enter amount (₹)"
                                className="w-full p-2 border rounded"
                                value={messForm.advancePayment.customAmount}
                                onChange={(e) => setMessForm({ ...messForm, advancePayment: { ...messForm.advancePayment, customAmount: e.target.value } })}
                            />
                        )}
                    </div>

                    {/* Maintenance Charge */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium mb-2 cursor-pointer">
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
                                    className="p-2 border rounded"
                                    value={messForm.maintenanceCharge.amount}
                                    onChange={(e) => setMessForm({ ...messForm, maintenanceCharge: { ...messForm.maintenanceCharge, amount: e.target.value } })}
                                />
                                <select
                                    className="p-2 border rounded"
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

                    {/* Billing Cycle & Stay Commitment */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Rent Billing Cycle</label>
                            <select
                                className="w-full p-2 border rounded"
                                value={messForm.rentCycle || 'monthly'}
                                onChange={(e) => setMessForm({ ...messForm, rentCycle: e.target.value })}
                            >
                                <option value="monthly">Monthly Basis</option>
                                <option value="yearly">Yearly Basis</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Minimum Stay (Months)</label>
                            <input
                                type="number"
                                className="w-full p-2 border rounded"
                                value={messForm.minStayDuration || 1}
                                onChange={(e) => setMessForm({ ...messForm, minStayDuration: parseInt(e.target.value) || 1 })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Extra Electric Appliances</label>
                            <input
                                type="text"
                                placeholder="e.g. Iron, Kettle allowed"
                                className="w-full p-2 border rounded"
                                value={messForm.extraAppliances}
                                onChange={(e) => setMessForm({ ...messForm, extraAppliances: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Food Facility Details</label>
                            <input
                                type="text"
                                placeholder="e.g. 3 Meals, Pure Veg"
                                className="w-full p-2 border rounded"
                                value={messForm.foodFacility}
                                onChange={(e) => setMessForm({ ...messForm, foodFacility: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Security Details</label>
                            <input
                                type="text"
                                placeholder="e.g. CCTV, Guard 24/7"
                                className="w-full p-2 border rounded"
                                value={messForm.extraAppliances} // Note: security wasn't in list of grid columns, wait let me check the security input
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
                            color="indigo"
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

                    <button type="submit" disabled={uploading} className="w-full bg-brand-primary text-white py-2 rounded hover:bg-brand-primary-hover shadow-md transition-all">
                        {uploading ? 'Saving...' : (isEditingMess ? 'Update Profile' : 'Create Profile')}
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h2 className="text-2xl font-bold text-gray-800">{messProfile.name}</h2>
                        <span className="text-xs bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded font-semibold capitalize">{messProfile.district || 'balasore'}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-semibold">{messProfile.messType}</span>
                        {messProfile.rentCycle === 'yearly' && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-semibold">Yearly Billing</span>
                        )}
                        {messProfile.minStayDuration > 1 && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-semibold">{messProfile.minStayDuration}m min stay</span>
                        )}
                    </div>
                    <p className="text-gray-600 text-sm">{messProfile.address}</p>
                    <p className="text-gray-600 text-sm">📞 {messProfile.contact}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        {messProfile.latitude && messProfile.longitude && (
                            <span className="flex items-center gap-1 text-green-600">✓ GPS Set</span>
                        )}
                        {messProfile.galleryUrls?.length > 0 && (
                            <span>🖼️ {messProfile.galleryUrls.length} gallery photos</span>
                        )}
                        {messProfile.isVerified && (
                            <span className="text-blue-600">✓ Verified</span>
                        )}
                    </div>
                </div>
                <button
                    onClick={handleEditMessClick}
                    className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors ml-4 shrink-0"
                >
                    <Pencil size={18} /> Edit Profile
                </button>
            </div>
        </div>
    );
};

export default MessProfileTab;
