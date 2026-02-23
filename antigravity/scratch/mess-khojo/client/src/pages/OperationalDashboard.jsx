import React, { useState, useEffect } from 'react';
import { db, auth, secondaryAuth, storage } from '../firebase';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, query, onSnapshot, updateDoc, doc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Server, Users, Calendar, LogOut, CheckCircle, XCircle, UserPlus, Shield, Briefcase, ClipboardCheck, Trash2, Phone, Eye, EyeOff, Edit3, Search, Database, Layout, MapPin, MessageSquare, Reply, Building2, BedDouble } from 'lucide-react';
import MultiSelectDropdown from '../components/MultiSelectDropdown';
import { sendTelegramNotification, telegramTemplates } from '../utils/telegramNotifier';
import imageCompression from 'browser-image-compression';

const compressImage = async (file) => {
    const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'image/jpeg'
    };
    try {
        return await imageCompression(file, options);
    } catch (error) {
        console.error('Compression error:', error);
        return file;
    }
};

const OperationalDashboard = () => {
    const [activeTab, setActiveTab] = useState('bookings'); // 'bookings', 'partners', 'claims', 'inquiries', 'feedbacks', 'messes', 'rooms'
    const [bookings, setBookings] = useState([]);
    const [claims, setClaims] = useState([]);
    const [inquiries, setInquiries] = useState([]);
    const [roomInquiries, setRoomInquiries] = useState([]);
    const [feedbacks, setFeedbacks] = useState([]);
    const [feedbackReplies, setFeedbackReplies] = useState({}); // { feedbackId: replyText }
    const [registrations, setRegistrations] = useState([]);
    const [messes, setMesses] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [bookingRemarks, setBookingRemarks] = useState({}); // { bookingId: remarkText }
    const [searchQuery, setSearchQuery] = useState('');

    // Editing State
    const [editingItem, setEditingItem] = useState(null); // For mess/room edit modal
    const [editForm, setEditForm] = useState(null);
    const [editImageFiles, setEditImageFiles] = useState([]);
    const [editGalleryFiles, setEditGalleryFiles] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [revealedIds, setRevealedIds] = useState({}); // { bookingId: true/false } to toggle phone visibility

    // Partner Creation State
    const [partnerEmail, setPartnerEmail] = useState('');
    const [partnerPassword, setPartnerPassword] = useState('');
    const [partnerStatus, setPartnerStatus] = useState({ type: '', msg: '' });

    const navigate = useNavigate();

    // Security Check
    // Security Check & Reactive Auth Listener
    // Security Check & Reactive Auth Listener
    useEffect(() => {
        const allowedEmail = import.meta.env.VITE_OP_EMAIL;

        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (!user || user.email !== allowedEmail) {
                // If user logs out or switches to a non-operator account in another tab
                navigate('/operational/login');
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    // Fetch ALL Bookings
    useEffect(() => {
        const q = query(collection(db, "bookings"));
        let isFirstLoad = true; // Prevent notifications on initial page load

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Sort by newest
            data.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);

            // Send notification for new pending bookings (skip first load)
            // Send notification logic moved to RoomDetails.jsx (Trigger on Action)
            /*
            if (!isFirstLoad) {
                const newPendingBookings = data.filter(booking =>
                    booking.status === 'pending' &&
                    !bookings.some(old => old.id === booking.id)
                );

                newPendingBookings.forEach(booking => {
                    sendTelegramNotification(telegramTemplates.newBooking(booking));
                });
            }
            */

            setBookings(data);
            isFirstLoad = false;
        });
        return () => unsubscribe();
    }, []);

    // Fetch ALL Claims
    useEffect(() => {
        const q = query(collection(db, "claims"));
        let isFirstLoad = true;

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            data.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);

            // Send notification for new pending claims
            // Send notification logic moved to MessDetails.jsx (Trigger on Action)
            /*
            if (!isFirstLoad) {
                const newPendingClaims = data.filter(claim =>
                    claim.status === 'pending' &&
                    !claims.some(old => old.id === claim.id)
                );

                newPendingClaims.forEach(claim => {
                    sendTelegramNotification(telegramTemplates.newClaim(claim));
                });
            }
            */

            setClaims(data);
            isFirstLoad = false;
        });
        return () => unsubscribe();
    }, []);

    // Fetch ALL Inquiries
    useEffect(() => {
        const q = query(collection(db, "inquiries"));
        let isFirstLoad = true;

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            data.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);

            // Send notification for new pending inquiries
            /*
            if (!isFirstLoad) {
                const newPendingInquiries = data.filter(inquiry =>
                    inquiry.status === 'pending' &&
                    !inquiries.some(old => old.id === inquiry.id)
                );

                newPendingInquiries.forEach(inquiry => {
                    sendTelegramNotification(telegramTemplates.newInquiry(inquiry));
                });
            }
            */

            setInquiries(data);
            isFirstLoad = false;
        });
        return () => unsubscribe();
    }, []);

    // Fetch ALL Room Inquiries (For "Find Your Room" Coming Soon)
    useEffect(() => {
        const q = query(collection(db, "room_inquiries"));
        let isFirstLoad = true;

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            data.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);

            // Send notification for new room inquiries
            /*
            if (!isFirstLoad) {
                const newInquiries = data.filter(inquiry =>
                    !roomInquiries.some(old => old.id === inquiry.id)
                );

                newInquiries.forEach(inquiry => {
                    sendTelegramNotification(telegramTemplates.newRoomInquiry(inquiry));
                });
            }
            */

            setRoomInquiries(data);
            isFirstLoad = false;
        });
        return () => unsubscribe();
    }, []);

    // Fetch ALL Feedbacks
    useEffect(() => {
        const q = query(collection(db, "feedbacks"));
        let isFirstLoad = true;

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            data.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);

            // Send notification for new pending feedbacks
            /*
            if (!isFirstLoad) {
                const newPendingFeedbacks = data.filter(feedback =>
                    feedback.status === 'pending' &&
                    !feedbacks.some(old => old.id === feedback.id)
                );

                newPendingFeedbacks.forEach(feedback => {
                    sendTelegramNotification(telegramTemplates.newFeedback(feedback));
                });
            }
            */

            setFeedbacks(data);
            isFirstLoad = false;
        });
        return () => unsubscribe();
    }, []);

    // Fetch ALL Mess Registrations
    useEffect(() => {
        const q = query(collection(db, "mess_registrations"));
        let isFirstLoad = true;

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            data.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);

            // Send notification for new pending registrations
            if (!isFirstLoad) {
                const newPendingRegistrations = data.filter(registration =>
                    registration.status === 'pending' &&
                    !registrations.some(old => old.id === registration.id)
                );

                newPendingRegistrations.forEach(registration => {
                    sendTelegramNotification(telegramTemplates.newRegistration(registration));
                });
            }

            setRegistrations(data);
            isFirstLoad = false;
        });
        return () => unsubscribe();
    }, []);

    // Fetch ALL Messes
    useEffect(() => {
        const q = query(collection(db, "messes"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            data.sort((a, b) => a.name.localeCompare(b.name));
            setMesses(data);
        });
        return () => unsubscribe();
    }, []);

    // Fetch ALL Rooms
    useEffect(() => {
        const q = query(collection(db, "rooms"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRooms(data);
        });
        return () => unsubscribe();
    }, []);

    const handleBookingAction = async (id, status) => {
        try {
            const remark = bookingRemarks[id] || "";
            await updateDoc(doc(db, "bookings", id), {
                status,
                remark,
                respondedAt: serverTimestamp()
            });
            // Clear remark for this booking after action
            setBookingRemarks(prev => {
                const updated = { ...prev };
                delete updated[id];
                return updated;
            });
        } catch (error) {
            console.error("Update failed:", error);
            alert("Action failed");
        }
    };

    const handleToggleVisibility = async (id, currentHidden) => {
        try {
            await updateDoc(doc(db, "messes", id), {
                hidden: !currentHidden
            });
        } catch (error) {
            console.error("Toggle visibility failed:", error);
            alert("Action failed");
        }
    };

    const handleEditItem = (item, type) => {
        setEditingItem({ type, id: item.id });
        if (type === 'mess') {
            setEditForm({
                name: item.name || '',
                address: item.address || '',
                contact: item.contact || '',
                locationUrl: item.locationUrl || '',
                messType: item.messType || 'Boys',
                extraAppliances: item.extraAppliances || '',
                foodFacility: item.foodFacility || '',
                security: item.security || '',
                advanceDeposit: item.advanceDeposit || '',
                isUserSourced: item.isUserSourced || false,
                lastUpdatedDate: item.lastUpdatedDate || '',
                hidden: item.hidden || false,
                hideContact: item.hideContact || false,
                posterUrl: item.posterUrl || '',
                galleryUrls: item.galleryUrls || [],
                amenities: item.amenities || { food: false, wifi: false, inverter: false },
                description: item.description || ''
            });
        } else {
            setEditForm({
                occupancy: item.occupancy || 'Double',
                category: item.category || '',
                price: item.price || '',
                availableCount: item.availableCount || 0,
                totalInventory: item.totalInventory || 1,
                otherInfo: item.otherInfo || '',
                amenities: item.amenities || { ac: false, attachedBathroom: false }
            });
        }
    };

    const removeGalleryImage = async (imageUrlToRemove) => {
        if (!editingItem || editingItem.type !== 'mess') return;
        try {
            const updatedUrls = (editForm.galleryUrls || []).filter(url => url !== imageUrlToRemove);
            await updateDoc(doc(db, "messes", editingItem.id), {
                galleryUrls: updatedUrls
            });
            setEditForm(prev => ({ ...prev, galleryUrls: updatedUrls }));
        } catch (error) {
            console.error("Error removing image:", error);
            alert("Failed to remove gallery image");
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingItem.type === 'mess') {
                let posterUrl = editForm.posterUrl;
                if (editImageFiles.length > 0) {
                    const file = editImageFiles[0];
                    const compressedFile = await compressImage(file);
                    const storageRef = ref(storage, `posters/${Date.now()}_${file.name}`);
                    const snapshot = await uploadBytes(storageRef, compressedFile);
                    posterUrl = await getDownloadURL(snapshot.ref);
                }

                let downloadURLs = editForm.galleryUrls ? [...editForm.galleryUrls] : [];
                if (editGalleryFiles.length > 0) {
                    const uploadPromises = Array.from(editGalleryFiles).map(async (file) => {
                        const compressedFile = await compressImage(file);
                        const storageRef = ref(storage, `gallery/${Date.now()}_${file.name}`);
                        const snapshot = await uploadBytes(storageRef, compressedFile);
                        return getDownloadURL(snapshot.ref);
                    });
                    const newUrls = await Promise.all(uploadPromises);
                    downloadURLs = [...downloadURLs, ...newUrls];
                }

                if (downloadURLs.length > 15) {
                    alert(`You have ${downloadURLs.length} gallery images. Maximum allowed is 15. Please remove some.`);
                    setIsSaving(false);
                    return;
                }

                await updateDoc(doc(db, "messes", editingItem.id), {
                    ...editForm,
                    posterUrl,
                    galleryUrls: downloadURLs,
                    lastUpdatedDate: editForm.isUserSourced ? editForm.lastUpdatedDate : null
                });
            } else {
                await updateDoc(doc(db, "rooms", editingItem.id), editForm);
            }
            setEditingItem(null);
            setEditForm(null);
            setEditImageFiles([]);
            setEditGalleryFiles([]);
            alert("Updated successfully");
        } catch (error) {
            console.error("Save failed:", error);
            alert("Save failed");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreatePartner = async (e) => {
        e.preventDefault();
        setPartnerStatus({ type: 'info', msg: 'Creating partner account...' });

        try {
            // Use secondaryAuth to avoid logging out the operator
            await createUserWithEmailAndPassword(secondaryAuth, partnerEmail, partnerPassword);

            setPartnerStatus({ type: 'success', msg: `Partner ${partnerEmail} created successfully!` });
            setPartnerEmail('');
            setPartnerPassword('');

            // secondaryAuth keeps the new user logged in on that instance, which is fine.
            // It does NOT affect the main 'auth' instance used by the dashboard.

        } catch (error) {
            console.error("Partner creation failed:", error);
            setPartnerStatus({ type: 'error', msg: error.message });
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100">
            {/* Top Bar */}
            <header className="bg-slate-800 border-b border-slate-700 p-4 sticky top-0 z-10 flex justify-between items-center shadow-md">
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-500">
                        <Server size={24} />
                    </div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        Operational Center
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-400 hidden md:block">
                        Operator: {auth.currentUser?.email}
                    </span>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-lg transition-colors border border-red-500/20"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </header>

            <div className="flex flex-col md:flex-row min-h-[calc(100vh-73px)]">
                {/* Sidebar Navigation */}
                <aside className="w-full md:w-64 bg-slate-800/50 border-r border-slate-700 p-4 space-y-2">
                    <button
                        onClick={() => setActiveTab('bookings')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'bookings'
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                            : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                            }`}
                    >
                        <Calendar size={20} />
                        Call Requests
                    </button>
                    <button
                        onClick={() => setActiveTab('partners')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'partners'
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                            : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                            }`}
                    >
                        <Users size={20} />
                        Create Partner
                    </button>
                    <button
                        onClick={() => setActiveTab('claims')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'claims'
                            ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                            : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                            }`}
                    >
                        <Briefcase size={20} />
                        Listing Claims
                        {claims.filter(c => c.status === 'pending').length > 0 && (
                            <span className="ml-auto bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold">
                                {claims.filter(c => c.status === 'pending').length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('registrations')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'registrations'
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                            : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                            }`}
                    >
                        <Building2 size={20} />
                        Mess Registrations
                        {registrations.filter(r => r.status === 'pending').length > 0 && (
                            <span className="ml-auto bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold">
                                {registrations.filter(r => r.status === 'pending').length}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('inquiries')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'inquiries'
                            ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                            : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                            }`}
                    >
                        <Shield size={20} />
                        Unregistered Queries
                        {inquiries.filter(i => i.status === 'pending').length > 0 && (
                            <span className="ml-auto bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold">
                                {inquiries.filter(i => i.status === 'pending').length}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('room_inquiries')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'room_inquiries'
                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                            : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                            }`}
                    >
                        <BedDouble size={20} />
                        Find Your Room Requests
                        {roomInquiries.length > 0 && (
                            <span className="ml-auto bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold">
                                {roomInquiries.length}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('feedbacks')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'feedbacks'
                            ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                            : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                            }`}
                    >
                        <MessageSquare size={20} />
                        User Feedbacks
                        {feedbacks.filter(f => f.status === 'pending').length > 0 && (
                            <span className="ml-auto bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold">
                                {feedbacks.filter(f => f.status === 'pending').length}
                            </span>
                        )}
                    </button>

                    <div className="pt-4 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4">
                        Data Management
                    </div>

                    <button
                        onClick={() => setActiveTab('messes')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'messes'
                            ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                            : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                            }`}
                    >
                        <Database size={20} />
                        All Messes
                        <span className="ml-auto bg-white/10 px-2 py-0.5 rounded text-[10px] font-bold opacity-60">
                            {messes.length}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('rooms')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'rooms'
                            ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                            : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                            }`}
                    >
                        <Layout size={20} />
                        All Rooms
                        <span className="ml-auto bg-white/10 px-2 py-0.5 rounded text-[10px] font-bold opacity-60">
                            {rooms.length}
                        </span>
                    </button>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-4 md:p-8 overflow-y-auto">

                    {/* BOOKINGS TAB */}
                    {activeTab === 'bookings' && (
                        <div className="max-w-5xl mx-auto">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <Calendar className="text-emerald-500" />
                                All Call Requests
                            </h2>
                            <div className="space-y-4">
                                {bookings.length === 0 ? (
                                    <div className="text-center py-20 text-slate-500 bg-slate-800/50 rounded-2xl border border-slate-700 border-dashed">
                                        No call requests found in the system.
                                    </div>
                                ) : (
                                    bookings.map(booking => (
                                        <div key={booking.id} className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-sm flex flex-col md:flex-row justify-between gap-4">
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${booking.status === 'confirmed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                                        booking.status === 'rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                                            'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                                        }`}>
                                                        {booking.status}
                                                    </span>
                                                    <span className="text-slate-500 text-xs">ID: {booking.id.slice(0, 8)}</span>
                                                </div>
                                                <h3 className="font-bold text-white text-lg">{booking.messName}</h3>
                                                <p className="text-slate-400 text-sm">{booking.roomType} Room • ₹{booking.price}/mo</p>
                                                <div className="pt-2 flex items-center gap-4 text-sm">
                                                    <div className="flex items-center gap-1 text-slate-300">
                                                        <Users size={14} /> {booking.userName}
                                                    </div>
                                                    <div className="text-slate-400 flex items-center gap-2">
                                                        <span className="font-mono bg-slate-900 px-2 py-1 rounded">
                                                            {revealedIds[booking.id] ? booking.userPhone : booking.userPhone?.replace(/\d(?=\d{4})/g, "*")}
                                                        </span>
                                                        <button
                                                            onClick={() => setRevealedIds(prev => ({ ...prev, [booking.id]: !prev[booking.id] }))}
                                                            className="text-slate-500 hover:text-emerald-400 transition-colors"
                                                            title={revealedIds[booking.id] ? "Hide Number" : "Show Number"}
                                                        >
                                                            {revealedIds[booking.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                                                        </button>
                                                    </div>
                                                </div>

                                                {booking.status !== 'pending' && booking.remark && (
                                                    <div className="mt-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 text-xs text-slate-400 italic">
                                                        Remark: {booking.remark}
                                                    </div>
                                                )}
                                            </div>

                                            {booking.status === 'pending' ? (
                                                <div className="flex flex-col gap-3 min-w-[280px]">
                                                    <textarea
                                                        placeholder="Write a remark (optional)..."
                                                        value={bookingRemarks[booking.id] || ''}
                                                        onChange={(e) => setBookingRemarks(prev => ({ ...prev, [booking.id]: e.target.value }))}
                                                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none resize-none h-20"
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleBookingAction(booking.id, 'confirmed')}
                                                            className="flex-1 flex items-center justify-center gap-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors shadow-lg shadow-green-900/20 text-sm"
                                                        >
                                                            <CheckCircle size={16} /> Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleBookingAction(booking.id, 'rejected')}
                                                            className="flex-1 flex items-center justify-center gap-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-medium transition-colors border border-slate-600 text-sm"
                                                        >
                                                            <XCircle size={16} /> Reject
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={async () => {
                                                        if (window.confirm("Delete this completed booking record?")) {
                                                            try {
                                                                await deleteDoc(doc(db, "bookings", booking.id));
                                                            } catch { alert("Delete failed"); }
                                                        }
                                                    }}
                                                    className="self-end md:self-center flex items-center gap-1 px-4 py-2 bg-slate-700 hover:bg-red-500/20 hover:text-red-400 text-slate-400 rounded-lg text-sm font-medium transition-all border border-slate-600"
                                                >
                                                    <Trash2 size={16} /> Delete
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* PARTNERS TAB */}
                    {activeTab === 'partners' && (
                        <div className="max-w-xl mx-auto mt-10">
                            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 shadow-2xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="bg-blue-500/10 p-3 rounded-full text-blue-500">
                                        <UserPlus size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Add New Partner</h2>
                                        <p className="text-slate-400 text-sm">Create credentials for a mess owner</p>
                                    </div>
                                </div>

                                {partnerStatus.msg && (
                                    <div className={`p-4 rounded-xl mb-6 text-sm border ${partnerStatus.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                        partnerStatus.type === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                            'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                        }`}>
                                        {partnerStatus.msg}
                                    </div>
                                )}

                                <form onSubmit={handleCreatePartner} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Partner Email</label>
                                        <input
                                            type="email"
                                            required
                                            className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={partnerEmail}
                                            onChange={(e) => setPartnerEmail(e.target.value)}
                                            placeholder="owner@example.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Temporary Password</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={partnerPassword}
                                            onChange={(e) => setPartnerPassword(e.target.value)}
                                            placeholder="SecurePassword123"
                                        />
                                        <p className="text-xs text-slate-500 mt-2">
                                            <Shield size={12} className="inline mr-1" />
                                            Admin account will be created directly in Auth.
                                        </p>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-blue-600/20 active:scale-95"
                                    >
                                        Create Account
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* NEW ROOM INQUIRIES TAB */}
                    {activeTab === 'room_inquiries' && (
                        <div className="max-w-6xl mx-auto">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-orange-500">
                                <BedDouble />
                                Find Your Room Requests
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {roomInquiries.length === 0 ? (
                                    <div className="col-span-full text-center py-20 text-slate-500 bg-slate-800/50 rounded-2xl border border-slate-700 border-dashed">
                                        No room inquiries found.
                                    </div>
                                ) : (
                                    roomInquiries.map(inquiry => (
                                        <div key={inquiry.id} className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-sm relative group">
                                            <button
                                                onClick={async () => {
                                                    if (window.confirm("Delete this inquiry?")) {
                                                        try {
                                                            await deleteDoc(doc(db, "room_inquiries", inquiry.id));
                                                        } catch { alert("Delete failed"); }
                                                    }
                                                }}
                                                className="absolute top-4 right-4 p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={16} />
                                            </button>

                                            <div className="mb-4">
                                                <h3 className="text-lg font-bold text-white mb-1">{inquiry.name}</h3>
                                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                                    <Phone size={14} className="text-orange-500" />
                                                    {inquiry.phone}
                                                    {inquiry.contactMethod && (
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${inquiry.contactMethod === 'whatsapp' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                                                            {inquiry.contactMethod.toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-3 bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 text-sm">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <p className="text-[10px] uppercase font-bold text-slate-500">Location</p>
                                                        <p className="text-slate-200">{inquiry.location}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] uppercase font-bold text-slate-500">Budget</p>
                                                        <p className="text-emerald-400 font-medium">{inquiry.budget}</p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase font-bold text-slate-500">Occupancy</p>
                                                    <p className="text-slate-200 capitalize">{inquiry.occupancy}</p>
                                                </div>
                                                {inquiry.requirements && (
                                                    <div>
                                                        <p className="text-[10px] uppercase font-bold text-slate-500">Requirements</p>
                                                        <p className="text-slate-400 italic">"{inquiry.requirements}"</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-4 pt-3 border-t border-slate-700 text-[10px] text-slate-500 flex justify-between">
                                                <span>Submitted: {inquiry.createdAt?.seconds ? new Date(inquiry.createdAt.seconds * 1000).toLocaleString() : 'Just now'}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* CLAIMS TAB */}
                    {activeTab === 'claims' && (
                        <div className="max-w-5xl mx-auto">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-amber-500">
                                <Briefcase />
                                Listing Claim Requests
                            </h2>
                            <div className="space-y-4">
                                {claims.length === 0 ? (
                                    <div className="text-center py-20 text-slate-500 bg-slate-800/50 rounded-2xl border border-slate-700 border-dashed">
                                        No claim requests found.
                                    </div>
                                ) : (
                                    claims.map(claim => (
                                        <div key={claim.id} className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-sm">
                                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${claim.status === 'resolved' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                                            {claim.status}
                                                        </span>
                                                        <span className="text-slate-500 text-xs">Claim ID: {claim.id.slice(0, 8)}</span>
                                                    </div>
                                                    <h3 className="font-bold text-white text-xl flex items-center gap-2">
                                                        {claim.messName}
                                                        <span className="text-xs font-normal text-slate-400">(ID: {claim.messId?.slice(0, 6)}...)</span>
                                                    </h3>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mt-4 bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                                                        <div>
                                                            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Claimant Name</p>
                                                            <p className="text-slate-200 font-medium">{claim.userName}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Email Address</p>
                                                            <p className="text-slate-200 font-medium">{claim.userEmail}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Phone Number</p>
                                                            <p className="text-slate-200 font-medium">{claim.userPhone}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Request Date</p>

                                                            <p className="text-slate-200 font-medium">
                                                                {claim.createdAt?.seconds ? new Date(claim.createdAt.seconds * 1000).toLocaleString() : 'N/A'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-row md:flex-col gap-2 self-start md:justify-center">
                                                    {claim.status === 'pending' ? (
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    await updateDoc(doc(db, "claims", claim.id), { status: 'resolved' });
                                                                } catch { alert("Update failed"); }
                                                            }}
                                                            className="flex items-center gap-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-emerald-900/20"
                                                        >
                                                            <ClipboardCheck size={16} /> Mark Resolved
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <span className="text-emerald-500 text-sm font-bold flex items-center gap-1 bg-emerald-500/10 px-3 py-2 rounded-lg">
                                                                <CheckCircle size={16} /> Resolved
                                                            </span>
                                                            <button
                                                                onClick={async () => {
                                                                    if (window.confirm("Delete this resolved claim record?")) {
                                                                        try {
                                                                            await deleteDoc(doc(db, "claims", claim.id));
                                                                        } catch { alert("Delete failed"); }
                                                                    }
                                                                }}
                                                                className="flex items-center gap-1 px-4 py-2 bg-slate-700 hover:bg-red-500/20 hover:text-red-400 text-slate-400 rounded-lg text-sm font-medium transition-all border border-slate-600"
                                                            >
                                                                <Trash2 size={16} /> Delete
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* Mess Registrations Tab */}
                    {activeTab === 'registrations' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-blue-500">
                                <Building2 />
                                New Mess Registrations
                            </h2>
                            <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
                                {registrations.map(reg => (
                                    <div key={reg.id} className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-sm">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-3 bg-blue-500/10 rounded-lg">
                                                    <Building2 className="text-blue-500" size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-white text-lg">{reg.messName}</h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${reg.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>
                                                            {reg.status}
                                                        </span>
                                                        <span className="text-slate-500 text-xs flex items-center gap-1">
                                                            <Calendar size={12} />
                                                            {reg.createdAt?.seconds ? new Date(reg.createdAt.seconds * 1000).toLocaleDateString() : 'Recently'}
                                                        </span>
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
                                                className="p-2 hover:bg-red-500/20 hover:text-red-400 text-slate-400 rounded-lg transition-colors border border-transparent hover:border-red-500/30"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>

                                        <div className="space-y-3 bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-slate-500 text-xs uppercase font-bold mb-1">Mess Type</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {reg.messType?.map((t, i) => (
                                                            <span key={i} className="px-2 py-1 bg-slate-800 rounded text-xs text-white border border-slate-700">
                                                                {t}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-slate-500 text-xs uppercase font-bold mb-1">Phone</p>
                                                    <a href={`tel:${reg.phoneNumber}`} className="text-blue-400 hover:underline flex items-center gap-1 font-mono text-sm">
                                                        <Phone size={14} /> {reg.phoneNumber}
                                                    </a>
                                                </div>
                                            </div>

                                            <div>
                                                <p className="text-slate-500 text-xs uppercase font-bold mb-1">Landmark</p>
                                                <div className="flex items-start gap-1 text-slate-300 text-sm">
                                                    <MapPin size={14} className="mt-0.5 shrink-0 text-slate-500" />
                                                    {reg.landmark}
                                                </div>
                                            </div>

                                            <div>
                                                <p className="text-slate-500 text-xs uppercase font-bold mb-1">Room Types</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {reg.roomTypes?.map((t, i) => (
                                                        <span key={i} className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-xs">
                                                            {t}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <p className="text-slate-500 text-xs uppercase font-bold mb-1">Facilities</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {reg.facilities?.map((f, i) => (
                                                        <span key={i} className="px-2 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded text-xs">
                                                            {f}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {registrations.length === 0 && (
                                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-500 border-2 border-dashed border-slate-700 rounded-xl">
                                        <Building2 size={48} className="mb-4 opacity-50" />
                                        <p className="text-lg font-medium">No mess registrations yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* INQUIRIES TAB */}

                    {activeTab === 'inquiries' && (
                        <div className="max-w-5xl mx-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold flex items-center gap-2 text-rose-500">
                                    <Shield />
                                    Unregistered Queries
                                </h2>
                                <span className="bg-rose-500/10 text-rose-500 px-3 py-1 rounded-full text-sm font-bold border border-rose-500/20">
                                    {inquiries.length} Total
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {inquiries.length === 0 ? (
                                    <div className="col-span-full text-center py-20 text-slate-500 bg-slate-800/50 rounded-2xl border border-slate-700 border-dashed">
                                        No unregistered queries found.
                                    </div>
                                ) : (
                                    inquiries.map(inquiry => (
                                        <div key={inquiry.id} className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl flex flex-col h-full">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${inquiry.status === 'resolved' ? 'bg-green-500/20 text-green-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                                    {inquiry.status}
                                                </div>
                                                <span className="text-slate-500 text-[10px] font-mono tracking-tighter">#{inquiry.id.slice(-6)}</span>
                                            </div>

                                            <div className="mb-4">
                                                <h3 className="text-lg font-bold text-white mb-1">{inquiry.name}</h3>
                                                <p className="text-slate-400 text-sm flex items-center gap-2">
                                                    <Phone size={14} className="text-emerald-500" />
                                                    {inquiry.phone}
                                                </p>
                                            </div>

                                            <div className="bg-slate-900/50 rounded-xl p-4 mb-6 border border-slate-700/50 flex-grow">
                                                <div className="flex flex-col gap-3">
                                                    <div>
                                                        <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Target Mess</p>
                                                        <p className="text-slate-200 text-sm font-medium">{inquiry.messName}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Looking For</p>
                                                        <p className="text-emerald-400 text-sm font-bold">{inquiry.seating}</p>
                                                    </div>
                                                    <div className="pt-2 border-t border-slate-700/50">
                                                        <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Requested On</p>
                                                        <p className="text-slate-400 text-[11px]">
                                                            {inquiry.createdAt?.seconds ? new Date(inquiry.createdAt.seconds * 1000).toLocaleString() : 'Recently'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 mt-auto">
                                                {inquiry.status === 'pending' ? (
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                await updateDoc(doc(db, "inquiries", inquiry.id), { status: 'resolved' });
                                                            } catch { alert("Failed to resolve"); }
                                                        }}
                                                        className="col-span-2 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-900/20"
                                                    >
                                                        <CheckCircle size={14} /> Resolve
                                                    </button>
                                                ) : (
                                                    <>
                                                        <div className="flex items-center justify-center gap-2 bg-emerald-500/10 text-emerald-500 py-2.5 rounded-xl text-xs font-bold border border-emerald-500/20">
                                                            <CheckCircle size={14} /> Done
                                                        </div>
                                                        <button
                                                            onClick={async () => {
                                                                if (window.confirm("Delete this solved query?")) {
                                                                    try {
                                                                        await deleteDoc(doc(db, "inquiries", inquiry.id));
                                                                    } catch { alert("Delete failed"); }
                                                                }
                                                            }}
                                                            className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-red-500/20 hover:text-red-400 text-slate-400 py-2.5 rounded-xl text-xs font-bold transition-all border border-slate-600"
                                                        >
                                                            <Trash2 size={14} /> Delete
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* FEEDBACKS TAB */}
                    {activeTab === 'feedbacks' && (
                        <div className="max-w-5xl mx-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold flex items-center gap-2 text-purple-500">
                                    <MessageSquare />
                                    User Feedbacks
                                </h2>
                                <span className="bg-purple-500/10 text-purple-500 px-3 py-1 rounded-full text-sm font-bold border border-purple-500/20">
                                    {feedbacks.length} Total
                                </span>
                            </div>

                            <div className="space-y-4">
                                {feedbacks.length === 0 ? (
                                    <div className="text-center py-20 text-slate-500 bg-slate-800/50 rounded-2xl border border-slate-700 border-dashed">
                                        No feedbacks submitted yet.
                                    </div>
                                ) : (
                                    feedbacks.map(feedback => (
                                        <div key={feedback.id} className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-sm">
                                            <div className="flex flex-col gap-4">
                                                {/* Header */}
                                                <div className="flex justify-between items-start">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${feedback.status === 'replied' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                                                feedback.status === 'resolved' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                                                    'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                                                }`}>
                                                                {feedback.status}
                                                            </span>
                                                            <span className="text-slate-500 text-xs">ID: {feedback.id.slice(0, 8)}</span>
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-white text-base">{feedback.userName}</h3>
                                                            {feedback.userEmail && (
                                                                <p className="text-slate-400 text-sm">{feedback.userEmail}</p>
                                                            )}
                                                            {/* Star Rating Display */}
                                                            {feedback.rating > 0 && (
                                                                <div className="flex items-center gap-1 mt-1">
                                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                                        <span key={star} className={`text-sm ${star <= feedback.rating ? 'text-yellow-400' : 'text-slate-600'}`}>
                                                                            ★
                                                                        </span>
                                                                    ))}
                                                                    <span className="text-xs text-slate-500 ml-1">({feedback.rating}/5)</span>
                                                                </div>
                                                            )}
                                                            <p className="text-slate-500 text-xs mt-1">
                                                                {feedback.createdAt?.seconds ? new Date(feedback.createdAt.seconds * 1000).toLocaleString() : 'Recently'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Delete Button */}
                                                    <button
                                                        onClick={async () => {
                                                            if (window.confirm("Delete this feedback?")) {
                                                                try {
                                                                    await deleteDoc(doc(db, "feedbacks", feedback.id));
                                                                } catch { alert("Delete failed"); }
                                                            }
                                                        }}
                                                        className="flex items-center gap-1 px-3 py-2 bg-slate-700 hover:bg-red-500/20 hover:text-red-400 text-slate-400 rounded-lg text-sm font-medium transition-all border border-slate-600"
                                                    >
                                                        <Trash2 size={16} /> Delete
                                                    </button>
                                                </div>

                                                {/* Feedback Message */}
                                                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                                                    <p className="text-sm font-bold text-slate-400 uppercase mb-2">Feedback Message</p>
                                                    <p className="text-white text-sm leading-relaxed">{feedback.message}</p>
                                                </div>

                                                {/* Operator Reply Display */}
                                                {feedback.operatorReply && (
                                                    <div className="p-4 bg-emerald-900/10 rounded-xl border border-emerald-500/20">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Reply size={14} className="text-emerald-500" />
                                                            <p className="text-xs font-bold text-emerald-500 uppercase">Your Reply</p>
                                                        </div>
                                                        <p className="text-slate-300 text-sm leading-relaxed">{feedback.operatorReply}</p>
                                                        {feedback.repliedAt?.seconds && (
                                                            <p className="text-slate-500 text-xs mt-2">
                                                                Replied: {new Date(feedback.repliedAt.seconds * 1000).toLocaleString()}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Reply Form */}
                                                {!feedback.operatorReply && (
                                                    <div className="space-y-3">
                                                        <textarea
                                                            placeholder="Write your reply to this feedback..."
                                                            value={feedbackReplies[feedback.id] || ''}
                                                            onChange={(e) => setFeedbackReplies(prev => ({ ...prev, [feedback.id]: e.target.value }))}
                                                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-purple-500 outline-none resize-none h-24"
                                                        />
                                                        <button
                                                            onClick={async () => {
                                                                const reply = feedbackReplies[feedback.id];
                                                                if (!reply?.trim()) {
                                                                    alert("Please enter a reply");
                                                                    return;
                                                                }
                                                                try {
                                                                    await updateDoc(doc(db, "feedbacks", feedback.id), {
                                                                        operatorReply: reply.trim(),
                                                                        repliedAt: serverTimestamp(),
                                                                        repliedBy: auth.currentUser?.email,
                                                                        status: 'replied'
                                                                    });
                                                                    setFeedbackReplies(prev => {
                                                                        const updated = { ...prev };
                                                                        delete updated[feedback.id];
                                                                        return updated;
                                                                    });
                                                                } catch (error) {
                                                                    console.error("Reply failed:", error);
                                                                    alert("Failed to send reply");
                                                                }
                                                            }}
                                                            className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors shadow-lg shadow-purple-900/20 text-sm"
                                                        >
                                                            <Reply size={16} /> Send Reply
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* ALL MESSES MANAGEMENT */}
                    {activeTab === 'messes' && (
                        <div className="max-w-6xl mx-auto">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                                <h2 className="text-2xl font-bold flex items-center gap-3 text-indigo-400">
                                    <Database size={28} />
                                    Mess Directory
                                </h2>
                                <div className="relative w-full md:w-96">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search by name or address..."
                                        className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none shadow-inner"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {messes.filter(m =>
                                    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    m.address.toLowerCase().includes(searchQuery.toLowerCase())
                                ).map(mess => (
                                    <div key={mess.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 md:p-6 flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-indigo-500/50 transition-all shadow-lg hover:shadow-indigo-500/5">
                                        <div className="flex items-center gap-5 w-full md:w-auto">
                                            <div className="relative">
                                                <div className="w-16 h-16 rounded-2xl bg-slate-700/50 flex items-center justify-center text-indigo-400 overflow-hidden border border-slate-600">
                                                    {mess.posterUrl ? (
                                                        <img src={mess.posterUrl} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Server size={24} />
                                                    )}
                                                </div>
                                                {mess.hidden && (
                                                    <div className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full shadow-lg border border-rose-600">
                                                        <EyeOff size={10} />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                    {mess.name}
                                                    {mess.isUserSourced && (
                                                        <span className="text-[10px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20 uppercase font-black">
                                                            Sourced
                                                        </span>
                                                    )}
                                                </h3>
                                                <p className="text-slate-400 text-sm line-clamp-1 flex items-center gap-1.5">
                                                    <MapPin size={12} className="opacity-50" /> {mess.address}
                                                </p>
                                                <p className="text-slate-500 text-[11px] mt-1 font-mono">{mess.id}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                                            <button
                                                onClick={() => handleToggleVisibility(mess.id, mess.hidden)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${mess.hidden
                                                    ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20'
                                                    : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'
                                                    }`}
                                                title={mess.hidden ? "Show Listing" : "Hide Listing"}
                                            >
                                                {mess.hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                                                {mess.hidden ? 'Private' : 'Public'}
                                            </button>

                                            <button
                                                onClick={() => handleEditItem(mess, 'mess')}
                                                className="p-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl transition-all border border-slate-600"
                                            >
                                                <Edit3 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ALL ROOMS MANAGEMENT */}
                    {activeTab === 'rooms' && (
                        <div className="max-w-6xl mx-auto">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                                <h2 className="text-2xl font-bold flex items-center gap-3 text-cyan-400">
                                    <Layout size={28} />
                                    Global Room Inventory
                                </h2>
                                <div className="relative w-full md:w-96">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search by mess name or category..."
                                        className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-cyan-500 outline-none shadow-inner"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {rooms.filter(r =>
                                    (r.messName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    (r.category || "").toLowerCase().includes(searchQuery.toLowerCase())
                                ).map(room => (
                                    <div key={room.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex flex-col hover:border-cyan-500/50 transition-all shadow-xl group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="bg-cyan-500/10 text-cyan-500 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider border border-cyan-500/20">
                                                {room.occupancy} Room
                                            </div>
                                            <span className="text-slate-500 text-[10px] font-mono">#{room.id.slice(-6)}</span>
                                        </div>

                                        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">
                                            {room.messName}
                                        </h3>
                                        <p className="text-slate-400 text-xs mb-4 flex items-center gap-1.5 min-h-[16px]">
                                            {room.category && <><Layout size={12} className="opacity-50" /> {room.category}</>}
                                        </p>

                                        <div className="bg-slate-900/50 rounded-xl p-4 mb-5 border border-slate-700/50 flex-grow">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs text-slate-500 uppercase font-black">Price</span>
                                                <span className="text-emerald-400 font-bold">₹{room.price}/mo</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-slate-500 uppercase font-black">Availability</span>
                                                <span className="text-white font-bold">{room.availableCount} {room.occupancy === 'Single' ? 'Bed' : 'Seats'}</span>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 mt-auto">
                                            <button
                                                onClick={() => handleEditItem(room, 'room')}
                                                className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 py-2.5 rounded-xl text-xs font-bold transition-all border border-slate-600"
                                            >
                                                <Edit3 size={14} /> Edit
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* EDIT MODAL */}
            {editingItem && editForm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border border-slate-700 animate-in zoom-in-95 duration-200">
                        <div className="sticky top-0 bg-slate-800 p-6 border-b border-slate-700 flex justify-between items-center z-10">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Edit3 size={20} className="text-indigo-400" />
                                Edit {editingItem.type === 'mess' ? 'Mess Profile' : 'Room Type'}
                            </h2>
                            <button
                                onClick={() => { setEditingItem(null); setEditForm(null); }}
                                className="p-2 hover:bg-slate-700 rounded-full transition-colors"
                            >
                                <XCircle size={24} className="text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
                            {editingItem.type === 'mess' ? (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Mess Name</label>
                                            <input
                                                type="text"
                                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                                value={editForm.name}
                                                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Type</label>
                                            <select
                                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                                value={editForm.messType}
                                                onChange={e => setEditForm({ ...editForm, messType: e.target.value })}
                                            >
                                                <option value="Boys">Boys Mess</option>
                                                <option value="Girls">Girls Mess</option>
                                                <option value="Co-ed">Co-ed Mess</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Address</label>
                                        <textarea
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-indigo-500 h-20 resize-none"
                                            value={editForm.address}
                                            onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Description / About Mess</label>
                                        <textarea
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-indigo-500 h-32 resize-none"
                                            value={editForm.description || ''}
                                            onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                            placeholder=" detailed description about the mess, facilities, rules etc."
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Contact</label>
                                            <input
                                                type="text"
                                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                                value={editForm.contact}
                                                onChange={e => setEditForm({ ...editForm, contact: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Maps URL</label>
                                            <input
                                                type="text"
                                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                                value={editForm.locationUrl}
                                                onChange={e => setEditForm({ ...editForm, locationUrl: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Price Policy / Deposit</label>
                                            <input
                                                type="text"
                                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                                value={editForm.advanceDeposit}
                                                onChange={e => setEditForm({ ...editForm, advanceDeposit: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Security/Other Details</label>
                                            <input
                                                type="text"
                                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                                value={editForm.security}
                                                onChange={e => setEditForm({ ...editForm, security: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <MultiSelectDropdown
                                            label="Mess Amenities"
                                            options={[
                                                { key: 'food', label: 'Food' },
                                                { key: 'wifi', label: 'WiFi' },
                                                { key: 'inverter', label: 'Electricity Backup' }
                                            ]}
                                            selected={editForm.amenities}
                                            onChange={(key, checked) => setEditForm({
                                                ...editForm,
                                                amenities: { ...editForm.amenities, [key]: checked }
                                            })}
                                            color="indigo"
                                        />
                                    </div>

                                    <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-700 flex flex-col gap-4">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 accent-indigo-500"
                                                checked={editForm.hidden}
                                                onChange={e => setEditForm({ ...editForm, hidden: e.target.checked })}
                                            />
                                            <div>
                                                <span className="text-sm font-bold text-white">Private Listing</span>
                                                <p className="text-[10px] text-slate-500">Hide this mess from the public home page</p>
                                            </div>
                                        </label>

                                        <label className="flex items-center gap-3 cursor-pointer border-t border-slate-700/50 pt-3">
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 accent-indigo-500"
                                                checked={editForm.hideContact}
                                                onChange={e => setEditForm({ ...editForm, hideContact: e.target.checked })}
                                            />
                                            <div>
                                                <span className="text-sm font-bold text-white">Hide Contact Number</span>
                                                <p className="text-[10px] text-slate-500">Show "Not Available" instead of phone number</p>
                                            </div>
                                        </label>
                                    </div>

                                    <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-700">
                                        <div className="flex items-center gap-3 mb-4">
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 accent-amber-500"
                                                checked={editForm.isUserSourced}
                                                onChange={e => setEditForm({ ...editForm, isUserSourced: e.target.checked })}
                                            />
                                            <span className="text-sm font-bold text-white">Managed (User Sourced)</span>
                                        </div>
                                        {editForm.isUserSourced && (
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Last Update Date</label>
                                                <input
                                                    type="date"
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-amber-500"
                                                    value={editForm.lastUpdatedDate}
                                                    onChange={e => setEditForm({ ...editForm, lastUpdatedDate: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Poster Image</label>
                                        <input
                                            type="file"
                                            className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-indigo-500/10 file:text-indigo-400 hover:file:bg-indigo-500/20"
                                            onChange={e => setEditImageFiles(e.target.files)}
                                            accept="image/*"
                                        />
                                    </div>

                                    <div className="pt-2 border-t border-slate-700">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                                            Mess Photo Gallery (Max 15)
                                        </label>
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={(e) => setEditGalleryFiles(e.target.files)}
                                            className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-purple-500/10 file:text-purple-400 hover:file:bg-purple-500/20"
                                        />

                                        {editForm.galleryUrls?.length > 0 && (
                                            <div className="mt-4">
                                                <p className="text-xs text-slate-500 mb-2 font-medium">Current Gallery ({editForm.galleryUrls.length}/15):</p>
                                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                                    {editForm.galleryUrls.map((url, idx) => (
                                                        <div key={idx} className="relative group rounded-md overflow-hidden border border-slate-700 shadow-sm aspect-square bg-slate-900">
                                                            <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
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
                                </>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Occupancy</label>
                                            <select
                                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-cyan-500"
                                                value={editForm.occupancy}
                                                onChange={e => setEditForm({ ...editForm, occupancy: e.target.value })}
                                            >
                                                <option value="Single">Single</option>
                                                <option value="Double">Double</option>
                                                <option value="Triple">Triple</option>
                                                <option value="Four">Four</option>
                                                <option value="Five">Five</option>
                                                <option value="Six">Six</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Price (₹/mo)</label>
                                            <input
                                                type="number"
                                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-cyan-500"
                                                value={editForm.price}
                                                onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Total Inventory</label>
                                            <input
                                                type="number"
                                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-cyan-500"
                                                value={editForm.totalInventory}
                                                onChange={e => setEditForm({ ...editForm, totalInventory: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Available Seats/Beds</label>
                                            <input
                                                type="number"
                                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-cyan-500"
                                                value={editForm.availableCount}
                                                onChange={e => setEditForm({ ...editForm, availableCount: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Category / Other Info</label>
                                        <textarea
                                            placeholder="e.g. Deluxe AC, includes study table"
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-cyan-500 h-20 resize-none"
                                            value={editForm.category}
                                            onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <MultiSelectDropdown
                                            label="Room Amenities"
                                            options={[
                                                { key: 'ac', label: 'AC' },
                                                { key: 'attachedBathroom', label: 'Attached Bathroom' }
                                            ]}
                                            selected={editForm.amenities}
                                            onChange={(key, checked) => setEditForm({
                                                ...editForm,
                                                amenities: { ...editForm.amenities, [key]: checked }
                                            })}
                                            color="cyan"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white font-bold py-3 rounded-2xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    {isSaving ? 'Saving Changes...' : 'Save Changes'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setEditingItem(null); setEditForm(null); }}
                                    className="px-6 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold py-3 rounded-2xl transition-all border border-slate-600"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


        </div >
    );
};

export default OperationalDashboard;
