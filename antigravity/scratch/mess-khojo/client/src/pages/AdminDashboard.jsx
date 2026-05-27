import React, { useState } from 'react';
import { auth, storage } from '../firebase';
import { signOut } from 'firebase/auth';
import { serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import RoomCard from '../components/RoomCard';
import { Pencil, Trash2, X } from 'lucide-react';
import MultiSelectDropdown from '../components/MultiSelectDropdown';
import imageCompression from 'browser-image-compression';
const MapPicker = React.lazy(() => import('../components/MapPicker'));
import { updateMess, addMess, addRoom, updateRoom, deleteRoom } from '../services/messService';
import { updateBookingStatus } from '../services/bookingService';
import { useAdminData } from './AdminDashboard/hooks/useAdminData';
import MessProfileTab from './AdminDashboard/tabs/MessProfileTab';
import RoomManagementTab from './AdminDashboard/tabs/RoomManagementTab';
import BookingsOverviewTab from './AdminDashboard/tabs/BookingsOverviewTab';


const AdminDashboard = () => {
    const adminData = useAdminData();
    const { user, messProfile, rooms, setRooms, bookings, loadingProfile, setMessProfile } = adminData;


    const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    // Image compression helper
    const compressImage = async (file) => {
        const options = {
            maxSizeMB: 0.5, // 500KB
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            fileType: 'image/jpeg'
        };
        try {
            const compressedFile = await imageCompression(file, options);
            return compressedFile;
        } catch (error) {
            console.error('Compression error:', error);
            return file; // Return original if compression fails
        }
    };

    // Mess Profile Form State
    const [messForm, setMessForm] = useState({
        name: '',
        district: 'balasore', // Default for legacy/new
        address: '',
        contact: '',
        locationUrl: '',
        messType: 'Boys',
        managedBy: 'Owner',
        facilities: [],
        includedInRent: [],
        extraAppliances: '',
        foodFacility: '',
        security: '',
        advanceDeposit: '',
        advancePayment: { type: 'None', customAmount: '' },
        maintenanceCharge: { taken: false, amount: '', frequency: 'Per Year' },
        isUserSourced: false,
        lastUpdatedDate: '',
        amenities: {
            food: false,
            wifi: false,
            inverter: false
        },
        description: '',
        rentCycle: 'monthly',
        minStayDuration: 1
    });
    const [posterFile, setPosterFile] = useState(null);
    const [galleryFiles, setGalleryFiles] = useState([]);
    const [isEditingMess, setIsEditingMess] = useState(false);

    const removeGalleryImage = async (imageUrlToRemove) => {
        if (!messProfile) return;
        try {
            const updatedUrls = (messProfile.galleryUrls || []).filter(url => url !== imageUrlToRemove);
            await updateMess(messProfile.id, {
                galleryUrls: updatedUrls
            });
            setMessProfile(prev => ({ ...prev, galleryUrls: updatedUrls }));
        } catch (error) {
            console.error("Error removing gallery image:", error);
            alert("Failed to remove gallery image");
        }
    };
    const [geocoding, setGeocoding] = useState(false);
    const [showMapPicker, setShowMapPicker] = useState(false);

    // Map Picker Handler
    const handleMapConfirm = (location) => {
        setMessForm(prev => ({
            ...prev,
            latitude: location.lat,
            longitude: location.lng,
            // Only update address if it's empty or user wants to (here we just update it)
            address: location.address || prev.address
        }));
        setShowMapPicker(false);
    };

    // Room Form State
    const [formData, setFormData] = useState({
        occupancy: 'Double', // Single, Double, Triple, Four, Five, Six
        category: '', // Standard, Deluxe, AC, etc.
        totalInventory: 1,
        price: '',
        amenities: {
            ac: false,
            attachedBathroom: false
        },
        otherInfo: '',
        availableCount: 0 // Number of beds/seats available
    });
    const [imageFiles, setImageFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [editingRoomId, setEditingRoomId] = useState(null);

    // Booking State
    const [bookingRemarks, setBookingRemarks] = useState({}); // { bookingId: remarkText }
    const [bookingActionLoading, setBookingActionLoading] = useState({}); // { bookingId: true }

    const navigate = useNavigate();


    const handleLogout = async () => {
        await signOut(auth);
        navigate('/admin/login');
    };

    // Geocoding function to convert address to lat/lng using Google Maps
    const handleGeocode = async () => {
        if (!messForm.address) {
            alert("Please enter an address first");
            return;
        }

        setGeocoding(true);
        try {
            const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(messForm.address)}&key=${GOOGLE_MAPS_API_KEY}`
            );
            const data = await response.json();

            if (data.status === 'OK' && data.results && data.results.length > 0) {
                const { lat, lng } = data.results[0].geometry.location;
                setMessForm(prev => ({
                    ...prev,
                    latitude: parseFloat(lat),
                    longitude: parseFloat(lng)
                }));
                showToast(`✓ Coordinates found: ${parseFloat(lat).toFixed(5)}, ${parseFloat(lng).toFixed(5)}`);
            } else {
                showToast('Could not find coordinates. Try a more specific address or pick on map.', 'error');
            }
        } catch (error) {
            console.error("Geocoding error:", error);
            showToast('Geocoding failed. Please enter coordinates manually.', 'error');
        } finally {
            setGeocoding(false);
        }
    };

    // Extract coordinates from Google Maps URL
    const extractCoordsFromMapsUrl = (url) => {
        if (!url) return null;

        // Pattern 1: @lat,lng format (most common)
        // Example: https://maps.google.com/?q=22.3193,87.3103 or https://www.google.com/maps/@22.3193,87.3103,15z
        const atPattern = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
        const atMatch = url.match(atPattern);
        if (atMatch) {
            return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
        }

        // Pattern 2: q=lat,lng format
        // Example: https://maps.google.com/?q=22.3193,87.3103
        const qPattern = /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/;
        const qMatch = url.match(qPattern);
        if (qMatch) {
            return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
        }

        // Pattern 3: place/ coordinates
        // Example: https://www.google.com/maps/place/22.3193,87.3103
        const placePattern = /\/place\/(-?\d+\.\d+),(-?\d+\.\d+)/;
        const placeMatch = url.match(placePattern);
        if (placeMatch) {
            return { lat: parseFloat(placeMatch[1]), lng: parseFloat(placeMatch[2]) };
        }

        return null;
    };

    // Handle Google Maps URL change and auto-extract coordinates
    const handleLocationUrlChange = (url) => {
        setMessForm({ ...messForm, locationUrl: url });

        // Check if it's a shortened URL
        if (url.includes('goo.gl') || url.includes('maps.app.goo.gl')) {
            alert('⚠️ Shortened URL detected!\n\nTo get coordinates:\n1. Open this link in your browser\n2. Once Google Maps opens, copy the URL from the address bar\n3. Paste that full URL here\n\nOr use the "Auto-fill Coordinates" button below instead!');
            return;
        }

        const coords = extractCoordsFromMapsUrl(url);
        if (coords) {
            setMessForm(prev => ({
                ...prev,
                locationUrl: url,
                latitude: coords.lat,
                longitude: coords.lng
            }));
            showToast(`✓ Coordinates extracted: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`);
        }
    };

    const handleMessSubmit = async (e) => {
        e.preventDefault();
        if (!messForm.name || !messForm.address || !messForm.contact) {
            showToast('Please fill all mess details', 'error');
            return;
        }

        setUploading(true);
        try {
            let posterUrl = messProfile?.posterUrl || "";
            if (posterFile) {
                const compressedFile = await compressImage(posterFile);
                const storageRef = ref(storage, `posters/${Date.now()}_${posterFile.name}`);
                const snapshot = await uploadBytes(storageRef, compressedFile);
                posterUrl = await getDownloadURL(snapshot.ref);
            }

            let downloadURLs = messProfile?.galleryUrls ? [...messProfile.galleryUrls] : [];
            if (galleryFiles.length > 0) {
                const uploadPromises = Array.from(galleryFiles).map(async (file) => {
                    const compressedFile = await compressImage(file);
                    const storageRef = ref(storage, `gallery/${Date.now()}_${file.name}`);
                    const snapshot = await uploadBytes(storageRef, compressedFile);
                    return getDownloadURL(snapshot.ref);
                });
                const newUrls = await Promise.all(uploadPromises);
                downloadURLs = [...downloadURLs, ...newUrls];
            }

            if (downloadURLs.length > 15) {
                showToast(`Too many images (${downloadURLs.length}/15). Please remove some first.`, 'error');
                setUploading(false);
                return;
            }

            // Derive amenities from facilities for backward compat
            const derivedAmenities = {
                food: messForm.facilities.includes('Food Facility'),
                wifi: messForm.facilities.includes('Wifi'),
                inverter: messForm.facilities.includes('InverterPower'),
            };

            const adv = messForm.advancePayment;
            const maint = messForm.maintenanceCharge;
            let derivedDeposit = '';
            if (adv && adv.type && adv.type !== 'None') {
                derivedDeposit = adv.type === 'Custom Amount' ? `₹${adv.customAmount}` : adv.type;
            }
            if (maint && maint.taken && maint.amount) {
                const maintStr = ` + ₹${maint.amount} maintenance (${maint.frequency || 'Per Year'})`;
                derivedDeposit = derivedDeposit ? `${derivedDeposit}${maintStr}` : `₹${maint.amount} maintenance (${maint.frequency || 'Per Year'})`;
            }

            const saveData = {
                ...messForm,
                advanceDeposit: derivedDeposit,
                amenities: derivedAmenities,
                latitude: messForm.latitude ? Number(messForm.latitude) : null,
                longitude: messForm.longitude ? Number(messForm.longitude) : null,
                posterUrl,
                galleryUrls: downloadURLs,
                isUserSourced: messForm.isUserSourced || false,
                lastUpdatedDate: messForm.isUserSourced ? messForm.lastUpdatedDate : null,
                // Only mark verified if not user-sourced
                isVerified: !messForm.isUserSourced,
            };

            if (isEditingMess && messProfile) {
                // Preserve the district set by the operator — partners cannot change it
                delete saveData.district;
                await updateMess(messProfile.id, saveData);
                setIsEditingMess(false);
                showToast('✅ Mess Profile updated successfully!');
            } else {
                // Create new profile
                const docRef = await addMess({
                    ...saveData,
                    adminId: user.uid,
                    createdAt: new Date()
                });
                setMessProfile({ id: docRef.id, ...saveData, adminId: user.uid });
                showToast('✅ Mess Profile created successfully!');
            }
        } catch (error) {
            console.error("Error saving mess profile:", error);
            showToast(`❌ Error saving mess profile: ${error.message}`, 'error');
        } finally {
            setUploading(false);
            setPosterFile(null);
            setGalleryFiles([]);
        }
    };

    const handleEditMessClick = () => {
        setMessForm({
            name: messProfile.name,
            district: messProfile.district || 'balasore', // Kept in state but NOT editable by admin
            address: messProfile.address,
            contact: messProfile.contact,
            locationUrl: messProfile.locationUrl || '',
            latitude: messProfile.latitude || '',
            longitude: messProfile.longitude || '',
            messType: messProfile.messType || 'Boys',
            managedBy: messProfile.managedBy || 'Owner',
            facilities: messProfile.facilities || [],
            includedInRent: messProfile.includedInRent || [],
            extraAppliances: messProfile.extraAppliances || '',
            foodFacility: messProfile.foodFacility || '',
            security: messProfile.security || '',
            advanceDeposit: messProfile.advanceDeposit || '',
            advancePayment: messProfile.advancePayment || { type: 'None', customAmount: '' },
            maintenanceCharge: messProfile.maintenanceCharge || { taken: false, amount: '', frequency: 'Per Year' },
            isUserSourced: messProfile.isUserSourced || false,
            lastUpdatedDate: messProfile.lastUpdatedDate || '',
            amenities: messProfile.amenities || {
                food: false,
                wifi: false,
                inverter: false
            },
            description: messProfile.description || '',
            rentCycle: messProfile.rentCycle || 'monthly',
            minStayDuration: messProfile.minStayDuration || 1
        });
        setIsEditingMess(true);
    };

    const handleCancelEditMess = () => {
        setIsEditingMess(false);
        setMessForm({
            name: '', district: 'balasore', address: '', contact: '', locationUrl: '',
            latitude: '', longitude: '',
            messType: 'Boys',
            managedBy: 'Owner', facilities: [], includedInRent: [],
            extraAppliances: '', foodFacility: '', security: '', advanceDeposit: '',
            advancePayment: { type: 'None', customAmount: '' },
            maintenanceCharge: { taken: false, amount: '', frequency: 'Per Year' },
            isUserSourced: false, lastUpdatedDate: '',
            amenities: { food: false, wifi: false, inverter: false },
            description: '',
            rentCycle: 'monthly',
            minStayDuration: 1
        });
        setPosterFile(null);
        setGalleryFiles([]);
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

            // Upload new images with compression
            if (imageFiles.length > 0) {
                const uploadPromises = Array.from(imageFiles).map(async (file) => {
                    // Compress each image
                    const compressedFile = await compressImage(file);
                    const storageRef = ref(storage, `rooms/${Date.now()}_${file.name}`);
                    const snapshot = await uploadBytes(storageRef, compressedFile);
                    return getDownloadURL(snapshot.ref);
                });
                const newUrls = await Promise.all(uploadPromises);
                downloadURLs = [...downloadURLs, ...newUrls];
            }

            // Use default placeholder if no images provided
            if (downloadURLs.length === 0) {
                downloadURLs = ["/default-room.jpg"];
            }

            // Limit to 5 images total
            if (downloadURLs.length > 5) {
                alert(`You have ${downloadURLs.length} images. Maximum allowed is 5. Please remove some.`);
                setUploading(false);
                return;
            }

            const roomData = {
                ...formData,
                imageUrls: downloadURLs,
                imageUrl: downloadURLs[0] || "", // Backward compat
                messId: messProfile.id,
                messName: messProfile.name,
                district: messProfile.district || 'balasore',
                updatedAt: new Date(),
                rentCycle: messProfile.rentCycle || 'monthly',
                minStayDuration: messProfile.minStayDuration || 1
            };

            if (editingRoomId) {
                await updateRoom(editingRoomId, roomData);
                showToast('✅ Room updated successfully!');
            } else {
                await addRoom({
                    ...roomData,
                    createdAt: new Date()
                });
                showToast('✅ Room added successfully!');
            }

            // Reset form
            setFormData({
                occupancy: '1',
                category: '',
                totalInventory: 1,
                price: '',
                amenities: {
                    ac: false,
                    attachedBathroom: false
                },
                otherInfo: '',
                availableCount: 0
            });
            setImageFiles([]);
            setEditingRoomId(null);
        } catch (error) {
            console.error("Error saving room: ", error);
            showToast(`❌ Error saving room: ${error.message}`, 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleEditRoomClick = (room) => {
        setEditingRoomId(room.id);
        setFormData({
            occupancy: room.occupancy || '1',
            category: room.category || '',
            totalInventory: room.totalInventory || 1,
            price: room.price || room.rent || '', // Fallback for old data
            amenities: room.amenities || {
                ac: room.ac || false,
                attachedBathroom: room.attachedBathroom || false
            },
            otherInfo: room.otherInfo || '',
            availableCount: room.availableCount !== undefined ? room.availableCount : (room.available ? 1 : 0)
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEditRoom = () => {
        setEditingRoomId(null);
        setFormData({
            occupancy: '1',
            category: '',
            totalInventory: 1,
            price: '',
            amenities: {
                ac: false,
                attachedBathroom: false
            },
            otherInfo: '',
            availableCount: 0
        });
        setImageFiles([]);
    };

    const removeImage = async (imageUrlToRemove) => {
        if (!editingRoomId) return;

        try {
            const room = rooms.find(r => r.id === editingRoomId);
            const updatedUrls = (room.imageUrls || [room.imageUrl]).filter(url => url !== imageUrlToRemove);

            await updateRoom(editingRoomId, {
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

    const handleUpdateBookingStatus = async (bookingId, newStatus) => {
        setBookingActionLoading(prev => ({ ...prev, [bookingId]: true }));
        try {
            const remark = bookingRemarks[bookingId] || "";
            await updateBookingStatus(bookingId, {
                status: newStatus,
                remark: remark,
                respondedAt: serverTimestamp()
            });
            // Clear remark after action
            setBookingRemarks(prev => {
                const updated = { ...prev };
                delete updated[bookingId];
                return updated;
            });
            showToast(newStatus === 'confirmed' ? '✅ Booking confirmed' : '❌ Booking rejected');
        } catch (error) {
            console.error("Error updating booking:", error);
            showToast('Failed to update booking status', 'error');
        } finally {
            setBookingActionLoading(prev => {
                const updated = { ...prev };
                delete updated[bookingId];
                return updated;
            });
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this room?")) {
            try {
                await deleteRoom(id);
            } catch (error) {
                console.error("Error deleting room:", error);
            }
        }
    };



    if (loadingProfile) return <div className="p-10 text-center">Loading profile...</div>;

    return (
        <div className="min-h-screen bg-brand-secondary">
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] px-6 py-3.5 rounded-2xl shadow-2xl text-white font-semibold text-sm flex items-center gap-2 transition-all animate-bounce-in ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
                    {toast.message}
                </div>
            )}

            <nav className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-brand-primary">Admin Dashboard</h1>
                    <a href="/" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                        ← Home
                    </a>
                </div>
                <div className="flex items-center gap-4">
                    {messProfile && <span className="font-semibold text-brand-text-dark">{messProfile.name}</span>}
                    <button onClick={handleLogout} className="text-brand-red hover:text-red-700 font-medium transition-colors">Logout</button>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto p-6">
                {/* Mess Profile Section */}
                <MessProfileTab 
                    messProfile={messProfile}
                    messForm={messForm}
                    setMessForm={setMessForm}
                    posterFile={posterFile}
                    setPosterFile={setPosterFile}
                    galleryFiles={galleryFiles}
                    setGalleryFiles={setGalleryFiles}
                    isEditingMess={isEditingMess}
                    uploading={uploading}
                    handleMessSubmit={handleMessSubmit}
                    handleEditMessClick={handleEditMessClick}
                    handleCancelEditMess={handleCancelEditMess}
                    removeGalleryImage={removeGalleryImage}
                    geocoding={geocoding}
                    handleGeocode={handleGeocode}
                    setShowMapPicker={setShowMapPicker}
                    handleLocationUrlChange={handleLocationUrlChange}
                />

                {/* Room Management Section */}
                {messProfile && !isEditingMess && (
                    <>
                        <RoomManagementTab 
                            rooms={rooms}
                            formData={formData}
                            setFormData={setFormData}
                            editingRoomId={editingRoomId}
                            imageFiles={imageFiles}
                            setImageFiles={setImageFiles}
                            uploading={uploading}
                            handleRoomSubmit={handleRoomSubmit}
                            handleEditRoomClick={handleEditRoomClick}
                            handleCancelEditRoom={handleCancelEditRoom}
                            removeImage={removeImage}
                            handleDelete={handleDelete}
                            messProfile={messProfile}
                        />

                        <BookingsOverviewTab 
                            bookings={bookings}
                            bookingRemarks={bookingRemarks}
                            setBookingRemarks={setBookingRemarks}
                            bookingActionLoading={bookingActionLoading}
                            handleUpdateBookingStatus={handleUpdateBookingStatus}
                        />
                    </>
                )}
            </div>
            {/* Map Picker Modal */}
            {
                showMapPicker && (
                    <div className="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-4xl h-[80vh] rounded-3xl overflow-hidden shadow-2xl relative flex flex-col">
                            <React.Suspense fallback={
                                <div className="w-full h-full flex flex-col items-center justify-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-primary border-t-transparent mb-4"></div>
                                    <p className="text-brand-text-dark font-bold text-lg">Loading Map Picker...</p>
                                </div>
                            }>
                                <MapPicker
                                    onConfirm={handleMapConfirm}
                                    onCancel={() => setShowMapPicker(false)}
                                    initialLocation={
                                        messForm.latitude && messForm.longitude
                                            ? { lat: parseFloat(messForm.latitude), lng: parseFloat(messForm.longitude), address: messForm.address }
                                            : null
                                    }
                                />
                            </React.Suspense>
                        </div>
                    </div>
                )
            }
        </div >
    );
};
export default AdminDashboard;
