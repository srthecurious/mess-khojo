import React, { useState, useEffect } from 'react';
import { auth, db, storage } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, addDoc, getDocs, deleteDoc, updateDoc, doc, onSnapshot, query, where, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import RoomCard from '../components/RoomCard';
import { Pencil, Trash2, X } from 'lucide-react';
import MultiSelectDropdown from '../components/MultiSelectDropdown';
import imageCompression from 'browser-image-compression';
import MapPicker from '../components/MapPicker';

const AdminDashboard = () => {
    const [user, setUser] = useState(null);
    const [messProfile, setMessProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);

    // Image compression helper
    const compressImage = async (file) => {
        const options = {
            maxSizeMB: 0.5, // 500KB
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            fileType: 'image/jpeg'
        };
        try {
            console.log(`Original file size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
            const compressedFile = await imageCompression(file, options);
            console.log(`Compressed file size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
            return compressedFile;
        } catch (error) {
            console.error('Compression error:', error);
            return file; // Return original if compression fails
        }
    };

    // Mess Profile Form State
    const [messForm, setMessForm] = useState({
        name: '',
        address: '',
        contact: '',
        locationUrl: '',
        messType: 'Boys', // Default
        extraAppliances: '',
        foodFacility: '',
        security: '',
        advanceDeposit: '',
        isUserSourced: false,
        lastUpdatedDate: '',
        amenities: {
            food: false,
            wifi: false,
            inverter: false
        }
    });
    const [posterFile, setPosterFile] = useState(null);
    const [isEditingMess, setIsEditingMess] = useState(false);
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
    const [rooms, setRooms] = useState([]);
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
    const [bookings, setBookings] = useState([]);
    const [bookingRemarks, setBookingRemarks] = useState({}); // { bookingId: remarkText }

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

    // Security Check: Ensure user is NOT a student
    useEffect(() => {
        const checkRole = async () => {
            if (user) {
                const userDoc = await getDocs(query(collection(db, "users"), where("__name__", "==", user.uid)));
                if (!userDoc.empty) {
                    alert("Access Denied: Student accounts cannot access the Partner Dashboard.");
                    await signOut(auth);
                    navigate('/');
                }
            }
        };
        checkRole();
    }, [user, navigate]);

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

    // Listen for Bookings
    useEffect(() => {
        if (!messProfile) return;

        const q = query(collection(db, "bookings"), where("messId", "==", messProfile.id));
        const unsubscribeBookings = onSnapshot(q, (snapshot) => {
            const bookingsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Sort by Date (Newest First)
            bookingsData.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
            setBookings(bookingsData);
        });

        return () => unsubscribeBookings();
    }, [messProfile]);

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
                setMessForm({
                    ...messForm,
                    latitude: parseFloat(lat),
                    longitude: parseFloat(lng)
                });
                alert(`Coordinates found!\nLatitude: ${lat}\nLongitude: ${lng}`);
            } else {
                alert("Could not find coordinates for this address. Please try a more specific address or enter coordinates manually.");
            }
        } catch (error) {
            console.error("Geocoding error:", error);
            alert("Error geocoding address. Please enter coordinates manually.");
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
            // Show success feedback
            setTimeout(() => {
                alert(`✓ Coordinates extracted from URL!\nLatitude: ${coords.lat}\nLongitude: ${coords.lng}`);
            }, 100);
        }
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
                // Compress image before upload
                const compressedFile = await compressImage(posterFile);
                const storageRef = ref(storage, `posters/${Date.now()}_${posterFile.name}`);
                const snapshot = await uploadBytes(storageRef, compressedFile);
                posterUrl = await getDownloadURL(snapshot.ref);
            }

            if (isEditingMess && messProfile) {
                // Update existing profile
                const messRef = doc(db, "messes", messProfile.id);
                await updateDoc(messRef, {
                    ...messForm,
                    latitude: messForm.latitude ? Number(messForm.latitude) : null,
                    longitude: messForm.longitude ? Number(messForm.longitude) : null,
                    posterUrl,
                    isUserSourced: messForm.isUserSourced || false,
                    lastUpdatedDate: messForm.isUserSourced ? messForm.lastUpdatedDate : null
                });
                setMessProfile({ ...messProfile, ...messForm, posterUrl });
                setIsEditingMess(false);
                alert("Mess Profile updated successfully!");
            } else {
                // Create new profile
                const docRef = await addDoc(collection(db, "messes"), {
                    ...messForm,
                    latitude: messForm.latitude ? Number(messForm.latitude) : null,
                    longitude: messForm.longitude ? Number(messForm.longitude) : null,
                    posterUrl,
                    isUserSourced: messForm.isUserSourced || false,
                    lastUpdatedDate: messForm.isUserSourced ? messForm.lastUpdatedDate : null,
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
            contact: messProfile.contact,
            locationUrl: messProfile.locationUrl || '',
            latitude: messProfile.latitude || '',
            longitude: messProfile.longitude || '',
            messType: messProfile.messType || 'Boys',
            extraAppliances: messProfile.extraAppliances || '',
            foodFacility: messProfile.foodFacility || '',
            security: messProfile.security || '',
            advanceDeposit: messProfile.advanceDeposit || '',
            isUserSourced: messProfile.isUserSourced || false,
            lastUpdatedDate: messProfile.lastUpdatedDate || '',
            amenities: messProfile.amenities || {
                food: false,
                wifi: false,
                inverter: false
            }
        });
        setIsEditingMess(true);
    };

    const handleCancelEditMess = () => {
        setIsEditingMess(false);
        setMessForm({
            name: '', address: '', contact: '', locationUrl: '', messType: 'Boys',
            extraAppliances: '', foodFacility: '', security: '', advanceDeposit: '',
            isUserSourced: false, lastUpdatedDate: '',
            amenities: { food: false, wifi: false, inverter: false }
        });
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
            } else if (!editingRoomId && imageFiles.length === 0) {
                alert("Please select at least one image for a new room type");
                setUploading(false);
                return;
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
                updatedAt: new Date()
            };

            if (editingRoomId) {
                await updateDoc(doc(db, "rooms", editingRoomId), roomData);
                alert("Room Type updated successfully!");
            } else {
                await addDoc(collection(db, "rooms"), {
                    ...roomData,
                    createdAt: new Date()
                });
                alert("Room Type added successfully!");
            }

            // Reset form
            setFormData({
                occupancy: 'Double',
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
            alert(`Error saving room: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleEditRoomClick = (room) => {
        setEditingRoomId(room.id);
        setFormData({
            occupancy: room.occupancy || 'Double',
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
            occupancy: 'Double',
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

    const handleUpdateBookingStatus = async (bookingId, newStatus) => {
        try {
            const remark = bookingRemarks[bookingId] || "";
            await updateDoc(doc(db, "bookings", bookingId), {
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
        } catch (error) {
            console.error("Error updating booking:", error);
            alert("Failed to update booking status");
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



    if (loadingProfile) return <div className="p-10 text-center">Loading profile...</div>;

    return (
        <div className="min-h-screen bg-brand-secondary">
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
                {!messProfile || isEditingMess ? (
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Advance Deposit Policy</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 1 Month Rent"
                                        className="w-full p-2 border rounded"
                                        value={messForm.advanceDeposit}
                                        onChange={(e) => setMessForm({ ...messForm, advanceDeposit: e.target.value })}
                                    />
                                </div>
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
                                        value={messForm.security}
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
                                    <div className="mt-2">
                                        <p className="text-xs text-gray-500 mb-1">Current Poster:</p>
                                        <img src={messProfile.posterUrl} alt="Current Poster" className="h-20 w-auto rounded border" />
                                    </div>
                                )}
                            </div>
                            <button type="submit" disabled={uploading} className="w-full bg-brand-primary text-white py-2 rounded hover:bg-brand-primary-hover shadow-md transition-all">
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
                                            <option value="Single">Single Seater</option>
                                            <option value="Double">Double Seater</option>
                                            <option value="Triple">Triple Seater</option>
                                            <option value="Four">Four Seater</option>
                                            <option value="Five">Five Seater</option>
                                            <option value="Six">Six Seater</option>
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
                                        <label className="block text-sm font-medium mb-1">Price per Student (₹/month)</label>
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

                        {/* Booking Requests Section */}
                        <div className="mt-12 mb-8 border-t border-brand-light-gray pt-8">
                            <h2 className="text-2xl font-bold mb-6 text-brand-text-dark flex items-center gap-3">
                                Booking Requests
                                {bookings.filter(b => b.status === 'pending').length > 0 && (
                                    <span className="text-sm font-normal bg-brand-primary text-white px-3 py-1 rounded-full">
                                        {bookings.filter(b => b.status === 'pending').length} New
                                    </span>
                                )}
                            </h2>

                            {bookings.length === 0 ? (
                                <div className="bg-white p-8 rounded-xl text-center border-2 border-dashed border-gray-200 text-gray-400">
                                    <p>No booking requests yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {bookings.map(booking => (
                                        <div key={booking.id} className="bg-white p-5 rounded-xl shadow-sm border border-brand-light-gray flex flex-col md:flex-row justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="font-bold text-lg text-brand-text-dark">{booking.userName || 'Unknown User'}</h3>
                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                        booking.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                            'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        {booking.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-2">📞 {booking.userPhone}</p>
                                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                                    <span>🛏️ {booking.roomType} Room</span>
                                                    <span>💰 ₹{booking.price}/mo</span>
                                                    <span>📅 {booking.createdAt ? new Date(booking.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</span>
                                                </div>
                                            </div>

                                            {booking.status === 'pending' && (
                                                <div className="flex flex-col gap-2 min-w-[200px]">
                                                    <textarea
                                                        placeholder="Remark (optional)"
                                                        value={bookingRemarks[booking.id] || ''}
                                                        onChange={(e) => setBookingRemarks(prev => ({ ...prev, [booking.id]: e.target.value }))}
                                                        className="w-full px-3 py-1.5 border border-brand-light-gray rounded-lg text-sm focus:ring-1 focus:ring-brand-primary outline-none resize-none h-16"
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                                                            className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium shadow-sm transition-colors text-sm"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateBookingStatus(booking.id, 'rejected')}
                                                            className="flex-1 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-colors text-sm"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {booking.status !== 'pending' && booking.remark && (
                                                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs text-gray-500 italic md:max-w-xs">
                                                    Remark: {booking.remark}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
            {/* Map Picker Modal */}
            {showMapPicker && (
                <div className="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-4xl h-[80vh] rounded-3xl overflow-hidden shadow-2xl relative flex flex-col">
                        <MapPicker
                            onConfirm={handleMapConfirm}
                            onCancel={() => setShowMapPicker(false)}
                            initialLocation={
                                messForm.latitude && messForm.longitude
                                    ? { lat: parseFloat(messForm.latitude), lng: parseFloat(messForm.longitude), address: messForm.address }
                                    : null
                            }
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
export default AdminDashboard;
