/* eslint-disable react-refresh/only-export-components */
import React, { useState, useEffect } from 'react';
import { 
    ChevronRight, ChevronLeft, Check, Building2, Users, BedDouble, 
    MapPin, Wifi, Phone, Send, X, Home, Navigation, ShieldCheck, 
    Image as ImageIcon, Video, UploadCloud, Plus, Trash2, Camera, Sparkles,
    Utensils, Droplets, Zap, Shield, Car
} from 'lucide-react';
import { db, storage } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { trackMessRegistration } from '../analytics';
import usePageSEO from '../hooks/usePageSEO';
import { useToast } from '../context/ToastContext';
import { DISTRICTS_CONFIG } from '../context/DistrictContext';
import { useDistrict } from '../context/DistrictContext';
import { BoysIcon, GirlsIcon, CoedIcon } from '../components/GenderIcons';

export const ROOM_SPECIFICITY_OPTIONS = [
    'Standard Non-AC',
    'AC Room',
    'Attached Washroom',
    'AC + Attached Washroom',
    'With Balcony',
    'Deluxe Room',
    'Ground Floor',
    'Top Floor',
    'Other'
];

const MessRegistration = () => {
    const navigate = useNavigate();
    const { error: toastError } = useToast();
    const { localitiesConfig, getLocalitiesForCity } = useDistrict();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [gpsLoading, setGpsLoading] = useState(false);
    const [uploadProgressText, setUploadProgressText] = useState('');

    const [formData, setFormData] = useState({
        messName: '',
        messType: ['Boys'],
        district: '',
        city: '',
        locality: '',
        address: '',
        gpsLatitude: null,
        gpsLongitude: null,
        gpsAccuracy: null,
        phoneNumber: '',
        totalBeds: '',
        totalRooms: '',
        buildingPhotos: [],
        roomTypes: [],
        roomVariants: {},

        // 1. Food
        foodAvailability: 'Food Available',
        managedBy: 'Owner',
        mealsPerDay: '3 Meals',
        foodType: 'Veg + Non-Veg',

        // 2. Water
        waterFacility: 'Both',

        // 3. Cleaning section (Clothes / Laundry)
        laundryFacility: 'Washing Machine',

        // 4. Cleaning service (Housekeeping)
        cleaningService: 'Both',

        // 5-8. Amenities (Y/N)
        wifi: true,
        powerBackup: true,
        cctv: true,
        wardenWatchman: true,

        // 9. Extra space
        extraSpace: [],

        // Page 4: Charges & Extra Details
        // 1. Charges
        rentCycle: 'monthly', // 'monthly' | 'yearly'
        securityDeposit: 'No Deposit', // 'No Deposit' | '1 Month' | '2 Months' | 'Custom'
        securityDepositCustom: '',
        advancePayment: '1 Month', // 'No Advance' | '1 Month' | '2 Months' | 'Custom'
        advancePaymentCustom: '',
        electricityBill: 'Included in Rent', // 'Included in Rent' | 'As per Meter' | 'Extra Fixed'
        electricityBillAmount: '',
        maintenanceFee: 'Included', // 'Included' | 'Extra Charge'
        maintenanceFeeAmount: '',
        cleaningCharges: 'Included in Rent', // 'Included in Rent' | 'Extra Charge' | 'None'
        cleaningChargesAmount: '',
        foodBill: 'Included in Rent', // 'Included in Rent' | 'Separate' | 'Self Cook'
        utensilsCharges: 'Provided', // 'Provided' | 'Chargeable' | 'Bring Own'

        // 2. Notice Period
        noticePeriod: '1 Month', // 'No Notice' | '15 Days' | '1 Month' | '2 Months' | '3 Months' | 'Other'
        noticePeriodCustom: '',

        // 3. Operating Since
        operatingSince: '', // e.g. '2020'

        facilities: [],
        consent: false
    });

    const totalSteps = 4;

    usePageSEO({
        title: 'Register Your Mess | MessKhojo',
        description: 'Register your boys, girls or co-ed mess on MessKhojo. Increase zero-broker visibility and get direct student bookings.',
        keywords: 'register mess balasore, list mess online, mess owners balasore, pg registration balasore, mess registration'
    });

    // Track when user starts registration
    useEffect(() => {
        trackMessRegistration(true);
    }, []);

    const handleNext = () => {
        if (step < totalSteps) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleCheckboxChange = (field, value) => {
        setFormData(prev => {
            const current = prev[field] || [];
            const updated = current.includes(value)
                ? current.filter(item => item !== value)
                : [...current, value];
            return { ...prev, [field]: updated };
        });
    };

    const handleRoomTypeToggle = (type) => {
        setFormData(prev => {
            const isSelected = prev.roomTypes.includes(type);
            const newRoomTypes = isSelected
                ? prev.roomTypes.filter(t => t !== type)
                : [...prev.roomTypes, type];
            const newRoomVariants = { ...prev.roomVariants };
            if (isSelected) {
                delete newRoomVariants[type];
            } else {
                newRoomVariants[type] = [{ label: '', price: '', isVacant: true, media: [] }];
            }
            return { ...prev, roomTypes: newRoomTypes, roomVariants: newRoomVariants };
        });
    };

    const updateVariant = (room, vIdx, field, value) => {
        setFormData(prev => {
            const variants = [...(prev.roomVariants[room] || [])];
            variants[vIdx] = { ...variants[vIdx], [field]: value };
            return { ...prev, roomVariants: { ...prev.roomVariants, [room]: variants } };
        });
    };

    const addVariant = (room) => {
        setFormData(prev => ({
            ...prev,
            roomVariants: {
                ...prev.roomVariants,
                [room]: [...(prev.roomVariants[room] || []), { label: '', price: '', isVacant: true, media: [] }]
            }
        }));
    };

    const removeVariant = (room, vIdx) => {
        setFormData(prev => {
            const variants = [...(prev.roomVariants[room] || [])].filter((_, i) => i !== vIdx);
            return { ...prev, roomVariants: { ...prev.roomVariants, [room]: variants } };
        });
    };

    const handleMediaAdd = (room, vIdx, files) => {
        if (!files || files.length === 0) return;
        const fileList = Array.from(files);
        
        const newMediaItems = fileList.map(file => ({
            file,
            name: file.name,
            type: file.type.startsWith('video/') ? 'video' : 'image',
            previewUrl: URL.createObjectURL(file)
        }));

        setFormData(prev => {
            const variants = [...(prev.roomVariants[room] || [])];
            const target = variants[vIdx] || { label: '', price: '', isVacant: true, media: [] };
            variants[vIdx] = {
                ...target,
                media: [...(target.media || []), ...newMediaItems]
            };
            return {
                ...prev,
                roomVariants: {
                    ...prev.roomVariants,
                    [room]: variants
                }
            };
        });
    };

    const handleMediaRemove = (room, vIdx, mIdx) => {
        setFormData(prev => {
            const variants = [...(prev.roomVariants[room] || [])];
            const target = variants[vIdx];
            if (!target) return prev;
            const updatedMedia = (target.media || []).filter((_, idx) => idx !== mIdx);
            variants[vIdx] = { ...target, media: updatedMedia };
            return {
                ...prev,
                roomVariants: {
                    ...prev.roomVariants,
                    [room]: variants
                }
            };
        });
    };

    const handleBuildingPhotoAdd = (files) => {
        if (!files || files.length === 0) return;
        const fileList = Array.from(files);
        const newItems = fileList.map(file => ({
            file,
            name: file.name,
            type: file.type.startsWith('video/') ? 'video' : 'image',
            previewUrl: URL.createObjectURL(file)
        }));
        setFormData(prev => ({
            ...prev,
            buildingPhotos: [...(prev.buildingPhotos || []), ...newItems]
        }));
    };

    const handleBuildingPhotoRemove = (idx) => {
        setFormData(prev => ({
            ...prev,
            buildingPhotos: (prev.buildingPhotos || []).filter((_, i) => i !== idx)
        }));
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleGetGPS = () => {
        if (!navigator.geolocation) {
            toastError('GPS location is not supported by your browser.');
            return;
        }
        setGpsLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData(prev => ({
                    ...prev,
                    gpsLatitude: position.coords.latitude,
                    gpsLongitude: position.coords.longitude,
                    gpsAccuracy: position.coords.accuracy,
                }));
                setGpsLoading(false);
            },
            (error) => {
                let errorMsg = "Unable to retrieve your location.";
                if (error.code === error.PERMISSION_DENIED) {
                    errorMsg = "Location access was denied. Please enable location permission for this website.";
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    errorMsg = "Location information is unavailable.";
                } else if (error.code === error.TIMEOUT) {
                    errorMsg = "The request to get user location timed out.";
                }
                toastError(`${errorMsg} You can still manually specify the address/locality.`);
                setGpsLoading(false);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    const handleSubmit = async () => {
        if (!formData.phoneNumber) {
            toastError('Phone number is mandatory!');
            return;
        }

        setLoading(true);
        setUploadProgressText('Processing registration...');

        try {
            const sanitizedMessName = (formData.messName || 'mess').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
            const processedVariants = {};
            const allGalleryUrls = [];

            // Upload room photos and videos to Firebase Storage if any were provided
            const roomEntries = Object.entries(formData.roomVariants);
            for (let rIdx = 0; rIdx < roomEntries.length; rIdx++) {
                const [room, variants] = roomEntries[rIdx];
                processedVariants[room] = [];

                for (let vIdx = 0; vIdx < variants.length; vIdx++) {
                    const v = variants[vIdx];
                    const mediaItems = v.media || [];
                    const uploadedMedia = [];

                    for (let mIdx = 0; mIdx < mediaItems.length; mIdx++) {
                        const item = mediaItems[mIdx];
                        if (item.file) {
                            setUploadProgressText(`Uploading ${room} media (${mIdx + 1}/${mediaItems.length})...`);
                            try {
                                const timestamp = Date.now();
                                const ext = item.file.name.split('.').pop() || (item.type === 'video' ? 'mp4' : 'jpg');
                                const storagePath = `mess_registrations/${sanitizedMessName}/${room.replace(/\s+/g, '_')}_v${vIdx}_${timestamp}_${mIdx}.${ext}`;
                                const storageRef = ref(storage, storagePath);
                                await uploadBytes(storageRef, item.file);
                                const downloadUrl = await getDownloadURL(storageRef);
                                uploadedMedia.push({
                                    url: downloadUrl,
                                    type: item.type,
                                    name: item.name
                                });
                                allGalleryUrls.push(downloadUrl);
                            } catch (uploadErr) {
                                console.warn('Storage upload notice:', uploadErr);
                            }
                        } else if (item.url) {
                            uploadedMedia.push(item);
                            allGalleryUrls.push(item.url);
                        }
                    }

                    processedVariants[room].push({
                        label: v.label || '',
                        price: v.price !== '' ? Number(v.price) : 0,
                        isVacant: !!v.isVacant,
                        mediaUrls: uploadedMedia
                    });
                }
            }

            // Upload Building Photos if provided
            const uploadedBuildingPhotos = [];
            const buildingItems = formData.buildingPhotos || [];
            for (let bIdx = 0; bIdx < buildingItems.length; bIdx++) {
                const item = buildingItems[bIdx];
                if (item.file) {
                    setUploadProgressText(`Uploading building photo (${bIdx + 1}/${buildingItems.length})...`);
                    try {
                        const timestamp = Date.now();
                        const ext = item.file.name.split('.').pop() || (item.type === 'video' ? 'mp4' : 'jpg');
                        const storagePath = `mess_registrations/${sanitizedMessName}/building_${timestamp}_${bIdx}.${ext}`;
                        const storageRef = ref(storage, storagePath);
                        await uploadBytes(storageRef, item.file);
                        const downloadUrl = await getDownloadURL(storageRef);
                        uploadedBuildingPhotos.push({
                            url: downloadUrl,
                            type: item.type,
                            name: item.name
                        });
                        allGalleryUrls.push(downloadUrl);
                    } catch (uploadErr) {
                        console.warn('Storage upload notice for building photo:', uploadErr);
                    }
                } else if (item.url) {
                    uploadedBuildingPhotos.push(item);
                    allGalleryUrls.push(item.url);
                }
            }

            // Build legacy rentInfo and vacantRooms structures for dashboard backwards compatibility
            const rentInfo = {};
            const vacantRooms = [];
            formData.roomTypes.forEach(type => {
                const firstVar = processedVariants[type]?.[0];
                if (firstVar) {
                    rentInfo[type] = firstVar.price;
                    if (firstVar.isVacant) {
                        vacantRooms.push(type);
                    }
                }
            });

            // Compute derived legacy facilities for filters/backward compatibility
            const derivedFacilities = [];
            if (formData.wifi) derivedFacilities.push('Wifi');
            if (formData.foodAvailability !== 'Self Cook') derivedFacilities.push('Food Facility');
            if (formData.powerBackup) derivedFacilities.push('InverterPower');
            if (formData.cctv) derivedFacilities.push('CCTV');
            if (formData.extraSpace?.includes('Parking')) derivedFacilities.push('Parking');

            // Compute derived includedInRent list for backward compatibility
            const derivedIncluded = [];
            if (formData.foodBill === 'Included in Rent') derivedIncluded.push('Food Charges');
            if (formData.electricityBill === 'Included in Rent') derivedIncluded.push('Electricity Bills');
            if (formData.cleaningCharges === 'Included in Rent') derivedIncluded.push('Cleaning Charges');
            if (formData.maintenanceFee === 'Included' || formData.maintenanceFee === 'Free / Included') derivedIncluded.push('Maintenance Fee');
            if (formData.utensilsCharges === 'Provided' || formData.utensilsCharges === 'Free / Provided') derivedIncluded.push('Utensils Charges');

            // Legacy advance payment structure
            const advanceStructure = {
                type: formData.advancePayment,
                customAmount: formData.advancePaymentCustom || ''
            };

            // Legacy maintenance structure
            const maintenanceStructure = {
                taken: formData.maintenanceFee === 'Extra Charge',
                amount: formData.maintenanceFeeAmount || '',
                frequency: 'Per Month'
            };

            const resolvedNoticePeriod = formData.noticePeriod === 'Other'
                ? (formData.noticePeriodCustom || '').trim()
                : formData.noticePeriod;

            const bedCount = formData.totalBeds || formData.totalRooms || '';
            const registrationData = {
                ...formData,
                gender: formData.gender || formData.messType?.[0] || 'Boys',
                noticePeriod: resolvedNoticePeriod,
                noticePeriodCustom: formData.noticePeriodCustom || '',
                totalBeds: bedCount,
                totalRooms: bedCount,
                roomVariants: processedVariants,
                buildingPhotos: uploadedBuildingPhotos,
                buildingPhotoUrls: uploadedBuildingPhotos.map(p => p.url),
                galleryUrls: allGalleryUrls,
                rentInfo: rentInfo,
                vacantRooms: vacantRooms,
                facilities: derivedFacilities,
                includedInRent: derivedIncluded,
                advancePayment: advanceStructure,
                advancePaymentRaw: formData.advancePayment || '',
                advancePaymentCustom: formData.advancePaymentCustom || '',
                maintenanceCharge: maintenanceStructure,
                landmark: formData.locality,  // backwards compat for existing code reading 'landmark'
                createdAt: serverTimestamp(),
                status: 'pending' // pending operator review
            };

            const docRef = await addDoc(collection(db, 'mess_registrations'), registrationData);

            // Send Telegram Notification
            import('../utils/telegramNotifier').then(({ sendTelegramNotification, telegramTemplates }) => {
                sendTelegramNotification(telegramTemplates.newRegistration(registrationData));
            });

            // Track successful registration
            trackMessRegistration(false, docRef.id);

            setStep(5); // Success step
        } catch (error) {
            console.error("Error submitting registration:", error);
            toastError('Failed to submit. Please try again.');
        } finally {
            setLoading(false);
            setUploadProgressText('');
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1: {
                const availableCitiesStep1 = formData.district ? DISTRICTS_CONFIG[formData.district]?.cities || [] : [];
                const availableLocalitiesStep1 = getLocalitiesForCity(formData.city, localitiesConfig);

                return (
                    <div className="space-y-3.5 sm:space-y-4 flex-1 overflow-y-auto no-scrollbar px-0.5 sm:px-1 pb-2 sm:pb-3">
                        {/* Title Header */}
                        <div className="text-center space-y-1 sm:space-y-1.5 mb-3 sm:mb-4">
                            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-2.5">
                                <Building2 size={22} className="text-[#300868] sm:hidden" />
                                <Building2 size={24} className="text-[#300868] hidden sm:block" />
                            </div>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                                Mess Details
                            </h1>
                            <p className="text-[11px] sm:text-xs text-gray-500 font-medium">Enter your basic mess details, location & contact info</p>
                        </div>

                        {/* 1. Mess Name */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                                Mess Name
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={formData.messName}
                                    onChange={(e) => handleChange('messName', e.target.value)}
                                    placeholder="e.g. Sunrise Executive Boys Mess & PG"
                                    className="w-full text-sm pl-10 pr-4 py-2.5 sm:py-3 border-2 border-gray-100 rounded-xl focus:border-[#300868] focus:ring-4 focus:ring-[#300868]/10 outline-none transition-all placeholder:text-gray-300 font-medium text-gray-800"
                                    autoFocus
                                />
                                <Building2 size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#300868] pointer-events-none" />
                            </div>
                        </div>

                        {/* 2. Mess Type (Girls, Boys, Co-ed) */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                                Mess Type
                            </label>
                            <div className="grid grid-cols-3 gap-2.5">
                                {[
                                    { type: 'Boys', label: 'Boys', activeColor: 'text-blue-600', activeBg: 'border-blue-500 bg-blue-50 text-blue-900 shadow-sm shadow-blue-500/10' },
                                    { type: 'Girls', label: 'Girls', activeColor: 'text-pink-400', activeBg: 'border-pink-300 bg-pink-50 text-pink-700 shadow-sm shadow-pink-300/20' },
                                    { type: 'Co-ed', label: 'Co-ed', activeColor: 'text-[#300868]', activeBg: 'border-[#300868] bg-purple-50 text-[#300868] shadow-sm shadow-purple-950/10' }
                                ].map(({ type, label, activeColor, activeBg }) => {
                                    const isSelected = formData.messType.includes(type);
                                    return (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => handleChange('messType', [type])}
                                            className={`py-2.5 px-2 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 text-center ${
                                                isSelected
                                                    ? activeBg
                                                    : 'border-gray-100 bg-white hover:border-blue-200 text-gray-700 hover:shadow-sm'
                                            }`}
                                        >
                                            <div className="h-10 flex items-center justify-center">
                                                {type === 'Boys' && <BoysIcon className={`w-7 h-9 ${isSelected ? activeColor : 'text-gray-400'}`} />}
                                                {type === 'Girls' && <GirlsIcon className={`w-7 h-9 ${isSelected ? activeColor : 'text-gray-400'}`} />}
                                                {type === 'Co-ed' && <CoedIcon className={`w-11 h-9 ${isSelected ? activeColor : 'text-gray-400'}`} />}
                                            </div>
                                            <span className="font-bold text-xs flex items-center justify-center gap-1">
                                                {label}
                                                {isSelected && <Check size={12} className="text-current stroke-[3]" />}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 3. Location - District, City, Locality & GPS */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                                Location
                            </label>
                            
                            {/* Row 1: District & City */}
                            <div className="grid grid-cols-2 gap-2.5">
                                <div>
                                    <span className="text-[11px] font-bold text-gray-500 block mb-1">District</span>
                                    <select
                                        value={formData.district}
                                        onChange={(e) => {
                                            handleChange('district', e.target.value);
                                            handleChange('city', '');
                                            handleChange('locality', '');
                                            handleChange('localityType', '');
                                            handleChange('customLocality', '');
                                        }}
                                        className="w-full text-xs sm:text-sm py-2.5 px-3 border-2 border-gray-100 rounded-xl focus:border-[#300868] outline-none transition-all bg-white font-medium text-gray-700 capitalize cursor-pointer"
                                    >
                                        <option value="" className="normal-case">Select District</option>
                                        {Object.keys(DISTRICTS_CONFIG).map(dist => (
                                            <option key={dist} value={dist} className="capitalize">
                                                {DISTRICTS_CONFIG[dist]?.name || dist.charAt(0).toUpperCase() + dist.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <span className="text-[11px] font-bold text-gray-500 block mb-1">City / Town</span>
                                    <select
                                        value={formData.city}
                                        onChange={(e) => {
                                            handleChange('city', e.target.value);
                                            handleChange('locality', '');
                                            handleChange('localityType', '');
                                            handleChange('customLocality', '');
                                        }}
                                        disabled={!formData.district}
                                        className="w-full text-xs sm:text-sm py-2.5 px-3 border-2 border-gray-100 rounded-xl focus:border-[#300868] outline-none transition-all bg-white font-medium text-gray-700 disabled:opacity-50 cursor-pointer"
                                    >
                                        <option value="">Select City</option>
                                        {availableCitiesStep1.map(city => (
                                            <option key={city.id} value={city.id}>{city.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Row 2: Locality & GPS Autofill */}
                            <div className="grid grid-cols-2 gap-2.5">
                                <div>
                                    <span className="text-[11px] font-bold text-gray-500 block mb-1">
                                        Locality / Area
                                    </span>
                                    <select
                                        value={
                                            formData.localityType !== undefined 
                                                ? formData.localityType 
                                                : (availableLocalitiesStep1.includes(formData.locality) ? formData.locality : (formData.locality ? 'Other' : ''))
                                        }
                                        onChange={(e) => {
                                            const selected = e.target.value;
                                            if (selected === 'Other') {
                                                setFormData(prev => ({ ...prev, localityType: 'Other', locality: prev.customLocality || '' }));
                                            } else {
                                                setFormData(prev => ({ ...prev, localityType: selected, locality: selected }));
                                            }
                                        }}
                                        disabled={!formData.city}
                                        className="w-full text-xs sm:text-sm py-2.5 px-3 border-2 border-gray-100 rounded-xl focus:border-[#300868] outline-none transition-all bg-white font-medium text-gray-700 disabled:opacity-50 cursor-pointer"
                                    >
                                        <option value="">Select Locality</option>
                                        {availableLocalitiesStep1.map(loc => (
                                            <option key={loc} value={loc}>{loc}</option>
                                        ))}
                                        {availableLocalitiesStep1.length > 0 && <option value="Other">Other (Custom Locality)</option>}
                                    </select>

                                    {/* Custom Locality Input if Other is selected */}
                                    {(formData.localityType === 'Other' || (!availableLocalitiesStep1.includes(formData.locality) && formData.locality && formData.localityType !== '')) && formData.city && (
                                        <input
                                            type="text"
                                            value={formData.customLocality !== undefined ? formData.customLocality : formData.locality}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setFormData(prev => ({ ...prev, customLocality: val, locality: val }));
                                            }}
                                            placeholder="Enter custom locality"
                                            className="w-full text-xs sm:text-sm py-2 px-3 border-2 border-purple-100 rounded-xl focus:border-[#300868] outline-none transition-all placeholder:text-gray-300 font-medium text-gray-800 mt-1.5"
                                            autoFocus
                                        />
                                    )}
                                </div>

                                <div>
                                    <span className="text-[11px] font-bold text-gray-500 block mb-1">
                                        GPS Coordinates
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleGetGPS}
                                        disabled={gpsLoading}
                                        className={`w-full py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 ${
                                            formData.gpsLatitude
                                                ? 'bg-purple-50/80 border-purple-200 text-[#300868]'
                                                : 'bg-[#300868] hover:bg-[#250552] border-[#300868] text-white shadow-sm'
                                        }`}
                                    >
                                        <MapPin size={15} className={`shrink-0 ${formData.gpsLatitude ? 'text-[#300868]' : 'text-white'}`} />
                                        <span>{gpsLoading ? 'Locating...' : formData.gpsLatitude ? `${formData.gpsLatitude.toFixed(3)}, ${formData.gpsLongitude.toFixed(3)}` : 'Auto Fill GPS'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 4. Full Address */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                                Address
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => handleChange('address', e.target.value)}
                                    placeholder="e.g. Plot No. 124, Station Road, Balasore"
                                    className="w-full text-sm pl-10 pr-4 py-2.5 sm:py-3 border-2 border-gray-100 rounded-xl focus:border-[#300868] focus:ring-4 focus:ring-[#300868]/10 outline-none transition-all placeholder:text-gray-300 font-medium text-gray-800"
                                />
                                <Home size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#300868] pointer-events-none" />
                            </div>
                        </div>

                        {/* 5. Contact Details */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                                Contact Details (Phone Number)
                            </label>
                            <div className="relative">
                                <input
                                    type="tel"
                                    value={formData.phoneNumber}
                                    onChange={(e) => handleChange('phoneNumber', e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    placeholder="e.g. 9876543210"
                                    maxLength="10"
                                    className="w-full text-sm pl-10 pr-4 py-2.5 sm:py-3 border-2 border-gray-100 rounded-xl focus:border-[#300868] focus:ring-4 focus:ring-[#300868]/10 outline-none transition-all placeholder:text-gray-300 font-mono font-bold tracking-wider text-gray-800"
                                />
                                <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#300868] pointer-events-none" />
                            </div>
                        </div>
                    </div>
                );
            }
            case 2:
                return (
                    <div className="space-y-3.5 sm:space-y-4 flex-1 overflow-y-auto no-scrollbar px-0.5 sm:px-1 pb-2 sm:pb-3">
                        {/* Title Header */}
                        <div className="text-center space-y-1 sm:space-y-1.5 mb-3 sm:mb-4">
                            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-2.5">
                                <BedDouble size={22} className="text-[#300868] sm:hidden" />
                                <BedDouble size={24} className="text-[#300868] hidden sm:block" />
                            </div>
                            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">Room Pricing & Features</h2>
                            <p className="text-[11px] sm:text-xs text-gray-500 font-medium">Configure total beds, sharing types, prices & features</p>
                        </div>

                        {/* 1. Total Number of Beds & Mess Building Photo */}
                        <div className="grid grid-cols-2 gap-2.5 items-start">
                            {/* Left: Total Beds */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider block truncate">
                                    Total Number of Beds
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    inputMode="numeric"
                                    value={formData.totalBeds || formData.totalRooms}
                                    onChange={(e) => {
                                        handleChange('totalBeds', e.target.value);
                                        handleChange('totalRooms', e.target.value);
                                    }}
                                    onWheel={(e) => e.target.blur()}
                                    placeholder="e.g. 20"
                                    className="w-full text-xs sm:text-sm py-2.5 sm:py-3 px-3 border-2 border-gray-100 rounded-xl focus:border-[#300868] focus:ring-4 focus:ring-[#300868]/10 outline-none transition-all placeholder:text-gray-300 font-medium text-gray-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    autoFocus
                                />
                            </div>

                            {/* Right: Mess Building Photo */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider block truncate">
                                    Mess Building Photo
                                </label>
                                <div>
                                    <label className="w-full flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-2 sm:px-3 border-2 border-dashed border-purple-200 hover:border-[#300868] bg-purple-50/50 hover:bg-purple-50 rounded-xl transition-all cursor-pointer text-[11px] sm:text-xs font-bold text-[#300868]">
                                        <Building2 size={15} className="text-[#300868] shrink-0" />
                                        <span className="truncate">Upload Building Photo</span>
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => handleBuildingPhotoAdd(e.target.files)}
                                        />
                                    </label>
                                </div>

                                {/* Building Photo Previews */}
                                {formData.buildingPhotos && formData.buildingPhotos.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {formData.buildingPhotos.map((item, bIdx) => (
                                            <div key={bIdx} className="relative w-12 h-12 rounded-lg overflow-hidden border border-purple-200 shadow-2xs group shrink-0">
                                                <img
                                                    src={item.previewUrl}
                                                    alt={item.name || 'Building photo'}
                                                    className="w-full h-full object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleBuildingPhotoRemove(bIdx)}
                                                    className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/70 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                                                    title="Remove photo"
                                                >
                                                    <X size={10} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. Types of Room Available */}
                        <div className="space-y-2 pt-2 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                                    Types of Room Available
                                </label>
                                <span className="text-[11px] text-gray-400 font-medium">(Select all available)</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {['1 Seater', '2 Seater', '3 Seater', '4 Seater', '5 Seater', '6 Seater', '7 Seater'].map(type => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => handleRoomTypeToggle(type)}
                                        className={`min-h-[38px] sm:min-h-[40px] py-2 px-2 rounded-xl border-2 transition-all text-xs font-bold flex items-center justify-center gap-1.5 text-center leading-snug ${
                                            formData.roomTypes.includes(type)
                                                ? 'border-[#300868] bg-purple-50 text-[#300868] shadow-sm shadow-purple-900/5'
                                                : 'border-gray-100 bg-white hover:border-purple-200 text-gray-600'
                                        }`}
                                    >
                                        {formData.roomTypes.includes(type) && <Check size={13} className="text-[#300868] stroke-[3]" />}
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 3. Room Configurations (Price, Specificity, Photos/Videos, Vacancy) */}
                        {formData.roomTypes.length > 0 && (
                            <div className="space-y-3 pt-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                        Room Pricing & Features
                                    </span>
                                </div>

                                {formData.roomTypes.map(room => {
                                    const variants = formData.roomVariants[room] || [];
                                    return (
                                        <div key={room} className="bg-purple-50/40 p-3.5 sm:p-4 rounded-2xl border border-purple-100 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                                                    <BedDouble size={16} className="text-[#300868]" />
                                                    {room}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => addVariant(room)}
                                                    className="text-[11px] font-bold text-[#300868] hover:text-[#250552] border border-purple-200 bg-white px-2.5 py-1 rounded-lg transition-all shadow-2xs flex items-center gap-1"
                                                >
                                                    <Plus size={12} /> Add Variant
                                                </button>
                                            </div>

                                            {variants.map((variant, vIdx) => (
                                                <div key={vIdx} className="bg-white p-3 rounded-xl border border-purple-100/80 shadow-2xs space-y-2.5">
                                                    {variants.length > 1 && (
                                                        <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                                                            <span className="text-[11px] font-bold text-[#300868]">Variant {vIdx + 1}</span>
                                                            <button 
                                                                type="button" 
                                                                onClick={() => removeVariant(room, vIdx)} 
                                                                className="text-[10px] text-red-500 hover:text-red-700 font-bold uppercase"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Facilities Dropdown with Other Custom Write-In Option */}
                                                    <div className="space-y-1.5">
                                                        <span className="text-[10px] font-bold text-gray-400 block mb-0.5 uppercase">Facilities</span>
                                                        <select
                                                            value={
                                                                variant.specificityType !== undefined 
                                                                    ? variant.specificityType 
                                                                    : (ROOM_SPECIFICITY_OPTIONS.includes(variant.label) ? variant.label : (variant.label ? 'Other' : ''))
                                                            }
                                                            onChange={(e) => {
                                                                const selected = e.target.value;
                                                                if (selected === 'Other') {
                                                                    updateVariant(room, vIdx, 'specificityType', 'Other');
                                                                    updateVariant(room, vIdx, 'label', variant.customLabel || '');
                                                                } else {
                                                                    updateVariant(room, vIdx, 'specificityType', selected);
                                                                    updateVariant(room, vIdx, 'label', selected);
                                                                }
                                                            }}
                                                            className="w-full text-xs p-2.5 border-2 border-gray-100 rounded-xl focus:border-[#300868] outline-none transition-all bg-white font-medium text-gray-700 cursor-pointer"
                                                        >
                                                            <option value="">Select Facilities</option>
                                                            {ROOM_SPECIFICITY_OPTIONS.map(opt => (
                                                                <option key={opt} value={opt}>{opt}</option>
                                                            ))}
                                                        </select>

                                                        {/* If 'Other' is selected, display custom facilities text input */}
                                                        {(variant.specificityType === 'Other' || (!ROOM_SPECIFICITY_OPTIONS.includes(variant.label) && variant.label && variant.specificityType !== '')) && (
                                                            <input
                                                                type="text"
                                                                value={variant.customLabel !== undefined ? variant.customLabel : (ROOM_SPECIFICITY_OPTIONS.includes(variant.label) ? '' : variant.label)}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    updateVariant(room, vIdx, 'customLabel', val);
                                                                    updateVariant(room, vIdx, 'label', val);
                                                                }}
                                                                placeholder="Write custom facilities (e.g. Attached Washroom, Balcony)"
                                                                className="w-full text-xs p-2.5 border-2 border-purple-100 rounded-xl focus:border-[#300868] outline-none transition-all placeholder:text-gray-300 font-medium text-gray-800 mt-1.5"
                                                                autoFocus
                                                            />
                                                        )}
                                                    </div>

                                                    {/* Price and Vacancy Row */}
                                                    <div className="flex gap-2 items-center">
                                                        <div className="flex-1">
                                                            <span className="text-[10px] font-bold text-gray-400 block mb-0.5 uppercase">Rent (₹/month)</span>
                                                            <input
                                                                type="number"
                                                                inputMode="numeric"
                                                                value={variant.price}
                                                                onChange={(e) => updateVariant(room, vIdx, 'price', e.target.value)}
                                                                onWheel={(e) => e.target.blur()}
                                                                placeholder="Rent ₹/month"
                                                                className="w-full text-sm p-2.5 border-2 border-gray-100 rounded-xl focus:border-[#300868] outline-none transition-all font-medium text-gray-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                            />
                                                        </div>

                                                        <div className="shrink-0">
                                                            <span className="text-[10px] font-bold text-gray-400 block mb-0.5 uppercase">Status</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => updateVariant(room, vIdx, 'isVacant', !variant.isVacant)}
                                                                className={`px-3.5 py-2.5 rounded-xl border-2 text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                                                                    variant.isVacant
                                                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-2xs'
                                                                        : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
                                                                }`}
                                                            >
                                                                {variant.isVacant ? '✓ Vacant' : 'Occupied'}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Photos and Videos Upload Section */}
                                                    <div className="pt-1.5 border-t border-gray-50 space-y-2">
                                                        <div>
                                                            <label className="inline-flex items-center gap-1.5 text-xs font-bold text-[#300868] hover:text-[#250552] border border-purple-200 bg-purple-50/70 hover:bg-purple-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs">
                                                                <Plus size={14} className="stroke-[2.5]" />
                                                                Upload Photos & Videos
                                                                <input
                                                                    type="file"
                                                                    multiple
                                                                    accept="image/*,video/*"
                                                                    className="hidden"
                                                                    onChange={(e) => handleMediaAdd(room, vIdx, e.target.files)}
                                                                />
                                                            </label>
                                                        </div>

                                                        {/* Media Previews List */}
                                                        {variant.media && variant.media.length > 0 && (
                                                            <div className="flex flex-wrap gap-2 pt-1">
                                                                {variant.media.map((item, mIdx) => (
                                                                    <div key={mIdx} className="relative w-14 h-14 rounded-lg overflow-hidden border border-purple-200 bg-gray-900 group shrink-0">
                                                                        {item.type === 'video' ? (
                                                                            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-white p-1">
                                                                                <Video size={16} className="text-purple-300 mb-0.5" />
                                                                                <span className="text-[8px] font-bold uppercase tracking-tighter text-purple-200 truncate max-w-full">
                                                                                    Video
                                                                                </span>
                                                                            </div>
                                                                        ) : (
                                                                            <img
                                                                                src={item.previewUrl}
                                                                                alt={item.name || 'Room photo'}
                                                                                className="w-full h-full object-cover"
                                                                            />
                                                                        )}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleMediaRemove(room, vIdx, mIdx)}
                                                                            className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/70 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                                                                            title="Remove media"
                                                                        >
                                                                            <X size={10} />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-3.5 sm:space-y-4 flex-1 overflow-y-auto no-scrollbar px-0.5 sm:px-1 pb-2 sm:pb-4">
                        {/* Title Header */}
                        <div className="text-center space-y-1 sm:space-y-1.5 mb-3 sm:mb-4">
                            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-2.5">
                                <Utensils size={22} className="text-[#300868] sm:hidden" />
                                <Utensils size={24} className="text-[#300868] hidden sm:block" />
                            </div>
                            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">Food & Facilities</h2>
                            <p className="text-[11px] sm:text-xs text-gray-500 font-medium">Configure mess food, water, cleaning, utilities & spaces</p>
                        </div>

                        {/* 1. Food Section */}
                        <div className="bg-purple-50/40 p-3.5 sm:p-4 rounded-2xl border border-purple-100 space-y-3">
                            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Food</h3>

                            {/* Food Available / Self Cook */}
                            <div className="space-y-1.5">
                                <span className="text-[11px] font-bold text-gray-500 block">Food Option</span>
                                <div className="grid grid-cols-3 gap-2">
                                    {['Food Available', 'Self Cook', 'Both'].map(opt => (
                                        <button
                                            key={opt}
                                            type="button"
                                            onClick={() => handleChange('foodAvailability', opt)}
                                            className={`min-h-[38px] sm:min-h-[40px] py-2 px-1.5 rounded-xl border-2 transition-all text-xs font-bold text-center leading-snug flex items-center justify-center ${
                                                formData.foodAvailability === opt
                                                    ? 'border-[#300868] bg-white text-[#300868] shadow-xs'
                                                    : 'border-purple-100/60 bg-white/70 hover:border-purple-200 text-gray-600'
                                            }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Food Facility Managed by */}
                            <div className="space-y-1.5 pt-1.5 border-t border-purple-100/70">
                                <span className="text-[11px] font-bold text-gray-500 block">Food Facility Managed By</span>
                                <div className="grid grid-cols-3 gap-2">
                                    {[{ v: 'Owner', s: 'Manager' }, { v: 'Students', s: 'Self-managed' }, { v: 'Warden', s: 'Supervised' }].map(({ v, s }) => (
                                        <button
                                            key={v}
                                            type="button"
                                            onClick={() => handleChange('managedBy', v)}
                                            className={`min-h-[38px] sm:min-h-[40px] py-1.5 px-1 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-0.5 leading-tight ${
                                                formData.managedBy === v
                                                    ? 'border-[#300868] bg-white text-[#300868] font-bold shadow-xs'
                                                    : 'border-purple-100/60 bg-white/70 hover:border-purple-200 text-gray-600'
                                            }`}
                                        >
                                            <span className="font-bold text-xs">{v}</span>
                                            <span className="text-[10px] text-gray-400 font-medium">{s}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* No. of Meals Served in a Day (if food available) */}
                            {formData.foodAvailability !== 'Self Cook' && (
                                <div className="space-y-1.5 pt-1.5 border-t border-purple-100/70">
                                    <span className="text-[11px] font-bold text-gray-500 block">No. of Meals Served in a Day</span>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {['1 Meal', '2 Meals', '3 Meals', '4 Meals'].map(m => (
                                            <button
                                                key={m}
                                                type="button"
                                                onClick={() => handleChange('mealsPerDay', m)}
                                                className={`min-h-[38px] sm:min-h-[40px] py-2 px-2 rounded-xl border-2 transition-all text-xs font-bold text-center leading-snug flex items-center justify-center ${
                                                    formData.mealsPerDay === m
                                                        ? 'border-[#300868] bg-white text-[#300868] shadow-xs'
                                                        : 'border-purple-100/60 bg-white/70 hover:border-purple-200 text-gray-600'
                                                }`}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Food Type */}
                            <div className="space-y-1.5 pt-1.5 border-t border-purple-100/70">
                                <span className="text-[11px] font-bold text-gray-500 block">Food Type</span>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Pure Veg', 'Veg + Non-Veg'].map(ft => (
                                        <button
                                            key={ft}
                                            type="button"
                                            onClick={() => handleChange('foodType', ft)}
                                            className={`min-h-[38px] sm:min-h-[40px] py-2 px-2 rounded-xl border-2 transition-all text-xs font-bold text-center leading-snug flex items-center justify-center ${
                                                formData.foodType === ft
                                                    ? 'border-[#300868] bg-white text-[#300868] shadow-xs'
                                                    : 'border-purple-100/60 bg-white/70 hover:border-purple-200 text-gray-600'
                                            }`}
                                        >
                                            {ft}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 2. Water Section */}
                        <div className="pt-3 border-t border-gray-100 space-y-2">
                            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                                Water
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {['Water Filter', 'Tubewell', 'Both', 'None'].map(opt => (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => handleChange('waterFacility', opt)}
                                        className={`min-h-[38px] sm:min-h-[40px] py-2 px-2 rounded-xl border-2 transition-all text-xs font-bold text-center leading-snug flex items-center justify-center ${
                                            formData.waterFacility === opt
                                                ? 'border-[#300868] bg-purple-50 text-[#300868] shadow-2xs'
                                                : 'border-gray-100 bg-white hover:border-purple-200 text-gray-600'
                                        }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 3. Cleaning Section (Clothes / Laundry) */}
                        <div className="pt-3 border-t border-gray-100 space-y-2">
                            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                                Cleaning Section (Laundry)
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {['Laundry', 'Washing Machine', 'Both', 'None'].map(opt => (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => handleChange('laundryFacility', opt)}
                                        className={`min-h-[38px] sm:min-h-[40px] py-2 px-2 rounded-xl border-2 transition-all text-xs font-bold text-center leading-snug flex items-center justify-center ${
                                            formData.laundryFacility === opt
                                                ? 'border-[#300868] bg-purple-50 text-[#300868] shadow-2xs'
                                                : 'border-gray-100 bg-white hover:border-purple-200 text-gray-600'
                                        }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 4. Cleaning Service (Housekeeping) */}
                        <div className="pt-3 border-t border-gray-100 space-y-2">
                            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                                Cleaning Service
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {['Room Cleaning', 'Washroom Cleaning', 'Both', 'None'].map(opt => (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => handleChange('cleaningService', opt)}
                                        className={`min-h-[38px] sm:min-h-[40px] py-2 px-2 rounded-xl border-2 transition-all text-xs font-bold text-center leading-snug flex items-center justify-center ${
                                            formData.cleaningService === opt
                                                ? 'border-[#300868] bg-purple-50 text-[#300868] shadow-2xs'
                                                : 'border-gray-100 bg-white hover:border-purple-200 text-gray-600'
                                        }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Utilities & Security (Wifi, Power Backup, CCTV, Warden/Watchman) */}
                        <div className="pt-2.5 border-t border-gray-100 space-y-2">
                            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                                Utilities & Security
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {/* Wifi */}
                                <div className="p-2 sm:p-2.5 bg-gray-50/70 rounded-xl border border-gray-100 flex items-center justify-between gap-1.5">
                                    <div className="min-w-0">
                                        <span className="text-xs font-bold text-gray-800 block leading-tight">Wifi</span>
                                        <span className="text-[10px] text-gray-400 block leading-tight mt-0.5">Internet</span>
                                    </div>
                                    <div className="flex bg-white rounded-lg p-0.5 border border-gray-200 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => handleChange('wifi', true)}
                                            className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-xs font-bold transition-all ${
                                                formData.wifi ? 'bg-[#300868] text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'
                                            }`}
                                        >
                                            Yes
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleChange('wifi', false)}
                                            className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-xs font-bold transition-all ${
                                                !formData.wifi ? 'bg-gray-200 text-gray-800' : 'text-gray-500 hover:text-gray-800'
                                            }`}
                                        >
                                            No
                                        </button>
                                    </div>
                                </div>

                                {/* Power Backup */}
                                <div className="p-2 sm:p-2.5 bg-gray-50/70 rounded-xl border border-gray-100 flex items-center justify-between gap-1.5">
                                    <div className="min-w-0">
                                        <span className="text-xs font-bold text-gray-800 block leading-tight">Power Backup</span>
                                        <span className="text-[10px] text-gray-400 block leading-tight mt-0.5">Inverter</span>
                                    </div>
                                    <div className="flex bg-white rounded-lg p-0.5 border border-gray-200 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => handleChange('powerBackup', true)}
                                            className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-xs font-bold transition-all ${
                                                formData.powerBackup ? 'bg-[#300868] text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'
                                            }`}
                                        >
                                            Yes
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleChange('powerBackup', false)}
                                            className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-xs font-bold transition-all ${
                                                !formData.powerBackup ? 'bg-gray-200 text-gray-800' : 'text-gray-500 hover:text-gray-800'
                                            }`}
                                        >
                                            No
                                        </button>
                                    </div>
                                </div>

                                {/* CCTV */}
                                <div className="p-2 sm:p-2.5 bg-gray-50/70 rounded-xl border border-gray-100 flex items-center justify-between gap-1.5">
                                    <div className="min-w-0">
                                        <span className="text-xs font-bold text-gray-800 block leading-tight">CCTV</span>
                                        <span className="text-[10px] text-gray-400 block leading-tight mt-0.5">Security</span>
                                    </div>
                                    <div className="flex bg-white rounded-lg p-0.5 border border-gray-200 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => handleChange('cctv', true)}
                                            className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-xs font-bold transition-all ${
                                                formData.cctv ? 'bg-[#300868] text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'
                                            }`}
                                        >
                                            Yes
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleChange('cctv', false)}
                                            className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-xs font-bold transition-all ${
                                                !formData.cctv ? 'bg-gray-200 text-gray-800' : 'text-gray-500 hover:text-gray-800'
                                            }`}
                                        >
                                            No
                                        </button>
                                    </div>
                                </div>

                                {/* Warden / Watchman */}
                                <div className="p-2 sm:p-2.5 bg-gray-50/70 rounded-xl border border-gray-100 flex items-center justify-between gap-1.5">
                                    <div className="min-w-0">
                                        <span className="text-xs font-bold text-gray-800 block leading-tight">Warden / Watchman</span>
                                        <span className="text-[10px] text-gray-400 block leading-tight mt-0.5">Staff</span>
                                    </div>
                                    <div className="flex bg-white rounded-lg p-0.5 border border-gray-200 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => handleChange('wardenWatchman', true)}
                                            className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-xs font-bold transition-all ${
                                                formData.wardenWatchman ? 'bg-[#300868] text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'
                                            }`}
                                        >
                                            Yes
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleChange('wardenWatchman', false)}
                                            className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-xs font-bold transition-all ${
                                                !formData.wardenWatchman ? 'bg-gray-200 text-gray-800' : 'text-gray-500 hover:text-gray-800'
                                            }`}
                                        >
                                            No
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Extra Space */}
                        <div className="space-y-1.5 pt-2 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                                    Extra Space
                                </label>
                                <span className="text-[11px] text-gray-400 font-medium">(Select all available)</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {['Parking', 'Access to Terrace', 'Dining Hall', 'Library'].map(name => {
                                    const isChecked = (formData.extraSpace || []).includes(name);
                                    return (
                                        <button
                                            key={name}
                                            type="button"
                                            onClick={() => handleCheckboxChange('extraSpace', name)}
                                            className={`min-h-[38px] sm:min-h-[40px] py-2 px-2.5 rounded-xl border-2 transition-all text-xs font-bold flex items-center gap-2 ${
                                                isChecked
                                                    ? 'border-[#300868] bg-purple-50 text-[#300868]'
                                                    : 'border-gray-100 bg-white hover:border-purple-200 text-gray-600'
                                            }`}
                                        >
                                            <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border ${
                                                isChecked ? 'bg-[#300868] border-[#300868] text-white' : 'border-gray-300 bg-white'
                                            }`}>
                                                {isChecked && <Check size={11} className="stroke-[3]" />}
                                            </div>
                                            <span className="truncate">{name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-3.5 sm:space-y-4 flex-1 overflow-y-auto no-scrollbar px-0.5 sm:px-1 pb-2 sm:pb-4">
                        {/* Title Header */}
                        <div className="text-center space-y-1 sm:space-y-1.5 mb-3 sm:mb-4">
                            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-2.5">
                                <ShieldCheck size={22} className="text-[#300868] sm:hidden" />
                                <ShieldCheck size={24} className="text-[#300868] hidden sm:block" />
                            </div>
                            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">Charges & Extra Details</h2>
                            <p className="text-[11px] sm:text-xs text-gray-500 font-medium">Configure rent, charges, notice period & operating history</p>
                        </div>

                        {/* 1. Charges Section */}
                        <div className="bg-purple-50/40 p-3.5 sm:p-4 rounded-2xl border border-purple-100 space-y-3">
                            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Charges</h3>

                            {/* Rent Billing Cycle */}
                            <div className="space-y-1.5">
                                <span className="text-[11px] font-bold text-gray-500 block">Rent Billing Cycle</span>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: 'monthly', label: 'Monthly Basis' },
                                        { id: 'yearly', label: 'Yearly Basis' }
                                    ].map(rc => (
                                        <button
                                            key={rc.id}
                                            type="button"
                                            onClick={() => handleChange('rentCycle', rc.id)}
                                            className={`min-h-[38px] sm:min-h-[40px] py-2 px-2 rounded-xl border-2 transition-all text-xs font-bold text-center leading-snug flex items-center justify-center ${
                                                formData.rentCycle === rc.id
                                                    ? 'border-[#300868] bg-white text-[#300868] shadow-xs'
                                                    : 'border-purple-100/60 bg-white/70 hover:border-purple-200 text-gray-600'
                                            }`}
                                        >
                                            {rc.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Security Deposit */}
                            <div className="space-y-1.5 pt-1.5 border-t border-purple-100/70">
                                <span className="text-[11px] font-bold text-gray-500 block">Security Deposit</span>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {['No Deposit', '1 Month', '2 Months', 'Custom'].map(sec => (
                                        <button
                                            key={sec}
                                            type="button"
                                            onClick={() => handleChange('securityDeposit', sec)}
                                            className={`min-h-[38px] sm:min-h-[40px] py-2 px-1.5 sm:px-2 rounded-xl border-2 transition-all text-xs font-bold text-center leading-snug flex items-center justify-center ${
                                                formData.securityDeposit === sec
                                                    ? 'border-[#300868] bg-white text-[#300868] shadow-xs'
                                                    : 'border-purple-100/60 bg-white/70 hover:border-purple-200 text-gray-600'
                                            }`}
                                        >
                                            {sec}
                                        </button>
                                    ))}
                                </div>
                                {formData.securityDeposit === 'Custom' && (
                                    <input
                                        type="number"
                                        inputMode="numeric"
                                        value={formData.securityDepositCustom || ''}
                                        onChange={(e) => handleChange('securityDepositCustom', e.target.value)}
                                        placeholder="Enter security deposit amount (₹)"
                                        className="w-full text-xs sm:text-sm p-2.5 border-2 border-purple-100 bg-white rounded-xl focus:border-[#300868] outline-none transition-all mt-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                )}
                            </div>

                            {/* Advance Payment */}
                            <div className="space-y-1.5 pt-1.5 border-t border-purple-100/70">
                                <span className="text-[11px] font-bold text-gray-500 block">Advance Payment</span>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {['No Advance', '1 Month', '2 Months', 'Custom'].map(adv => (
                                        <button
                                            key={adv}
                                            type="button"
                                            onClick={() => handleChange('advancePayment', adv)}
                                            className={`min-h-[38px] sm:min-h-[40px] py-2 px-1.5 sm:px-2 rounded-xl border-2 transition-all text-xs font-bold text-center leading-snug flex items-center justify-center ${
                                                formData.advancePayment === adv
                                                    ? 'border-[#300868] bg-white text-[#300868] shadow-xs'
                                                    : 'border-purple-100/60 bg-white/70 hover:border-purple-200 text-gray-600'
                                            }`}
                                        >
                                            {adv}
                                        </button>
                                    ))}
                                </div>
                                {formData.advancePayment === 'Custom' && (
                                    <input
                                        type="number"
                                        inputMode="numeric"
                                        value={formData.advancePaymentCustom || ''}
                                        onChange={(e) => handleChange('advancePaymentCustom', e.target.value)}
                                        placeholder="Enter advance payment amount (₹)"
                                        className="w-full text-xs sm:text-sm p-2.5 border-2 border-purple-100 bg-white rounded-xl focus:border-[#300868] outline-none transition-all mt-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                )}
                            </div>

                            {/* Electricity Bill */}
                            <div className="space-y-1.5 pt-1.5 border-t border-purple-100/70">
                                <span className="text-[11px] font-bold text-gray-500 block">Electricity Bill</span>
                                <div className="grid grid-cols-3 gap-2">
                                    {['Included in Rent', 'As per Meter', 'Extra Fixed'].map(eb => (
                                        <button
                                            key={eb}
                                            type="button"
                                            onClick={() => handleChange('electricityBill', eb)}
                                            className={`min-h-[38px] sm:min-h-[40px] py-2 px-1.5 rounded-xl border-2 transition-all text-xs font-bold text-center leading-snug flex items-center justify-center ${
                                                formData.electricityBill === eb
                                                    ? 'border-[#300868] bg-white text-[#300868] shadow-xs'
                                                    : 'border-purple-100/60 bg-white/70 hover:border-purple-200 text-gray-600'
                                            }`}
                                        >
                                            {eb}
                                        </button>
                                    ))}
                                </div>
                                {formData.electricityBill === 'Extra Fixed' && (
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={formData.electricityBillAmount || ''}
                                        onChange={(e) => handleChange('electricityBillAmount', e.target.value.replace(/[^0-9]/g, ''))}
                                        onWheel={(e) => e.target.blur()}
                                        placeholder="Enter monthly electricity bill (₹)"
                                        className="w-full text-xs sm:text-sm p-2.5 border-2 border-purple-100 bg-white rounded-xl focus:border-[#300868] outline-none transition-all mt-1"
                                    />
                                )}
                            </div>

                            {/* Maintenance Fee */}
                            <div className="space-y-1.5 pt-1.5 border-t border-purple-100/70">
                                <span className="text-[11px] font-bold text-gray-500 block">Maintenance Fee</span>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Included', 'Extra Charge'].map(mf => (
                                        <button
                                            key={mf}
                                            type="button"
                                            onClick={() => handleChange('maintenanceFee', mf)}
                                            className={`min-h-[38px] sm:min-h-[40px] py-2 px-2 rounded-xl border-2 transition-all text-xs font-bold text-center leading-snug flex items-center justify-center ${
                                                formData.maintenanceFee === mf
                                                    ? 'border-[#300868] bg-white text-[#300868] shadow-xs'
                                                    : 'border-purple-100/60 bg-white/70 hover:border-purple-200 text-gray-600'
                                            }`}
                                        >
                                            {mf}
                                        </button>
                                    ))}
                                </div>
                                {formData.maintenanceFee === 'Extra Charge' && (
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={formData.maintenanceFeeAmount || ''}
                                        onChange={(e) => handleChange('maintenanceFeeAmount', e.target.value.replace(/[^0-9]/g, ''))}
                                        onWheel={(e) => e.target.blur()}
                                        placeholder="Enter monthly maintenance fee (₹)"
                                        className="w-full text-xs sm:text-sm p-2.5 border-2 border-purple-100 bg-white rounded-xl focus:border-[#300868] outline-none transition-all mt-1"
                                    />
                                )}
                            </div>

                            {/* Cleaning */}
                            <div className="space-y-1.5 pt-1.5 border-t border-purple-100/70">
                                <span className="text-[11px] font-bold text-gray-500 block">Cleaning Charges</span>
                                <div className="grid grid-cols-3 gap-2">
                                    {['Included in Rent', 'Extra Charge', 'None'].map(cc => (
                                        <button
                                            key={cc}
                                            type="button"
                                            onClick={() => handleChange('cleaningCharges', cc)}
                                            className={`min-h-[38px] sm:min-h-[40px] py-2 px-1.5 rounded-xl border-2 transition-all text-xs font-bold text-center leading-snug flex items-center justify-center ${
                                                formData.cleaningCharges === cc
                                                    ? 'border-[#300868] bg-white text-[#300868] shadow-xs'
                                                    : 'border-purple-100/60 bg-white/70 hover:border-purple-200 text-gray-600'
                                            }`}
                                        >
                                            {cc}
                                        </button>
                                    ))}
                                </div>
                                {formData.cleaningCharges === 'Extra Charge' && (
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={formData.cleaningChargesAmount || ''}
                                        onChange={(e) => handleChange('cleaningChargesAmount', e.target.value.replace(/[^0-9]/g, ''))}
                                        onWheel={(e) => e.target.blur()}
                                        placeholder="Enter monthly cleaning fee (₹)"
                                        className="w-full text-xs sm:text-sm p-2.5 border-2 border-purple-100 bg-white rounded-xl focus:border-[#300868] outline-none transition-all mt-1"
                                    />
                                )}
                            </div>

                            {/* Food Bill */}
                            <div className="space-y-1.5 pt-1.5 border-t border-purple-100/70">
                                <span className="text-[11px] font-bold text-gray-500 block">Food Bill</span>
                                <div className="grid grid-cols-3 gap-2">
                                    {['Included in Rent', 'Separate', 'Self Cook'].map(fb => (
                                        <button
                                            key={fb}
                                            type="button"
                                            onClick={() => handleChange('foodBill', fb)}
                                            className={`min-h-[38px] sm:min-h-[40px] py-2 px-1.5 rounded-xl border-2 transition-all text-xs font-bold text-center leading-snug flex items-center justify-center ${
                                                formData.foodBill === fb
                                                    ? 'border-[#300868] bg-white text-[#300868] shadow-xs'
                                                    : 'border-purple-100/60 bg-white/70 hover:border-purple-200 text-gray-600'
                                            }`}
                                        >
                                            {fb}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Utensils Charges */}
                            <div className="space-y-1.5 pt-1.5 border-t border-purple-100/70">
                                <span className="text-[11px] font-bold text-gray-500 block">Utensils Charges</span>
                                <div className="grid grid-cols-3 gap-2">
                                    {['Provided', 'Chargeable', 'Bring Own'].map(uc => (
                                        <button
                                            key={uc}
                                            type="button"
                                            onClick={() => handleChange('utensilsCharges', uc)}
                                            className={`min-h-[38px] sm:min-h-[40px] py-2 px-1.5 rounded-xl border-2 transition-all text-xs font-bold text-center leading-snug flex items-center justify-center ${
                                                formData.utensilsCharges === uc
                                                    ? 'border-[#300868] bg-white text-[#300868] shadow-xs'
                                                    : 'border-purple-100/60 bg-white/70 hover:border-purple-200 text-gray-600'
                                            }`}
                                        >
                                            {uc}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 2. Notice Period */}
                        <div className="pt-3 border-t border-gray-100 space-y-2">
                            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                                Notice Period
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {['No Notice', '15 Days', '1 Month', '2 Months', '3 Months', 'Other'].map(np => (
                                    <button
                                        key={np}
                                        type="button"
                                        onClick={() => handleChange('noticePeriod', np)}
                                        className={`min-h-[38px] sm:min-h-[40px] py-2 px-1.5 rounded-xl border-2 transition-all text-xs font-bold text-center leading-snug flex items-center justify-center ${
                                            formData.noticePeriod === np
                                                ? 'border-[#300868] bg-purple-50 text-[#300868] shadow-2xs'
                                                : 'border-gray-100 bg-white hover:border-purple-200 text-gray-600'
                                        }`}
                                    >
                                        {np}
                                    </button>
                                ))}
                            </div>
                            {formData.noticePeriod === 'Other' && (
                                <input
                                    type="text"
                                    value={formData.noticePeriodCustom || ''}
                                    onChange={(e) => handleChange('noticePeriodCustom', e.target.value)}
                                    placeholder="Enter notice period (e.g. 45 Days)"
                                    className="w-full text-xs sm:text-sm p-2.5 border-2 border-purple-100 bg-white rounded-xl focus:border-[#300868] outline-none transition-all mt-1 font-medium"
                                />
                            )}
                        </div>

                        {/* 3. Operating Since */}
                        <div className="pt-3 border-t border-gray-100 space-y-2">
                            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                                Operating Since (Year)
                            </label>
                            <select
                                value={formData.operatingSince || ''}
                                onChange={(e) => handleChange('operatingSince', e.target.value)}
                                className="w-full text-xs sm:text-sm min-h-[38px] sm:min-h-[40px] p-2.5 sm:p-3 border-2 border-purple-100 bg-white rounded-xl focus:border-[#300868] outline-none transition-all cursor-pointer font-medium text-gray-800"
                            >
                                <option value="">Select starting year</option>
                                {Array.from({ length: 27 }, (_, i) => 2026 - i).map(year => (
                                    <option key={year} value={String(year)}>
                                        {year}
                                    </option>
                                ))}
                                <option value="Before 2000">Before 2000</option>
                            </select>
                        </div>

                        {/* Terms & Consent */}
                        <div className="flex items-start gap-2.5 bg-purple-50/50 p-3 rounded-xl border border-purple-100 mt-2">
                            <input
                                type="checkbox"
                                id="consent"
                                checked={formData.consent}
                                onChange={(e) => handleChange('consent', e.target.checked)}
                                className="w-4 h-4 accent-[#300868] mt-0.5 cursor-pointer"
                            />
                            <label htmlFor="consent" className="text-xs text-gray-600 cursor-pointer text-left leading-relaxed">
                                I agree to the <a href="/terms-and-conditions" target="_blank" rel="noopener noreferrer" className="text-[#300868] font-bold hover:underline">Terms & Conditions</a> and <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-[#300868] font-bold hover:underline">Privacy Policy</a>.
                            </label>
                        </div>
                    </div>
                );
            case 5:
                return (
                    <div className="text-center py-8 px-4 space-y-4 flex-1 flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-bounce">
                            <Check size={40} className="text-green-600" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-2xl font-black text-gray-900">Submission Received!</h2>
                            <p className="text-xs text-gray-600 max-w-xs mx-auto">
                                Thank you for registering your mess. Our team will verify the details and contact you at <span className="font-bold text-gray-900">{formData.phoneNumber}</span> shortly.
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/')}
                            className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-xs transition-colors"
                        >
                            Back to Home
                        </button>
                    </div>
                );
            default:
                return null;
        }
    };

    const isStepValid = () => {
        switch (step) {
            case 1:
                return (
                    formData.messName.trim().length > 0 &&
                    formData.messType.length > 0 &&
                    formData.district !== '' &&
                    formData.city !== '' &&
                    formData.locality.trim().length > 0 &&
                    formData.address.trim().length > 0 &&
                    formData.phoneNumber.length === 10
                );
            case 2: {
                const beds = formData.totalBeds || formData.totalRooms;
                return (
                    beds !== '' &&
                    Number(beds) > 0 &&
                    formData.roomTypes.length > 0 &&
                    formData.roomTypes.every(room => {
                        const variants = formData.roomVariants[room] || [];
                        return variants.length > 0 && variants.every(v => 
                            Boolean(v.label && v.label.trim().length > 0) &&
                            v.price && 
                            String(v.price).trim().length > 0 && 
                            Number(v.price) > 0
                        );
                    })
                );
            }
            case 3:
                return (
                    Boolean(formData.foodAvailability) &&
                    Boolean(formData.managedBy) &&
                    Boolean(formData.foodType) &&
                    Boolean(formData.waterFacility) &&
                    Boolean(formData.laundryFacility) &&
                    Boolean(formData.cleaningService)
                );
            case 4:
                if (!formData.operatingSince || formData.operatingSince.trim().length === 0) return false;
                if (formData.noticePeriod === 'Other' && (!formData.noticePeriodCustom || formData.noticePeriodCustom.trim().length === 0)) return false;
                if (formData.securityDeposit === 'Custom' && (!formData.securityDepositCustom || formData.securityDepositCustom.trim().length === 0)) return false;
                if (formData.advancePayment === 'Custom' && (!formData.advancePaymentCustom || formData.advancePaymentCustom.trim().length === 0)) return false;
                if (formData.maintenanceFee === 'Extra Charge' && (!formData.maintenanceFeeAmount || formData.maintenanceFeeAmount.trim().length === 0)) return false;
                if (formData.electricityBill === 'Extra Fixed' && (!formData.electricityBillAmount || formData.electricityBillAmount.trim().length === 0)) return false;
                if (formData.cleaningCharges === 'Extra Charge' && (!formData.cleaningChargesAmount || formData.cleaningChargesAmount.trim().length === 0)) return false;
                return Boolean(formData.consent);
            default:
                return true;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-2 sm:p-4 py-2 sm:py-6">
            <div className="w-full max-w-lg h-[92vh] sm:h-[680px] sm:max-h-[92vh] bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden flex flex-col relative my-auto">

                {/* Progress Bar */}
                {step <= totalSteps && (
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-100">
                        <div
                            className="h-full bg-brand-primary transition-all duration-300 ease-out"
                            style={{ width: `${(step / totalSteps) * 100}%` }}
                        />
                    </div>
                )}

                {/* Back to Home Button */}
                {step <= totalSteps && (
                    <button
                        onClick={() => {
                            if (window.confirm("Are you sure you want to exit registration? Any unsaved progress will be lost.")) {
                                navigate('/');
                            }
                        }}
                        className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-10 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-gray-100/60 hover:bg-gray-100 text-gray-500 hover:text-gray-800 rounded-full transition-all"
                        title="Cancel Registration and Return to Home"
                    >
                        <X size={16} className="sm:hidden" />
                        <X size={18} className="hidden sm:block" />
                    </button>
                )}

                {/* Content Area */}
                <div className="flex-1 px-3.5 py-3 sm:px-8 sm:py-6 flex flex-col min-h-0 overflow-hidden">
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={step}
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="w-full h-full flex flex-col min-h-0"
                        >
                            {renderStep()}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Navigation Buttons */}
                {step <= totalSteps && (
                    <div className="px-4 py-2.5 sm:px-8 sm:py-3.5 border-t border-gray-100 flex justify-between items-center bg-gray-50/50 mt-auto">
                        <button
                            onClick={handleBack}
                            disabled={step === 1}
                            className="py-2 px-3 sm:py-2.5 sm:px-4 text-gray-500 hover:bg-gray-100 rounded-xl disabled:opacity-0 transition-all font-medium flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
                        >
                            <ChevronLeft size={18} className="sm:hidden" />
                            <ChevronLeft size={20} className="hidden sm:block" /> Back
                        </button>

                        {step < totalSteps ? (
                            <button
                                onClick={handleNext}
                                disabled={!isStepValid()}
                                className="px-5 py-2 sm:px-6 sm:py-2.5 bg-brand-primary text-white rounded-xl font-bold flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-primary-hover transition-all shadow-md shadow-brand-primary/20"
                            >
                                Next <ChevronRight size={18} className="sm:hidden" /><ChevronRight size={20} className="hidden sm:block" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={!isStepValid() || loading}
                                className="px-5 py-2 sm:px-6 sm:py-2.5 bg-green-600 text-white rounded-xl font-bold flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition-all shadow-md shadow-green-600/20"
                            >
                                {loading ? (uploadProgressText || 'Submitting...') : 'Submit Form'} <Send size={18} className="sm:hidden" /><Send size={20} className="hidden sm:block" />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessRegistration;
