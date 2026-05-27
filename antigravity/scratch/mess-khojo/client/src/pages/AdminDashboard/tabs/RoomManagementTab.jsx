import React from 'react';
import { Pencil, Trash2, X } from 'lucide-react';
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
    messProfile
}) => {
    return (
        <>
            <div className="bg-white p-6 rounded-lg shadow-md mb-8 border-t-4 border-brand-primary">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">{editingRoomId ? 'Edit Room' : 'Add New Room'}</h2>
                    {editingRoomId && (
                        <button onClick={handleCancelEditRoom} className="text-gray-500 hover:text-gray-700 flex items-center gap-1">
                            <X size={18} /> Cancel Edit
                        </button>
                    )}
                </div>

                <form onSubmit={handleRoomSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Occupancy Type</label>
                            <select
                                className="w-full p-2 border rounded"
                                value={formData.occupancy}
                                onChange={e => setFormData({ ...formData, occupancy: e.target.value })}
                            >
                                <option value="1">1 Seater</option>
                                <option value="2">2 Seater</option>
                                <option value="3">3 Seater</option>
                                <option value="4">4 Seater</option>
                                <option value="5">5 Seater</option>
                                <option value="6">6 Seater</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Category (Optional)</label>
                            <input
                                type="text"
                                placeholder="e.g. Deluxe, AC, Balcony"
                                className="w-full p-2 border rounded"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Price per Student
                                <span className="ml-1 text-xs font-normal text-brand-primary">
                                    ({messProfile?.rentCycle === 'yearly' ? '₹/year' : '₹/month'})
                                </span>
                            </label>
                            <input
                                type="number"
                                className="w-full p-2 border rounded"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Total Rooms of this Type</label>
                            <input
                                type="number"
                                className="w-full p-2 border rounded"
                                value={formData.totalInventory}
                                onChange={e => setFormData({ ...formData, totalInventory: parseInt(e.target.value) })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-brand-accent-green">Available Beds/Seats</label>
                            <input
                                type="number"
                                className="w-full p-2 border border-brand-accent-green/20 bg-brand-accent-green/5 outline-none rounded"
                                value={formData.availableCount}
                                onChange={e => setFormData({ ...formData, availableCount: parseInt(e.target.value) })}
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
                            color="cyan"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Other Details</label>
                        <textarea
                            placeholder="Additional info about this room type..."
                            className="w-full p-2 border rounded"
                            value={formData.otherInfo}
                            onChange={e => setFormData({ ...formData, otherInfo: e.target.value })}
                            rows="3"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Room Images (Max 5)</label>
                        <input
                            type="file"
                            onChange={e => setImageFiles(e.target.files)}
                            className="w-full"
                            accept="image/*"
                            multiple
                        />
                        <p className="text-xs text-gray-500 mt-1">Select multiple files to upload.</p>

                        {editingRoomId && (
                            <div className="mt-4">
                                <p className="text-sm font-medium mb-2">Current Images:</p>
                                <div className="flex flex-wrap gap-2">
                                    {(() => {
                                        const room = rooms.find(r => r.id === editingRoomId);
                                        if (!room) return null;
                                        const images = room.imageUrls || (room.imageUrl ? [room.imageUrl] : []);
                                        return images.map((url, index) => (
                                            <div key={index} className="relative group">
                                                <img src={url} alt={`Room ${index + 1}`} className="w-20 h-20 object-cover rounded border" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(url)}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
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

                    <button type="submit" disabled={uploading} className={`w-full text-white py-2 rounded shadow-md hover:bg-opacity-90 transition-all ${editingRoomId ? 'bg-brand-amber font-bold' : 'bg-brand-primary'}`}>
                        {uploading ? 'Saving...' : (editingRoomId ? 'Update Room Type' : 'Add Room Type')}
                    </button>
                </form>
            </div>

            <h2 className="text-2xl font-bold mb-4">Your Room Types</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map(room => (
                    <div key={room.id} className={`relative group ${editingRoomId === room.id ? 'ring-2 ring-brand-amber rounded-xl' : ''}`}>
                        <RoomCard room={room} isAdmin={true} />
                        <div className="absolute top-2 right-2 flex gap-2">
                            <button
                                onClick={() => handleEditRoomClick(room)}
                                className="bg-white text-brand-amber p-1.5 rounded-full hover:bg-brand-amber/10 shadow-sm border border-brand-light-gray"
                                title="Edit Room"
                            >
                                <Pencil size={16} />
                            </button>
                            <button
                                onClick={() => handleDelete(room.id)}
                                className="bg-white text-brand-red p-1.5 rounded-full hover:bg-brand-red/10 shadow-sm border border-brand-light-gray"
                                title="Delete Room"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
};

export default RoomManagementTab;
