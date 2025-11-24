import React, { useState, useEffect } from 'react';
import { auth, db, storage } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, addDoc, getDocs, deleteDoc, updateDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import RoomCard from '../components/RoomCard';
import { Pencil, Trash2, X } from 'lucide-react';

const AdminDashboard = () => {
    const [user, setUser] = useState(null);
    const [messProfile, setMessProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);

    // Mess Profile Form State
    const [messForm, setMessForm] = useState({
        name: '',
        address: '',
        contact: ''
    });
    const [posterFile, setPosterFile] = useState(null);
    const [isEditingMess, setIsEditingMess] = useState(false);

    // Room Form State
    const [rooms, setRooms] = useState([]);
    const [formData, setFormData] = useState({
        roomNumber: '',
        rent: '',
        beds: '',
        bathrooms: '',
        location: '',
        otherInfo: '',
        food: false,
        waterFilter: false,
        tableChair: false,
        advanceDeposit: '',
        available: true
    });
    const [imageFiles, setImageFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [editingRoomId, setEditingRoomId] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged(async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                // Check for existing Mess Profile
                const q = query(collection(db, "messes"), where("adminId", "==", currentUser.uid));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const profile = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
                    setMessProfile(profile);
                }
                setLoadingProfile(false);
            } else {
                navigate('/admin/login');
            }
        });

        return () => unsubscribeAuth();
    }, [navigate]);

    // Listen for rooms ONLY if mess profile exists
    useEffect(() => {
        if (!messProfile) return;

        const q = query(collection(db, "rooms"), where("messId", "==", messProfile.id));
        const unsubscribeRooms = onSnapshot(q, (snapshot) => {
            const roomsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRooms(roomsData);
        });

        return () => unsubscribeRooms();
    }, [messProfile]);

    const handleLogout = async () => {
        await signOut(auth);
        navigate('/admin/login');
    };

    const handleMessSubmit = async (e) => {
        e.preventDefault();
        if (!messForm.name || !messForm.address || !messForm.contact) {
            alert("Please fill all mess details");
            return;
        }

        setUploading(true);
        try {
            let posterUrl = messProfile?.posterUrl || "";
            if (posterFile) {
                const storageRef = ref(storage, `posters/${Date.now()}_${posterFile.name}`);
                const snapshot = await uploadBytes(storageRef, posterFile);
                posterUrl = await getDownloadURL(snapshot.ref);
            }

            if (isEditingMess && messProfile) {
                // Update existing profile
                const messRef = doc(db, "messes", messProfile.id);
                await updateDoc(messRef, {
                    ...messForm,
                    posterUrl
                });
                setMessProfile({ ...messProfile, ...messForm, posterUrl });
                setIsEditingMess(false);
                alert("Mess Profile updated successfully!");
            } else {
                // Create new profile
                const docRef = await addDoc(collection(db, "messes"), {
                    ...messForm,
                    posterUrl,
                    adminId: user.uid,
                    createdAt: new Date()
                });
                setMessProfile({ id: docRef.id, ...messForm, posterUrl, adminId: user.uid });
                alert("Mess Profile created successfully!");
            }
        } catch (error) {
            console.error("Error saving mess profile:", error);
            alert("Error saving mess profile");
        } finally {
            setUploading(false);
            setPosterFile(null);
        }
    };

    const handleEditMessClick = () => {
        setMessForm({
            name: messProfile.name,
            address: messProfile.address,
            contact: messProfile.contact
        });
        setIsEditingMess(true);
    };

    const handleCancelEditMess = () => {
        setIsEditingMess(false);
        setMessForm({ name: '', address: '', contact: '' });
        setPosterFile(null);
    };

    const handleRoomSubmit = async (e) => {
        e.preventDefault();
        if (!messProfile) {
            alert("Mess profile missing!");
            return;
        }

        setUploading(true);
        try {
            let downloadURLs = [];
            
            // Keep existing images if editing
            if (editingRoomId) {
                const currentRoom = rooms.find(r => r.id === editingRoomId);
                if (currentRoom.imageUrls) {
                    downloadURLs = [...currentRoom.imageUrls];
                } else if (currentRoom.imageUrl) {
                    downloadURLs = [currentRoom.imageUrl];
                }
            }

            // Upload new images
            if (imageFiles.length > 0) {
                const uploadPromises = Array.from(imageFiles).map(async (file) => {
                    const storageRef = ref(storage, `rooms/${Date.now()}_${file.name}`);
                    const snapshot = await uploadBytes(storageRef, file);
                    return getDownloadURL(snapshot.ref);
                });
                const newUrls = await Promise.all(uploadPromises);
                downloadURLs = [...downloadURLs, ...newUrls];
            } else if (!editingRoomId && imageFiles.length === 0) {
                alert("Please select at least one image for a new room");
                setUploading(false);
                return;
            }
            
            // Limit to 5 images total (optional validation, but good UX)
            if (downloadURLs.length > 5) {
                alert(`You have ${downloadURLs.length} images. Maximum allowed is 5. Please remove some.`);
                setUploading(false);
                return;
            }

            const roomData = {
                ...formData,
                imageUrls: downloadURLs,
                // Keep backward compatibility for now, or just use imageUrls
                imageUrl: downloadURLs[0] || "", 
                messId: messProfile.id,
                messName: messProfile.name,
            };

            if (editingRoomId) {
                // Update existing room
                await updateDoc(doc(db, "rooms", editingRoomId), roomData);
                alert("Room updated successfully!");
            } else {
                // Add new room
                await addDoc(collection(db, "rooms"), {
                    ...roomData,
                    createdAt: new Date()
                });
                alert("Room added successfully!");
            }

            // Reset form
            setFormData({
                roomNumber: '', rent: '', beds: '', bathrooms: '', location: '',
                otherInfo: '', food: false, waterFilter: false, tableChair: false, advanceDeposit: '', available: true
            });
            setImageFiles([]);
            setEditingRoomId(null);
        } catch (error) {
            console.error("Error saving room: ", error);
            alert(`Error saving room: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleEditRoomClick = (room) => {
        setEditingRoomId(room.id);
        setFormData({
            roomNumber: room.roomNumber,
            rent: room.rent,
            beds: room.beds,
            bathrooms: room.bathrooms,
            location: room.location,
            otherInfo: room.otherInfo || '',
            food: room.food || false,
            waterFilter: room.waterFilter || false,
            tableChair: room.tableChair || false,
            advanceDeposit: room.advanceDeposit || '',
            available: room.available !== undefined ? room.available : true
        });
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEditRoom = () => {
        setEditingRoomId(null);
        setFormData({
            roomNumber: '', rent: '', beds: '', bathrooms: '', location: '',
            otherInfo: '', food: false, waterFilter: false, tableChair: false, advanceDeposit: '', available: true
        });
        setImageFiles([]);
    };

    const removeImage = async (imageUrlToRemove) => {
        if (!editingRoomId) return;
        
        try {
            const room = rooms.find(r => r.id === editingRoomId);
            const updatedUrls = (room.imageUrls || [room.imageUrl]).filter(url => url !== imageUrlToRemove);
            
            await updateDoc(doc(db, "rooms", editingRoomId), {
                imageUrls: updatedUrls,
                imageUrl: updatedUrls[0] || ""
            });
            
            // Update local state to reflect change immediately
            setRooms(rooms.map(r => {
                if (r.id === editingRoomId) {
                    return { ...r, imageUrls: updatedUrls, imageUrl: updatedUrls[0] || "" };
                }
                return r;
            }));
            
        } catch (error) {
            console.error("Error removing image:", error);
            alert("Failed to remove image");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this room?")) {
            try {
                await deleteDoc(doc(db, "rooms", id));
            } catch (error) {
                console.error("Error deleting room:", error);
            }
        }
    };

    const toggleAvailability = async (room) => {
        try {
            const roomRef = doc(db, "rooms", room.id);
            await updateDoc(roomRef, {
                available: !room.available
            });
        } catch (error) {
            console.error("Error updating availability:", error);
            alert("Failed to update availability");
        }
    };

    if (loadingProfile) return <div className="p-10 text-center">Loading profile...</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-blue-600">Admin Dashboard</h1>
                    <a href="/" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                        ← Home
                    </a>
                </div>
                <div className="flex items-center gap-4">
                    {messProfile && <span className="font-semibold">{messProfile.name}</span>}
                    <button onClick={handleLogout} className="text-red-500 hover:text-red-700">Logout</button>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto p-6">
                {/* Mess Profile Section */}
                {!messProfile || isEditingMess ? (
                    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">{isEditingMess ? 'Edit Mess Profile' : 'Create Mess Profile'}</h2>
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
                                <label className="block text-sm font-medium mb-1">Mess Poster {isEditingMess && '(Leave empty to keep current)'}</label>
                                <input
                                    type="file"
                                    onChange={(e) => setPosterFile(e.target.files[0])}
                                    className="w-full"
                                    accept="image/*"
                                />
                                {isEditingMess && messProfile?.posterUrl && (
                                    <div className="mt-2">
                                        <p className="text-xs text-gray-500 mb-1">Current Poster:</p>
                                        <img src={messProfile.posterUrl} alt="Current Poster" className="h-20 w-auto rounded border" />
                                    </div>
                                )}
                            </div>
                            <button type="submit" disabled={uploading} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                                {uploading ? 'Saving...' : (isEditingMess ? 'Update Profile' : 'Create Profile')}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="bg-white p-6 rounded-lg shadow-md mb-8 flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">{messProfile.name}</h2>
                            <p className="text-gray-600">{messProfile.address}</p>
                            <p className="text-gray-600">{messProfile.contact}</p>
                        </div>
                        <button
                            onClick={handleEditMessClick}
                            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                        >
                            <Pencil size={18} /> Edit Profile
                        </button>
                    </div>
                )}

                {/* Room Management Section */}
                {messProfile && !isEditingMess && (
                    <>
                        <div className="bg-white p-6 rounded-lg shadow-md mb-8 border-t-4 border-blue-500">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold">{editingRoomId ? 'Edit Room' : 'Add New Room'}</h2>
                                {editingRoomId && (
                                    <button onClick={handleCancelEditRoom} className="text-gray-500 hover:text-gray-700 flex items-center gap-1">
                                        <X size={18} /> Cancel Edit
                                    </button>
                                )}
                            </div>

                            <form onSubmit={handleRoomSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="text" placeholder="Room Number (e.g. 101)" className="p-2 border rounded"
                                        value={formData.roomNumber} onChange={e => setFormData({ ...formData, roomNumber: e.target.value })} required />
                                    <input type="number" placeholder="Rent (₹)" className="p-2 border rounded"
                                        value={formData.rent} onChange={e => setFormData({ ...formData, rent: e.target.value })} required />
                                    <input type="number" placeholder="Beds" className="p-2 border rounded"
                                        value={formData.beds} onChange={e => setFormData({ ...formData, beds: e.target.value })} required />
                                    <input type="number" placeholder="Bathrooms" className="p-2 border rounded"
                                        value={formData.bathrooms} onChange={e => setFormData({ ...formData, bathrooms: e.target.value })} required />
                                </div>
                                <input type="text" placeholder="Location / Address" className="w-full p-2 border rounded"
                                    value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} required />
                                <input type="number" placeholder="Advance Deposit (₹)" className="w-full p-2 border rounded"
                                    value={formData.advanceDeposit} onChange={e => setFormData({ ...formData, advanceDeposit: e.target.value })} />

                                <div className="flex flex-wrap gap-4">
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" checked={formData.food} onChange={e => setFormData({ ...formData, food: e.target.checked })} /> Food
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" checked={formData.waterFilter} onChange={e => setFormData({ ...formData, waterFilter: e.target.checked })} /> Water Filter
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" checked={formData.tableChair} onChange={e => setFormData({ ...formData, tableChair: e.target.checked })} /> Table/Chair
                                    </label>
                                    <label className="flex items-center gap-2 font-medium text-green-600">
                                        <input type="checkbox" checked={formData.available} onChange={e => setFormData({ ...formData, available: e.target.checked })} /> Available for Rent
                                    </label>
                                </div>

                                <textarea placeholder="Other Information" className="w-full p-2 border rounded"
                                    value={formData.otherInfo} onChange={e => setFormData({ ...formData, otherInfo: e.target.value })} />

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

                                <button type="submit" disabled={uploading} className={`w-full text-white py-2 rounded hover:opacity-90 transition-opacity ${editingRoomId ? 'bg-orange-500' : 'bg-blue-600'}`}>
                                    {uploading ? 'Saving...' : (editingRoomId ? 'Update Room' : 'Add Room')}
                                </button>
                            </form>
                        </div>

                        <h2 className="text-2xl font-bold mb-4">Your Rooms</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {rooms.map(room => (
                                <div key={room.id} className={`relative group ${editingRoomId === room.id ? 'ring-2 ring-orange-500 rounded-xl' : ''}`}>
                                    <RoomCard room={room} />
                                    <div className="absolute top-2 right-2 flex gap-2">
                                        <button
                                            onClick={() => toggleAvailability(room)}
                                            className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm transition-colors ${room.available
                                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                                }`}
                                        >
                                            {room.available ? 'Available' : 'Booked'}
                                        </button>
                                        <button
                                            onClick={() => handleEditRoomClick(room)}
                                            className="bg-white text-orange-500 p-1.5 rounded-full hover:bg-orange-50 shadow-sm border border-gray-100"
                                            title="Edit Room"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(room.id)}
                                            className="bg-white text-red-500 p-1.5 rounded-full hover:bg-red-50 shadow-sm border border-gray-100"
                                            title="Delete Room"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
