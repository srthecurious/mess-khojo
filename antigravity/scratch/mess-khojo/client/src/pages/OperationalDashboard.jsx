import React, { useState, useEffect } from 'react';
import { db, auth, getSecondaryAuth, storage } from '../firebase';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, updateDoc, doc, serverTimestamp, addDoc, getDoc, setDoc, getDocs, GeoPoint } from 'firebase/firestore';


import { useNavigate } from 'react-router-dom';
import { Server, Users, Calendar, LogOut, CheckCircle, XCircle, UserPlus, Shield, Briefcase, ClipboardCheck, Trash2, Phone, Eye, EyeOff, Edit3, Search, Database, Layout, MapPin, MessageSquare, Reply, Building2, BedDouble, Image, ArrowUp, ArrowDown, ToggleLeft, ToggleRight, Monitor, Smartphone, TrendingUp } from 'lucide-react';
import MultiSelectDropdown from '../components/MultiSelectDropdown';
import { sendTelegramNotification } from '../utils/telegramNotifier';
import imageCompression from 'browser-image-compression';

// Tab Components
import BookingsTab from './OperationalDashboard/tabs/BookingsTab';
import PartnersTab from './OperationalDashboard/tabs/PartnersTab';
import ClaimsTab from './OperationalDashboard/tabs/ClaimsTab';
import RegistrationsTab from './OperationalDashboard/tabs/RegistrationsTab';
import InquiriesTab from './OperationalDashboard/tabs/InquiriesTab';
import RoomInquiriesTab from './OperationalDashboard/tabs/RoomInquiriesTab';
import FeedbacksTab from './OperationalDashboard/tabs/FeedbacksTab';
import MessesTab from './OperationalDashboard/tabs/MessesTab';
import RoomsTab from './OperationalDashboard/tabs/RoomsTab';
import HeroAdsTab from './OperationalDashboard/tabs/HeroAdsTab';

