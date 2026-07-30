import React from 'react';
import { Pencil, Trash2, X, Plus } from 'lucide-react';
import RoomCard from '../../../components/RoomCard';
import MultiSelectDropdown from '../../../components/MultiSelectDropdown';

const RoomManagementTab = ({
    rooms,
    formData,
    setFormData,
    editingRoomId,
    setImageFiles,
    uploading,

    handleRoomSubmit,
    handleEditRoomClick,
    handleCancelEditRoom,
    removeImage,
    handleDelete,
    messProfile,
    isRoomModalOpen,
    handleAddNewRoomClick
}) => {
    return (
        <>
            {/* Modal/Pop-out overlay for Add / Edit Room */}
            {isRoomModalOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border-t-4 border-brand-primary relative max-h-[90vh] flex flex-col my-8">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white rounded-t-2xl z-10">
                            <h2 className="text-2xl font-bold text-brand-text-dark">
                                {editingRoomId ? 'Edit Room Type' : 'Add New Room Type'}
                            </h2>
                            <button
                                type="button"
                                onClick={handleCancelEditRoom}
                                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex-1">
                            <form id="room-form" onSubmit={handleRoomSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-900 mb-1.5">Occupancy Type</label>
                                        <select
                                            className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 font-bold bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                                            value={formData.occupancy}
                                            onChange={e => setFormData({ ...formData, occupancy: e.target.value })}
                                        >
                                            <option value="1">1 Seater</option>
                                            <option value="2">2 Seater</option>
                                            <option value="3">3 Seater</option>
                                            <option value="4">4 Seater</option>
                                            <option value="5">5 Seater</option>
                                            <option value="6">6 Seater</option>
                                            <option value="7">7 Seater</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-900 mb-1.5">Category (Optional)</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Deluxe, AC, Balcony"
                                            className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 font-semibold bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all placeholder:text-gray-400 placeholder:font-normal"
                                            value={formData.category || ''}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-900 mb-1.5">
                                            Price per Student
                                            <span className="ml-1 text-xs font-bold text-brand-primary">
                                                ({messProfile?.rentCycle === 'yearly' ? '₹/year' : '₹/month'})
                                            </span>
                                        </label>
                                        <input
                                            type="number"
                                            className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 font-semibold bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                                            value={formData.price}
                                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-900 mb-1.5">Total Rooms of this Type</label>
                                        <input
                                            type="number"
                                            className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 font-semibold bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                                            value={formData.totalInventory}
                                            onChange={e => setFormData({ ...formData, totalInventory: parseInt(e.target.value) || 0 })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-900 mb-1.5">Available Beds/Seats</label>
                                        <input
                                            type="number"
                                            className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 font-semibold bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                                            value={formData.availableCount}
                                            onChange={e => setFormData({ ...formData, availableCount: parseInt(e.target.value) || 0 })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <MultiSelectDropdown
                                        label="Amenities Included"
                                        options={[
                                            { key: 'ac', label: 'AC' },
                                            { key: 'attachedBathroom', label: 'Attached Bathroom' }
                                        ]}
                                        selected={formData.amenities}
                                        onChange={(key, checked) => setFormData({
                                            ...formData,
                                            amenities: { ...formData.amenities, [key]: checked }
                                        })}
                                        color="brand"
                                        theme="light"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-900 mb-1.5">Other Details</label>
                                    <textarea
                                        placeholder="Additional info about this room type..."
                                        className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 font-semibold bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all placeholder:text-gray-400 placeholder:font-normal"
                                        value={formData.otherInfo || ''}
                                        onChange={e => setFormData({ ...formData, otherInfo: e.target.value })}
                                        rows="3"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-900 mb-1.5">Room Images (Max 5)</label>
                                    <input
                                        type="file"
                                        onChange={e => setImageFiles(e.target.files)}
                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-primary/10 file:text-brand-primary hover:file:bg-brand-primary/20 file:cursor-pointer"
                                        accept="image/*"
                                        multiple
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Select multiple files to upload.</p>

                                    {editingRoomId && (
                                        <div className="mt-4 bg-gray-50 p-4 rounded-xl">
                                            <p className="text-sm font-medium mb-3 text-brand-text-dark">Current Images:</p>
                                            <div className="flex flex-wrap gap-3">
                                                {(() => {
                                                    const room = rooms.find(r => r.id === editingRoomId);
                                                    if (!room) return null;
                                                    const images = room.imageUrls || (room.imageUrl ? [room.imageUrl] : []);
                                                    return images.map((url, index) => (
                                                        <div key={index} className="relative group rounded-lg overflow-hidden border border-gray-200">
                                                            <img src={url} alt={`Room ${index + 1}`} className="w-20 h-20 object-cover" />
                                                            <button
                                                                type="button"
                                                                onClick={() => removeImage(url)}
                                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                                                title="Remove Image"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        </div>
                                                    ));
                                                })()}
                                            </div>
                                        </div>
                                    )}
                                </div>

                            </form>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 sm:px-6 sm:py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-white rounded-b-2xl sticky bottom-0 z-20 shadow-md">
                            <button
                                type="button"
                                onClick={handleCancelEditRoom}
                                className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-semibold text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="room-form"
                                disabled={uploading}
                                className={`px-6 py-2.5 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all text-sm disabled:opacity-70 disabled:cursor-not-allowed ${
                                    editingRoomId ? 'bg-brand-amber hover:bg-amber-600' : 'bg-brand-primary hover:bg-brand-primary-hover'
                                }`}
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
                                    editingRoomId ? 'Update Room Type' : 'Add Room Type'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Room list and add button header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-brand-text-dark">Your Room Types</h2>
                <button
                    type="button"
                    onClick={handleAddNewRoomClick}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-brand-primary text-white hover:bg-brand-primary-hover transition-colors shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                    aria-label="Add Room Type"
                    title="Add Room Type"
                >
                    <Plus size={24} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map(room => (
                    <div key={room.id} className={`${editingRoomId === room.id ? 'ring-2 ring-brand-amber rounded-2xl' : ''}`}>
                        <RoomCard
                            room={room}
                            isAdmin={true}
                            onEdit={handleEditRoomClick}
                            onDelete={handleDelete}
                        />
                    </div>
                ))}
            </div>
        </>
    );
};

export default RoomManagementTab;