// Hooks
import { useOperationalData } from './OperationalDashboard/hooks/useOperationalData';
import { useHeroAds } from './OperationalDashboard/hooks/useHeroAds';
import { backfillRoomDistricts } from '../utils/migrations';

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
    const [feedbackReplies, setFeedbackReplies] = useState({}); // { feedbackId: replyText }
    const opData = useOperationalData();
    const { bookings: allBookings, claims: allClaims, inquiries: allInquiries, roomInquiries: allRoomInquiries, feedbacks, registrations: allRegistrations, messes: allMesses, rooms: allRooms } = opData;
    
    const heroAds = useHeroAds();
    const { carouselEnabled, desktopAds, mobileAds, heroAdUploading, heroAdForm, setHeroAdForm, desktopAdFile, setDesktopAdFile, mobileAdFile, setMobileAdFile, handleToggleCarousel, handleHeroAdUpload, handleReorderHeroAd, handleToggleHeroAd, handleDeleteHeroAd } = heroAds;

    const [opFilterDistrict, setOpFilterDistrict] = useState('all');
    const [bookingRemarks, setBookingRemarks] = useState({}); // { bookingId: remarkText }
    const [searchQuery, setSearchQuery] = useState('');


    // Editing State
    const [editingItem, setEditingItem] = useState(null); // For mess/room edit modal
    const [editForm, setEditForm] = useState(null);
    const [editImageFiles, setEditImageFiles] = useState([]);
    const [editGalleryFiles, setEditGalleryFiles] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [saveToast, setSaveToast] = useState(null); // { message, type }
    const [revealedIds, setRevealedIds] = useState({}); // { bookingId: true/false } to toggle phone visibility
    const [bookingActionLoading, setBookingActionLoading] = useState({}); // { bookingId: true }

    // Partner Creation State
    const [partnerEmail, setPartnerEmail] = useState('');
    const [partnerPassword, setPartnerPassword] = useState('');
    const [partnerStatus, setPartnerStatus] = useState({ type: '', msg: '' });
    
    const [updatePartnerEmail, setUpdatePartnerEmail] = useState('');
    const [updatePartnerPassword, setUpdatePartnerPassword] = useState('');
    const [updatePasswordStatus, setUpdatePasswordStatus] = useState({ loading: false, msg: '', type: '' });
    
    const [migrationStatus, setMigrationStatus] = useState({ loading: false, msg: '', type: '' });

    // Approval Modal State
    const [approveModal, setApproveModal] = useState({
        isOpen: false,
        reg: null,
        email: '',
        password: '',
        loading: false
    });

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



    const handleBookingAction = async (id, status) => {
        setBookingActionLoading(prev => ({ ...prev, [id]: true }));
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
        } finally {
            setBookingActionLoading(prev => {
                const updated = { ...prev };
                delete updated[id];
                return updated;
            });
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

    const handleToggleSponsored = async (id, currentSponsored) => {
        try {
            await updateDoc(doc(db, "messes", id), {
                isSponsored: !currentSponsored
            });
        } catch (error) {
            console.error("Toggle sponsored failed:", error);
            alert("Action failed");
        }
    };

    const handleEditItem = (item, type) => {
        setEditingItem({ type, id: item.id });
        if (type === 'mess') {
            setEditForm({
                name: item.name || '',
                district: item.district || 'balasore', // Operator CAN change district
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
                description: item.description || '',
                sponsorRank: item.sponsorRank || '',
                rentCycle: item.rentCycle || 'monthly',
                minStayDuration: item.minStayDuration || 1
            });
        } else {
            setEditForm({
                occupancy: item.occupancy || '1',
                category: item.category || '',
                price: item.price || '',
                availableCount: item.availableCount || 0,
                totalInventory: item.totalInventory || 1,
                otherInfo: item.otherInfo || '',
                amenities: item.amenities || { ac: false, attachedBathroom: false },
                imageUrls: item.imageUrls || (item.imageUrl ? [item.imageUrl] : [])
            });
        }
    };

    const removeGalleryImage = async (imageUrlToRemove) => {
        if (!editingItem) return;
        try {
            if (editingItem.type === 'mess') {
                const updatedUrls = (editForm.galleryUrls || []).filter(url => url !== imageUrlToRemove);
                await updateDoc(doc(db, "messes", editingItem.id), {
                    galleryUrls: updatedUrls
                });
                setEditForm(prev => ({ ...prev, galleryUrls: updatedUrls }));
            } else {
                const updatedUrls = (editForm.imageUrls || []).filter(url => url !== imageUrlToRemove);
                await updateDoc(doc(db, "rooms", editingItem.id), {
                    imageUrls: updatedUrls,
                    imageUrl: updatedUrls[0] || ""
                });
                setEditForm(prev => ({ ...prev, imageUrls: updatedUrls }));
            }

        } catch (error) {
            console.error("Error removing image:", error);
            alert("Failed to remove image");
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

                const { sponsorRank, ...restEditForm } = editForm;
                const finalSponsorRank = sponsorRank ? Number(sponsorRank) : null;

                await updateDoc(doc(db, "messes", editingItem.id), {
                    ...restEditForm,
                    sponsorRank: finalSponsorRank,
                    posterUrl,
                    galleryUrls: downloadURLs,
                    lastUpdatedDate: editForm.isUserSourced ? editForm.lastUpdatedDate : null
                });
            } else {
                let downloadURLs = editForm.imageUrls ? [...editForm.imageUrls] : [];
                if (editGalleryFiles.length > 0) {
                    const uploadPromises = Array.from(editGalleryFiles).map(async (file) => {
                        const compressedFile = await compressImage(file);
                        const storageRef = ref(storage, `rooms/${Date.now()}_${file.name}`);
                        const snapshot = await uploadBytes(storageRef, compressedFile);
                        return getDownloadURL(snapshot.ref);
                    });
                    const newUrls = await Promise.all(uploadPromises);
                    downloadURLs = [...downloadURLs, ...newUrls];
                }

                if (downloadURLs.length > 5) {
                    alert(`You have ${downloadURLs.length} images. Maximum allowed is 5. Please remove some.`);
                    setIsSaving(false);
                    return;
                }

                await updateDoc(doc(db, "rooms", editingItem.id), {
                    ...editForm,
                    imageUrls: downloadURLs,
                    imageUrl: downloadURLs[0] || ""
                });
            }
            setEditingItem(null);
            setEditForm(null);
            setEditImageFiles([]);
            setEditGalleryFiles([]);
            setSaveToast({ message: '✅ Changes saved successfully!', type: 'success' });
            setTimeout(() => setSaveToast(null), 3500);
        } catch (error) {
            console.error("Save failed:", error);
            setSaveToast({ message: `❌ Save failed: ${error.message}`, type: 'error' });
            setTimeout(() => setSaveToast(null), 3500);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreatePartner = async (e) => {
        e.preventDefault();
        setPartnerStatus({ type: 'info', msg: 'Creating partner account...' });

        try {
            // Use secondaryAuth to avoid logging out the operator
            const secondaryAuth = getSecondaryAuth();
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, partnerEmail, partnerPassword);
            const newUser = userCredential.user;

            // Create users document with role 'admin'
            await setDoc(doc(db, "users", newUser.uid), {
                uid: newUser.uid,
                email: partnerEmail,
                role: 'admin',
                createdAt: serverTimestamp()
            });

            setPartnerStatus({ type: 'success', msg: `Partner ${partnerEmail} created successfully!` });
            setPartnerEmail('');
            setPartnerPassword('');

            // secondaryAuth keeps the new user logged in on that instance, which is fine.
            // It does NOT affect the main 'auth' instance used by the dashboard.
            await signOut(secondaryAuth); // Clean up the secondary auth state

        } catch (error) {
            console.error("Partner creation failed:", error);
            setPartnerStatus({ type: 'error', msg: error.message });
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        setUpdatePasswordStatus({ loading: true, msg: '', type: '' });
        try {
            const functions = getFunctions(auth.app);
            const updatePasswordFn = httpsCallable(functions, 'updatePartnerPassword');
            
            const result = await updatePasswordFn({
                targetEmail: updatePartnerEmail,
                newPassword: updatePartnerPassword
            });
            
            setUpdatePasswordStatus({ loading: false, msg: result.data.message || 'Password updated successfully.', type: 'success' });
            setUpdatePartnerEmail('');
            setUpdatePartnerPassword('');
        } catch (error) {
            console.error("Update Password Error:", error);
            setUpdatePasswordStatus({ loading: false, msg: error.message || 'Failed to update password.', type: 'error' });
        }
    };

    const handleMigratePartners = async () => {
        if (!window.confirm("Are you sure you want to migrate existing partners? This will find accounts that own a mess but don't have an admin role and update them.")) return;
        
        setMigrationStatus({ loading: true, msg: 'Starting migration...', type: 'info' });
        try {
            let migratedCount = 0;
            const messesSnapshot = await getDocs(collection(db, "messes"));
            
            for (const messDoc of messesSnapshot.docs) {
                const messData = messDoc.data();
                if (messData.adminId) {
                    const userDocRef = doc(db, "users", messData.adminId);
                    const userDocSnap = await getDoc(userDocRef);
                    
                    if (!userDocSnap.exists()) {
                        // Found a partner without a user document — create one
                        await setDoc(userDocRef, {
                            uid: messData.adminId,
                            email: messData.contact || "Migrated Partner",
                            role: 'admin',
                            createdAt: serverTimestamp()
                        });
                        migratedCount++;
                    } else {
                        // Document exists but may be missing the role field
                        const userData = userDocSnap.data();
                        if (!userData.role || (userData.role !== 'admin' && userData.role !== 'operator')) {
                            await updateDoc(userDocRef, { role: 'admin' });
                            migratedCount++;
                        }
                    }
                }
            }
            setMigrationStatus({ loading: false, msg: `Successfully migrated ${migratedCount} partners.`, type: 'success' });
        } catch (error) {
            console.error("Migration failed:", error);
            setMigrationStatus({ loading: false, msg: error.message, type: 'error' });
        }
    };

    const handleBackfillDistricts = async () => {
        if (!window.confirm("Are you sure you want to backfill district field for all existing messes and rooms?")) return;
        
        setMigrationStatus({ loading: true, msg: 'Starting backfill...', type: 'info' });
        try {
            let backfilledMessesCount = 0;
            const messesSnapshot = await getDocs(collection(db, "messes"));
            
            for (const messDoc of messesSnapshot.docs) {
                const messData = messDoc.data();
                if (!messData.district) {
                    await updateDoc(doc(db, "messes", messDoc.id), {
                        district: 'balasore'
                    });
                    backfilledMessesCount++;
                }
            }

            // Also backfill rooms
            const roomResult = await backfillRoomDistricts();
            
            if (roomResult.success) {
                setMigrationStatus({ 
                    loading: false, 
                    msg: `Backfill successful: ${backfilledMessesCount} messes and ${roomResult.count} rooms updated.`, 
                    type: 'success' 
                });
            } else {
                setMigrationStatus({ 
                    loading: false, 
                    msg: `Messes backfilled (${backfilledMessesCount}), but rooms failed: ${roomResult.error.message}`, 
                    type: 'error' 
                });
            }
        } catch (error) {
            console.error("Backfill failed:", error);
            setMigrationStatus({ loading: false, msg: error.message, type: 'error' });
        }
    };

    const handleSyncACAmenities = async () => {
        if (!window.confirm("Are you sure you want to sync AC amenities for all 1-click approved messes and their rooms?")) return;
        
        setMigrationStatus({ loading: true, msg: 'Syncing AC amenities...', type: 'info' });
        try {
            let messSyncCount = 0;
            let roomSyncCount = 0;
            
            const messesSnapshot = await getDocs(collection(db, "messes"));
            const roomsSnapshot = await getDocs(collection(db, "rooms"));
            
            for (const messDoc of messesSnapshot.docs) {
                const messData = messDoc.data();
                const partnerId = messData.partnerId || '';
                
                // Only sync 1-click messes (partnerId starting with 'MK-')
                if (partnerId.startsWith('MK-')) {
                    const facilities = messData.facilities || [];
                    const amenities = messData.amenities || {};
                    const hasACFacility = facilities.includes('AC');
                    
                    // Update mess-level AC amenity if facilities includes 'AC' but amenities.ac is not true
                    if (hasACFacility && !amenities.ac) {
                        const updatedAmenities = { ...amenities, ac: true };
                        await updateDoc(doc(db, "messes", messDoc.id), {
                            amenities: updatedAmenities
                        });
                        messSyncCount++;
                    }
                    
                    // Update room-level AC amenities for this mess if the mess has AC facility
                    if (hasACFacility) {
                        for (const roomDoc of roomsSnapshot.docs) {
                            const roomData = roomDoc.data();
                            if (roomData.messId === messDoc.id) {
                                const roomAmenities = roomData.amenities || {};
                                if (!roomAmenities.ac) {
                                    await updateDoc(doc(db, "rooms", roomDoc.id), {
                                        amenities: { ...roomAmenities, ac: true }
                                    });
                                    roomSyncCount++;
                                }
                            }
                        }
                    }
                }
            }
            
            setMigrationStatus({
                loading: false,
                msg: `AC sync successful: ${messSyncCount} messes and ${roomSyncCount} rooms updated.`,
                type: 'success'
            });
        } catch (error) {
            console.error("AC sync failed:", error);
            setMigrationStatus({ loading: false, msg: error.message, type: 'error' });
        }
    };

    const generatePartnerId = () => {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let rand = '';
        for (let i = 0; i < 4; i++) {
            rand += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return `MK-${yy}${mm}-${rand}`;
    };

    const handleApproveRegistration = (reg) => {
        // Sanitize phone number to create a valid email
        const sanitizedPhone = (reg.phoneNumber || 'owner').replace(/[^a-zA-Z0-9]/g, '');
        setApproveModal({
            isOpen: true,
            reg: reg,
            email: sanitizedPhone + "@messkhojo.com",
            password: "MK" + Math.floor(100000 + Math.random() * 900000),
            loading: false
        });
    };

    const confirmApproveRegistration = async (e) => {
        e.preventDefault();
        const { reg, email, password } = approveModal;
        
        if (!email.trim() || password.length < 6) {
            alert("Valid email and password (min 6 chars) are required.");
            return;
        }

        setApproveModal(prev => ({ ...prev, loading: true }));

        try {
            const secondaryAuth = getSecondaryAuth();
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
            const newUser = userCredential.user;
            await signOut(secondaryAuth);

            const partnerId = generatePartnerId();

            await setDoc(doc(db, "users", newUser.uid), {
                uid: newUser.uid,
                email: email,
                role: 'admin',
                partnerId: partnerId,
                createdAt: serverTimestamp()
            });

            const roomTypes = reg.roomTypes || [];
            const rentInfo = reg.rentInfo || {};
            const facilities = reg.facilities || [];
            const includedInRent = reg.includedInRent || [];

            let locationGeopoint = null;
            if (reg.gpsLatitude !== undefined && reg.gpsLatitude !== null &&
                reg.gpsLongitude !== undefined && reg.gpsLongitude !== null) {
                locationGeopoint = new GeoPoint(Number(reg.gpsLatitude), Number(reg.gpsLongitude));
            }

            // Build amenities object from new facilities array (backward compat with old amenities field)
            const amenitiesObj = {
                food: facilities.includes('Food Facility') || false,
                wifi: facilities.includes('Wifi') || false,
                inverter: facilities.includes('InverterPower') || false,
                ac: facilities.includes('AC') || false,
            };

            const regAdv = reg.advancePayment || { type: 'None' };
            const regMaint = reg.maintenanceCharge || { taken: false };
            let derivedDeposit = '';
            if (regAdv.type && regAdv.type !== 'None') {
                derivedDeposit = regAdv.type === 'Custom Amount' ? `₹${regAdv.customAmount}` : regAdv.type;
            }
            if (regMaint.taken && regMaint.amount) {
                const maintStr = ` + ₹${regMaint.amount} maintenance (${regMaint.frequency || 'Per Year'})`;
                derivedDeposit = derivedDeposit ? `${derivedDeposit}${maintStr}` : `₹${regMaint.amount} maintenance (${regMaint.frequency || 'Per Year'})`;
            }

            // 'name' is the correct field used by AdminDashboard and Home page
            const messDocData = {
                adminId: newUser.uid,
                partnerId: partnerId,
                name: reg.messName,
                district: reg.district || 'balasore',
                address: reg.landmark || '',
                contact: reg.phoneNumber || '',
                email: email,
                messType: reg.messType || [],
                gender: reg.gender || 'Any',
                managedBy: reg.managedBy || '',
                facilities: facilities,
                amenities: amenitiesObj,
                includedInRent: includedInRent,
                advancePayment: regAdv,
                maintenanceCharge: regMaint,
                advanceDeposit: derivedDeposit,
                location: locationGeopoint,
                latitude: reg.gpsLatitude ? Number(reg.gpsLatitude) : null,
                longitude: reg.gpsLongitude ? Number(reg.gpsLongitude) : null,
                gpsAccuracy: reg.gpsAccuracy || null,
                landmark: reg.landmark || '',
                isVerified: true,
                isUserSourced: false,
                createdAt: serverTimestamp(),
                rentCycle: reg.rentCycle || 'monthly',
                minStayDuration: reg.minStayDuration || 1
            };

            const messDocRef = await addDoc(collection(db, "messes"), messDocData);

            // Create room docs — supports new roomVariants schema and falls back to old rentInfo+vacantRooms
            const getOccupancyNum = (roomType) => {
                const s = roomType.toLowerCase();
                if (s.includes('1') || s.includes('single')) return 1;
                if (s.includes('2') || s.includes('double')) return 2;
                if (s.includes('3') || s.includes('triple')) return 3;
                if (s.includes('4')) return 4;
                if (s.includes('5')) return 5;
                if (s.includes('6')) return 6;
                if (s.includes('7')) return 7;
                return 2;
            };

            const roomCreatePromises = roomTypes.flatMap(roomType => {
                const occupancyNum = getOccupancyNum(roomType);
                // New schema: roomVariants
                if (reg.roomVariants && reg.roomVariants[roomType] && reg.roomVariants[roomType].length > 0) {
                    return reg.roomVariants[roomType].map(variant => {
                        const label = variant.label ? variant.label.trim() : '';
                        const category = label ? `${roomType} (${label})` : roomType;
                        return addDoc(collection(db, "rooms"), {
                            messId: messDocRef.id,
                            messName: reg.messName,
                            district: reg.district || 'balasore',
                            occupancy: String(occupancyNum),
                            category,
                            price: Number(variant.price) || 0,
                            totalInventory: 1,
                            availableCount: variant.isVacant ? 1 : 0,
                            amenities: { ac: facilities.includes('AC') || label.toLowerCase().includes('ac'), attachedBathroom: false },
                            imageUrls: [],
                            imageUrl: '',
                            createdAt: serverTimestamp(),
                            rentCycle: reg.rentCycle || 'monthly',
                            minStayDuration: reg.minStayDuration || 1
                        });
                    });
                }
                // Old schema fallback: rentInfo + vacantRooms
                const isVacant = reg.vacantRooms?.includes(roomType) || false;
                return [addDoc(collection(db, "rooms"), {
                    messId: messDocRef.id,
                    messName: reg.messName,
                    district: reg.district || 'balasore',
                    occupancy: String(occupancyNum),
                    category: roomType,
                    price: Number(rentInfo[roomType]) || 0,
                    totalInventory: 1,
                    availableCount: isVacant ? 1 : 0,
                    amenities: { ac: facilities.includes('AC'), attachedBathroom: false },
                    imageUrls: [],
                    imageUrl: '',
                    createdAt: serverTimestamp(),
                    rentCycle: reg.rentCycle || 'monthly',
                    minStayDuration: reg.minStayDuration || 1
                })];
            });
            await Promise.all(roomCreatePromises);

            await updateDoc(doc(db, "mess_registrations", reg.id), {
                status: 'approved',
                approvedAt: serverTimestamp(),
                partnerId: partnerId,
                messId: messDocRef.id,
                ownerUid: newUser.uid,
                ownerEmail: email
            });

            try {
                const message = `🎉 <b>MESS REGISTRATION APPROVED!</b>\n\n` +
                    `🏢 <b>Mess:</b> ${reg.messName}\n` +
                    `👤 <b>Partner ID:</b> <code>${partnerId}</code>\n` +
                    `📧 <b>Owner Email:</b> ${email}\n` +
                    `🔑 <b>Password:</b> <code>${password}</code>\n` +
                    `📍 <b>GPS:</b> ${locationGeopoint ? `${reg.gpsLatitude}, ${reg.gpsLongitude}` : 'Not provided'}\n` +
                    `🆔 <b>Mess ID:</b> <code>${messDocRef.id}</code>\n\n` +
                    `<i>Mess listing and owner dashboard are now fully active!</i>`;
                await sendTelegramNotification(message);
            } catch (telegramErr) {
                console.error("Telegram notification failed:", telegramErr);
            }

            setApproveModal({ isOpen: false, reg: null, email: '', password: '', loading: false });
            alert(`Successfully approved and registered!\nPartner ID: ${partnerId}\nEmail: ${email}\nPassword: ${password}`);

        } catch (error) {
            console.error("Approve & Register failed:", error);
            setApproveModal(prev => ({ ...prev, loading: false }));
            alert("Approve & Register failed: " + error.message);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        navigate('/');
    };

    const getMessDistrict = (messId) => {
        if (!messId) return 'balasore';
        const mess = allMesses.find(m => m.id === messId);
        return mess?.district || 'balasore';
    };

    const registrations = allRegistrations.filter(r => opFilterDistrict === 'all' || (r.district || 'balasore') === opFilterDistrict);
    const bookings = allBookings.filter(b => opFilterDistrict === 'all' || getMessDistrict(b.messId) === opFilterDistrict);
    const inquiries = allInquiries.filter(i => opFilterDistrict === 'all' || getMessDistrict(i.messId) === opFilterDistrict);
    const roomInquiries = allRoomInquiries.filter(i => opFilterDistrict === 'all' || getMessDistrict(i.messId) === opFilterDistrict);
    const claims = allClaims.filter(c => opFilterDistrict === 'all' || getMessDistrict(c.messId) === opFilterDistrict);
    const messes = allMesses.filter(m => opFilterDistrict === 'all' || (m.district || 'balasore') === opFilterDistrict);
    const rooms = allRooms.filter(r => opFilterDistrict === 'all' || getMessDistrict(r.messId) === opFilterDistrict);

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
                    <select
                        value={opFilterDistrict}
                        onChange={(e) => setOpFilterDistrict(e.target.value)}
                        className="bg-slate-700 text-slate-200 border border-slate-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 capitalize"
                    >
                        <option value="all">All Districts</option>
                        <option value="balasore">Balasore</option>
                        <option value="bhadrak">Bhadrak</option>
                    </select>
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

                    <div className="pt-4 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4">
                        Marketing
                    </div>

                    <button
                        onClick={() => setActiveTab('hero_ads')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'hero_ads'
                            ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20'
                            : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                            }`}
                    >
                        <Image size={20} />
                        Hero Ads
                    </button>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-4 md:p-8 overflow-y-auto">

                    {/* BOOKINGS TAB */}
                    {activeTab === 'bookings' && (
                        <BookingsTab 
                            bookings={bookings}
                            revealedIds={revealedIds}
                            setRevealedIds={setRevealedIds}
                            bookingRemarks={bookingRemarks}
                            setBookingRemarks={setBookingRemarks}
                            bookingActionLoading={bookingActionLoading}
                            handleBookingAction={handleBookingAction}
                        />
                    )}

                    {/* CLAIMS TAB */}
                    {activeTab === 'claims' && (
                        <ClaimsTab claims={claims} />
                    )}

                    {/* REGISTRATIONS TAB */}
                    {activeTab === 'registrations' && (
                        <RegistrationsTab 
                            registrations={registrations} 
                            handleApproveRegistration={handleApproveRegistration}
                        />
                    )}

                    {/* INQUIRIES TAB */}
                    {activeTab === 'inquiries' && (
                        <InquiriesTab inquiries={inquiries} />
                    )}


                    {/* PARTNERS TAB */}
                    {activeTab === 'partners' && (
                        <PartnersTab 
                            partnerStatus={partnerStatus} partnerEmail={partnerEmail} setPartnerEmail={setPartnerEmail} 
                            partnerPassword={partnerPassword} setPartnerPassword={setPartnerPassword} handleCreatePartner={handleCreatePartner} 
                            updatePasswordStatus={updatePasswordStatus} updatePartnerEmail={updatePartnerEmail} setUpdatePartnerEmail={setUpdatePartnerEmail} 
                            updatePartnerPassword={updatePartnerPassword} setUpdatePartnerPassword={setUpdatePartnerPassword} handleUpdatePassword={handleUpdatePassword} 
                            migrationStatus={migrationStatus} handleMigratePartners={handleMigratePartners} handleBackfillDistricts={handleBackfillDistricts} handleSyncACAmenities={handleSyncACAmenities}
                        />
                    )}

                    {/* NEW ROOM INQUIRIES TAB */}
                    {activeTab === 'room_inquiries' && (
                        <RoomInquiriesTab roomInquiries={allRoomInquiries} />
                    )}

                    {/* FEEDBACKS TAB */}
                    {activeTab === 'feedbacks' && (
                        <FeedbacksTab feedbacks={feedbacks} feedbackReplies={feedbackReplies} setFeedbackReplies={setFeedbackReplies} />
                    )}

                    {/* ALL MESSES MANAGEMENT */}
                    {activeTab === 'messes' && (
                        <MessesTab messes={allMesses} searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleToggleVisibility={handleToggleVisibility} handleToggleSponsored={handleToggleSponsored} handleEditItem={handleEditItem} />
                    )}

                    {/* ALL ROOMS MANAGEMENT */}
                    {activeTab === 'rooms' && (
                        <RoomsTab rooms={allRooms} searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleEditItem={handleEditItem} />
                    )}

                    {/* HERO ADS TAB */}
                    {activeTab === 'hero_ads' && (
                        <HeroAdsTab 
                            carouselEnabled={carouselEnabled} handleToggleCarousel={handleToggleCarousel} 
                            desktopAds={desktopAds} mobileAds={mobileAds} 
                            desktopAdFile={desktopAdFile} setDesktopAdFile={setDesktopAdFile} 
                            mobileAdFile={mobileAdFile} setMobileAdFile={setMobileAdFile} 
                            heroAdUploading={heroAdUploading} heroAdForm={heroAdForm} setHeroAdForm={setHeroAdForm} 
                            handleHeroAdUpload={handleHeroAdUpload} handleReorderHeroAd={handleReorderHeroAd} 
                            handleToggleHeroAd={handleToggleHeroAd} handleDeleteHeroAd={handleDeleteHeroAd} 
                        />
                    )}
                </main>
            </div>

            {/* Save Toast Notification */}
            {saveToast && (
                <div className={`fixed bottom-6 right-6 z-[999] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border text-sm font-bold animate-in slide-in-from-bottom-4 duration-300 ${
                    saveToast.type === 'error'
                        ? 'bg-red-900/90 border-red-700 text-red-200'
                        : 'bg-emerald-900/90 border-emerald-700 text-emerald-200'
                }`}>
                    {saveToast.message}
                </div>
            )}

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
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                        <div>
                                            <label className="block text-xs font-bold text-amber-500 uppercase mb-2">Sponsor Rank</label>
                                            <input
                                                type="number"
                                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-amber-500"
                                                value={editForm.sponsorRank || ''}
                                                onChange={e => setEditForm({ ...editForm, sponsorRank: e.target.value })}
                                                placeholder="1 = Top Rank"
                                            />
                                        </div>
                                    </div>

                                    {/* District — EDITABLE by operator */}
                                    <div>
                                        <label className="block text-xs font-bold text-indigo-400 uppercase mb-2">District (Operator Only)</label>
                                        <select
                                            className="w-full bg-slate-900 border border-indigo-500/40 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                            value={editForm.district || 'balasore'}
                                            onChange={e => setEditForm({ ...editForm, district: e.target.value })}
                                        >
                                            <option value="balasore">Balasore</option>
                                            <option value="bhadrak">Bhadrak</option>
                                        </select>
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

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Rent Billing Cycle</label>
                                            <select
                                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                                value={editForm.rentCycle || 'monthly'}
                                                onChange={e => setEditForm({ ...editForm, rentCycle: e.target.value })}
                                            >
                                                <option value="monthly">Monthly Basis</option>
                                                <option value="yearly">Yearly Basis</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Minimum Stay (Months)</label>
                                            <input
                                                type="number"
                                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                                value={editForm.minStayDuration || 1}
                                                onChange={e => setEditForm({ ...editForm, minStayDuration: parseInt(e.target.value) || 1 })}
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
                                                <option value="1">1 Seater (Single)</option>
                                                <option value="2">2 Seater (Double)</option>
                                                <option value="3">3 Seater (Triple)</option>
                                                <option value="4">4 Seater</option>
                                                <option value="5">5 Seater</option>
                                                <option value="6">6 Seater</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                                                Price
                                                <span className="ml-1 text-emerald-400 lowercase font-normal">
                                                    ({messes.find(m => m.id === editingItem?.messId)?.rentCycle === 'yearly' ? '₹/year' : '₹/month'})
                                                </span>
                                            </label>
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

                                    <div className="pt-2 border-t border-slate-700">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                                            Room Photos (Max 5)
                                        </label>
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={(e) => setEditGalleryFiles(e.target.files)}
                                            className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-cyan-500/10 file:text-cyan-400 hover:file:bg-cyan-500/20"
                                        />

                                        {editForm.imageUrls?.length > 0 && (
                                            <div className="mt-4">
                                                <p className="text-xs text-slate-500 mb-2 font-medium">Current Photos ({editForm.imageUrls.length}/5):</p>
                                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                                    {editForm.imageUrls.map((url, idx) => (
                                                        <div key={idx} className="relative group rounded-md overflow-hidden border border-slate-700 shadow-sm aspect-square bg-slate-900">
                                                            <img src={url} alt={`Room Photo ${idx + 1}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
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

            {approveModal.isOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-800 rounded-3xl p-6 md:p-8 w-full max-w-md border border-slate-700 shadow-2xl overflow-y-auto max-h-[90vh]">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <CheckCircle className="text-emerald-500" /> Approve & Register
                        </h3>
                        <p className="text-slate-400 text-sm mb-6">Set up owner account for <span className="text-emerald-400 font-bold">{approveModal.reg?.messName}</span>.</p>
                        
                        <form onSubmit={confirmApproveRegistration} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Owner Email</label>
                                <input
                                    type="email"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-emerald-500"
                                    value={approveModal.email}
                                    onChange={e => setApproveModal(prev => ({ ...prev, email: e.target.value }))}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Temporary Password</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                                    value={approveModal.password}
                                    onChange={e => setApproveModal(prev => ({ ...prev, password: e.target.value }))}
                                    required
                                    minLength={6}
                                />
                                <p className="text-xs text-slate-500 mt-2">Pass this securely to the mess owner.</p>
                            </div>

                            <div className="pt-6 flex flex-col md:flex-row gap-3">
                                <button
                                    type="button"
                                    onClick={() => setApproveModal({ ...approveModal, isOpen: false })}
                                    className="order-2 md:order-1 px-6 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold py-3 rounded-2xl transition-all border border-slate-600 w-full md:w-auto"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={approveModal.loading}
                                    className="order-1 md:order-2 flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 text-white font-bold py-3 rounded-2xl transition-all shadow-lg shadow-emerald-950/20 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    {approveModal.loading ? 'Registering...' : 'Approve & Register'}
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
