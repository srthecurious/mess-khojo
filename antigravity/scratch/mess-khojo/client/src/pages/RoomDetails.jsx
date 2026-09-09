import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, startAt, endAt } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../hooks/useWishlist';
import { MapPin, Wifi, Zap, CheckCircle, ArrowLeft, BedDouble, Wind, Droplets, Utensils, Star, Shield, Lock, Bell, Heart, Phone, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PhoneCollectionModal from '../components/PhoneCollectionModal';
import { trackRoomView, trackBookingInitiated, trackContactOwner } from '../analytics';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { usePageSEO } from '../hooks/usePageSEO';
import { toMessSlug, toRoomSlug, isSlug, idSuffixFromSlug } from '../utils/slugify';

const getCleanOccupancy = (val) => {
    if (!val) return '';
    const s = String(val).toLowerCase().trim();
    if (s === '1' || s === 'single' || s === '1 seater' || s.includes('single')) return '1';
    if (s === '2' || s === 'double' || s === '2 seater' || s.includes('double')) return '2';
    if (s === '3' || s === 'triple' || s === '3 seater' || s.includes('triple')) return '3';
    if (s === '4' || s === 'four' || s === '4 seater' || s.includes('four')) return '4';
    if (s === '5' || s === 'five' || s === '5 seater' || s.includes('five')) return '5';
    if (s === '6' || s === 'six' || s === '6 seater' || s.includes('six')) return '6';
    if (s === '8' || s === 'eight' || s === '8 seater' || s.includes('eight')) return '8';
    
    return val.toString().replace(/\s*(?:seater|sharing|room|beds?|seats?)\b/gi, '').trim();
};

const RoomDetails = () => {
    // Support both new slug-based URLs (/room/mess-slug/room-slug)
    // and legacy raw Firestore ID URLs (/room/messId/roomId)
    const { messSlug, roomSlug } = useParams();
    const [resolvedMessId, setResolvedMessId] = useState(() =>
        (messSlug && !isSlug(messSlug)) ? messSlug : null
    );
    const [resolvedRoomId, setResolvedRoomId] = useState(() =>
        (roomSlug && !isSlug(roomSlug)) ? roomSlug : null
    );
    const messId = resolvedMessId;
    const roomId = resolvedRoomId;
    const navigate = useNavigate();
    const { currentUser, userRole } = useAuth();

    const [mess, setMess] = useState(null);
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [userPhone, setUserPhone] = useState('');
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [bookingProcessing, setBookingProcessing] = useState(false);
    const { isRoomWishlisted, toggleRoomWishlist } = useWishlist();

    // Generate Room Structured Schema
    const getRoomSchema = () => {
        if (!mess || !room) return null;
        const occupancyVal = {
            'Single': 1, 'Double': 2, 'Triple': 3,
            'Four': 4, 'Five': 5, 'Six': 6
        }[room.occupancy] || 1;

        const schema = {
            "@context": "https://schema.org",
            "@type": "LodgingBusiness",
            "name": mess.name,
            "description": `${room.occupancy} Seater ${room.category || 'Standard'} room in ${mess.name}, ${mess.address || ''}.`,
            "url": `https://messkhojo.com/room/${toMessSlug(mess.name, mess.id)}/${toRoomSlug(room.occupancy, room.id)}`,
            "image": room.imageUrls?.[0] || room.imageUrl || mess.posterUrl || mess.images?.[0] || "https://messkhojo.com/preview.png",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": mess.address || "",
                "addressLocality": mess.district ? mess.district.charAt(0).toUpperCase() + mess.district.slice(1) : 'Balasore',
                "addressRegion": "Odisha",
                "addressCountry": "IN"
            },
            "priceRange": `₹${room.price}`,
            "numberOfRooms": room.availableCount || 0,
            "containsPlace": {
                "@type": "Accommodation",
                "name": `${room.occupancy} Seater Room`,
                "description": room.otherInfo || `${room.occupancy} Seater room.`,
                "numberOfRooms": 1,
                "occupancy": {
                    "@type": "QuantitativeValue",
                    "value": occupancyVal
                },
                "offers": {
                    "@type": "Offer",
                    "priceCurrency": "INR",
                    "price": room.price,
                    "priceSpecification": {
                        "@type": "UnitPriceSpecification",
                        "price": room.price,
                        "priceCurrency": "INR",
                        "unitText": "MONTH"
                    },
                    "availability": room.availableCount > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                    "validFrom": new Date().toISOString().split('T')[0]
                }
            }
        };

        if (mess.contact && !mess.hideContact) {
            schema.telephone = mess.contact;
        }

        return schema;
    };

    const occupancyName = room ? getCleanOccupancy(room.occupancy) : '';

    const pageTitle = room && mess 
        ? `${occupancyName} Seater Room at ${mess.name} | MessKhojo`
        : 'Room Details | MessKhojo';

    const pageDescription = room && mess
        ? `${occupancyName} Seater ${room.category || 'Standard'} room in ${mess.name}, ${mess.address || ''}, ${mess.district ? mess.district.charAt(0).toUpperCase() + mess.district.slice(1) : 'Balasore'}. Rent: ₹${room.price}${room.rentCycle === 'yearly' ? '/year' : '/month'}, available beds: ${room.availableCount || 0}. No Broker, direct contact.`
        : 'View room details, rent, occupancy and availability on MessKhojo.';

    const pageKeywords = room && mess
        ? `${room.occupancy} seater room, ${mess.name}, room rent ${mess.district || 'Balasore'}, PG room rent, hostel room`
        : 'room details, rent, mess room';

    usePageSEO({
        title: pageTitle,
        description: pageDescription,
        keywords: pageKeywords,
        canonicalUrl: room && mess ? `https://messkhojo.com/room/${toMessSlug(mess.name, mess.id)}/${toRoomSlug(room.occupancy, room.id)}` : undefined,
        structuredData: room && mess ? getRoomSchema() : null
    });

    // Resolve mess slug → Firestore ID
    useEffect(() => {
        if (!messSlug) return;
        if (!isSlug(messSlug)) { setResolvedMessId(messSlug); return; }
        const suffix = idSuffixFromSlug(messSlug);
        if (!suffix) return;
        getDocs(query(collection(db, 'messes'), orderBy('__name__'), startAt(suffix), endAt(suffix + '\uf8ff')))
            .then(snap => {
                if (!snap.empty) {
                    const matchedDoc = snap.docs.find(doc => toMessSlug(doc.data().name, doc.id) === messSlug);
                    setResolvedMessId(matchedDoc ? matchedDoc.id : snap.docs[0].id);
                } else {
                    setResolvedMessId(messSlug);
                }
            })
            .catch(() => setResolvedMessId(messSlug));
    }, [messSlug]);

    // Resolve room slug → Firestore ID
    useEffect(() => {
        if (!roomSlug) return;
        if (!isSlug(roomSlug)) { setResolvedRoomId(roomSlug); return; }
        const suffix = idSuffixFromSlug(roomSlug);
        if (!suffix) return;
        getDocs(query(collection(db, 'rooms'), orderBy('__name__'), startAt(suffix), endAt(suffix + '\uf8ff')))
            .then(snap => {
                if (!snap.empty) {
                    const matchedDoc = snap.docs.find(doc => toRoomSlug(doc.data().occupancy, doc.id) === roomSlug);
                    setResolvedRoomId(matchedDoc ? matchedDoc.id : snap.docs[0].id);
                } else {
                    setResolvedRoomId(roomSlug);
                }
            })
            .catch(() => setResolvedRoomId(roomSlug));
    }, [roomSlug]);

    useEffect(() => {
        if (!resolvedMessId || !resolvedRoomId) return;
        const fetchDetails = async () => {
            try {
                // Fetch Mess
                const messDoc = await getDoc(doc(db, "messes", resolvedMessId));
                if (messDoc.exists()) {
                    setMess({ id: messDoc.id, ...messDoc.data() });
                }

                // Fetch Room
                const roomDoc = await getDoc(doc(db, "rooms", resolvedRoomId));
                if (roomDoc.exists()) {
                    setRoom({ id: roomDoc.id, ...roomDoc.data() });
                }
            } catch (error) {
                console.error("Error details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [resolvedMessId, resolvedRoomId]);

    // Ensure URL in address bar displays canonical mess and room slugs format
    useEffect(() => {
        if (mess && mess.name && mess.id && room && room.occupancy && room.id) {
            const canonicalMessSlug = toMessSlug(mess.name, mess.id);
            const canonicalRoomSlug = toRoomSlug(room.occupancy, room.id);
            if (messSlug !== canonicalMessSlug || roomSlug !== canonicalRoomSlug) {
                navigate(`/room/${canonicalMessSlug}/${canonicalRoomSlug}${window.location.search}${window.location.hash}`, { replace: true });
            }
        }
    }, [mess, room, messSlug, roomSlug, navigate]);

    // Track room view when component mounts
    useEffect(() => {
        if (mess && room) {
            trackRoomView(roomId, messId, room.price);
        }
    }, [mess, room, messId, roomId]);

    useBodyScrollLock(showConfirmModal || showPhoneModal);

    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        if (!loading && currentUser) {
            if (searchParams.get('action') === 'book') {
                handleBookClick();
                const newParams = new URLSearchParams(searchParams);
                newParams.delete('action');
                setSearchParams(newParams, { replace: true });
            } else if (searchParams.get('action') === 'notify') {
                // Seat availability feature deactivated
                const newParams = new URLSearchParams(searchParams);
                newParams.delete('action');
                setSearchParams(newParams, { replace: true });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser, loading]);

    const handleBookClick = async () => {
        if (!currentUser) {
            // Redirect to Login with return URL ensuring action=book is preserved
            const returnUrl = `/room/${messSlug}/${roomSlug}?action=book`;
            console.log('🔗 Redirecting to login with return URL:', returnUrl);
            navigate(`/user-login?redirect=${encodeURIComponent(returnUrl)}`);
            return;
        }

        // Check if owner contact is available
        if (!mess.contact || mess.hideContact) {
            alert("Owner's contact is currently unavailable for this mess. Please try again later.");
            return;
        }
        if (userRole !== 'user') {
            alert("Partners cannot book rooms. Please login as a User.");
            return;
        }

        // --- ENFORCE DAILY LIMIT ---
        try {
            const bookingsRef = collection(db, "bookings");
            const q = query(
                bookingsRef,
                where("userId", "==", currentUser.uid)
            );

            const querySnapshot = await getDocs(q);
            let todayCount = 0;
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.createdAt && data.createdAt.toDate) {
                    const createdAtDate = data.createdAt.toDate();
                    if (createdAtDate >= today) {
                        todayCount++;
                    }
                }
            });

            if (todayCount >= 5) {
                alert("You have reached the maximum limit of 5 call requests per day. Please try again tomorrow.");
                return;
            }
        } catch (error) {
            console.error("Error checking booking limit:", error);
            // Non-blocking fallback if query fails
        }
        // ---------------------------

        // Check if user has a phone number
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        const phone = userData.phone || '';

        // Track booking initiation (Contact Owner button clicked)
        trackBookingInitiated(roomId, messId, room.price);
        trackContactOwner('button_clicked', messId, roomId);

        if (!phone || phone === 'N/A') {
            // No phone - show phone collection modal
            setShowPhoneModal(true);
        } else {
            // Has phone - proceed to booking confirmation
            setUserPhone(phone);
            setShowConfirmModal(true);
        }
    };

    const handleConfirmBooking = async () => {
        setBookingProcessing(true);
        try {
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            const userData = userDoc.exists() ? userDoc.data() : {};

            const bookingData = {
                userId: currentUser.uid,
                userName: userData.name || currentUser.displayName || "User",
                userPhone: userPhone || userData.phone || "N/A",
                messId: mess.id,
                messName: mess.name,
                roomId: room.id,
                roomType: room.occupancy || "Standard",
                price: room.price,
                ownerPhone: mess.contact,
                status: 'contacted',
                createdAt: serverTimestamp()
            };

            await addDoc(collection(db, "bookings"), bookingData);

            setShowConfirmModal(false);

            // Open the phone dialer with the owner's contact number
            trackContactOwner('call_confirmed', messId, roomId);
            window.location.href = `tel:${mess.contact}`;
        } catch (error) {
            console.error("Contact owner failed:", error);
            alert("Something went wrong. Please try again.");
        } finally {
            setBookingProcessing(false);
        }
    };


    const handleRoomWishlistClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!currentUser) {
            setShowLoginPrompt(true);
            return;
        }
        toggleRoomWishlist(roomId);
    };

    if (loading) return <RoomDetailsSkeleton />;
    if (!mess || !room) return <div className="p-10 text-center">Details not found.</div>;

    return (
        <div className="min-h-screen bg-brand-secondary pb-20">
            {/* Login Prompt Modal - slides down from top */}
            {showLoginPrompt && (
                <div className="fixed inset-0 z-[200] flex flex-col items-center pointer-events-none">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
                        onClick={() => setShowLoginPrompt(false)}
                    />
                    <div className="relative pointer-events-auto w-full max-w-sm mt-20 mx-4 bg-white rounded-3xl shadow-2xl p-6">
                        <div className="flex flex-col items-center text-center gap-3">
                            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-2xl">❤️</div>
                            <h3 className="text-lg font-bold text-brand-text-dark">Save to Wishlist</h3>
                            <p className="text-sm text-brand-text-gray">Login to save messes and rooms to your personal wishlist.</p>
                            <button
                                onClick={() => { setShowLoginPrompt(false); navigate('/user-login'); }}
                                className="w-full py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary-hover transition-colors shadow-lg shadow-brand-primary/20"
                            >
                                Login / Sign Up
                            </button>
                            <button
                                onClick={() => setShowLoginPrompt(false)}
                                className="text-sm text-brand-text-gray hover:text-brand-text-dark transition-colors"
                            >
                                Maybe later
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header / Nav */}
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-brand-light-gray px-4 py-3 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={20} className="text-brand-text-dark" />
                </button>
                <h1 className="text-lg font-bold text-brand-text-dark truncate">Room Details</h1>
            </div>

            <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">

                {/* Image Gallery */}
                <div className="bg-white rounded-2xl p-2 shadow-sm border border-brand-light-gray overflow-hidden">
                    {room.imageUrls && room.imageUrls.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                            <img
                                src={room.imageUrls[0]}
                                alt={`${occupancyName} Seater ${room.category || 'Standard'} Room at ${mess ? mess.name : ''}, ${mess ? (mess.address || '') : ''}`}
                                className="w-full h-64 object-cover rounded-xl col-span-2 cursor-pointer hover:opacity-95 transition-opacity"
                                onClick={() => window.open(room.imageUrls[0], '_blank')}
                            />
                            {room.imageUrls.slice(1, 3).map((url, idx) => (
                                <img
                                    key={idx}
                                    src={url}
                                    alt={`${occupancyName} Seater Room at ${mess ? mess.name : ''} — Photo ${idx + 2}`}
                                    className="w-full h-32 object-cover rounded-xl cursor-pointer hover:opacity-95 transition-opacity"
                                    onClick={() => window.open(url, '_blank')}
                                />
                            ))}
                        </div>
                    ) : (
                        <img
                            src={room.imageUrl || "/default-room.jpg"}
                            alt={`${occupancyName} Seater Room at ${mess ? mess.name : ''}`}
                            className="w-full h-64 object-cover rounded-xl cursor-pointer hover:opacity-95 transition-opacity"
                            onClick={() => window.open(room.imageUrl || "/default-room.jpg", '_blank')}
                        />
                    )}
                </div>

                {/* Title & Price */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-light-gray flex flex-col md:flex-row justify-between md:items-start gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-2xl font-bold text-brand-text-dark">{occupancyName} Seater</h2>
                            <span className="bg-brand-accent-green/10 text-brand-accent-green text-xs font-bold px-2 py-0.5 rounded-full border border-brand-accent-green/20">
                                {room.category || 'Standard'}
                            </span>
                            <button
                                onClick={handleRoomWishlistClick}
                                className={`p-1.5 ml-1 rounded-full transition-all flex border shadow-sm shrink-0 items-center justify-center ${isRoomWishlisted(roomId) ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
                                title={isRoomWishlisted(roomId) ? "Remove from wishlist" : "Add to wishlist"}
                            >
                                <Heart size={20} className={`transition-all ${isRoomWishlisted(roomId) ? 'fill-red-500 text-red-500 scale-110' : 'text-gray-400 fill-transparent'}`} />
                            </button>
                        </div>
                        <div className="flex items-center gap-2 text-brand-text-gray">
                            <MapPin size={16} className="text-brand-primary" />
                            <Link to={`/mess/${toMessSlug(mess.name, mess.id)}`} className="font-medium text-brand-primary hover:underline">
                                {mess.name}
                            </Link>
                        </div>
                    </div>
                    <div className="text-left md:text-right">
                        <div className="text-3xl font-black text-brand-text-dark">₹{room.price}<span className="text-sm font-medium text-gray-400">/mo</span></div>
                        <p className="text-xs text-green-600 font-bold bg-green-50 inline-block px-2 py-1 rounded mt-1">
                            {room.availableCount > 0 ? `${room.availableCount} Beds Available` : 'Sold Out'}
                        </p>
                    </div>
                </div>

                {/* Amenities */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-light-gray">
                    <h3 className="text-lg font-bold text-brand-text-dark mb-4">Amenities</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {room.amenities?.ac && (
                            <div className="flex flex-col items-center justify-center p-4 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                                <Wind size={24} className="mb-2" />
                                <span className="text-sm font-bold">AC</span>
                            </div>
                        )}
                        {room.amenities?.attachedBathroom && (
                            <div className="flex flex-col items-center justify-center p-4 bg-cyan-50 text-cyan-600 rounded-xl border border-cyan-100">
                                <Droplets size={24} className="mb-2" />
                                <span className="text-sm font-bold">Bathroom</span>
                            </div>
                        )}
                        {mess.amenities?.wifi && (
                            <div className="flex flex-col items-center justify-center p-4 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                                <Wifi size={24} className="mb-2" />
                                <span className="text-sm font-bold">Wi-Fi</span>
                            </div>
                        )}
                        {mess.amenities?.food && (
                            <div className="flex flex-col items-center justify-center p-4 bg-orange-50 text-orange-600 rounded-xl border border-orange-100">
                                <Utensils size={24} className="mb-2" />
                                <span className="text-sm font-bold">Food</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Description */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-light-gray">
                    <h3 className="text-lg font-bold text-brand-text-dark mb-2">Description</h3>
                    <p className="text-gray-600 leading-relaxed">
                        {room.otherInfo || "No additional description provided for this room."}
                    </p>

                    {(() => {
                        // Policies & Billing Items
                        const propType = Array.isArray(mess.messType)
                            ? (mess.messType.length > 0 ? mess.messType.join(' & ') : null)
                            : (mess.messType && mess.messType !== '-' ? mess.messType : null);

                        const secDeposit = (() => {
                            if (mess.securityDeposit === 'Custom') {
                                return mess.securityDepositCustom ? `₹${mess.securityDepositCustom}` : null;
                            }
                            if (mess.securityDeposit && mess.securityDeposit !== '-') return mess.securityDeposit;
                            if (typeof mess.advancePayment === 'string' && mess.advancePayment && mess.advancePayment !== '-' && mess.advancePayment !== 'No Advance') {
                                return mess.advancePayment === 'Custom' ? (mess.advancePaymentCustom ? `₹${mess.advancePaymentCustom}` : null) : mess.advancePayment;
                            }
                            if (mess.advancePayment?.type && mess.advancePayment.type !== 'None') {
                                const adv = mess.advancePayment;
                                return (adv.type === 'Custom Amount' || adv.type === 'Custom') ? (adv.customAmount ? `₹${adv.customAmount}` : null) : adv.type;
                            }
                            if (mess.advanceDeposit && mess.advanceDeposit !== '-') return mess.advanceDeposit;
                            return null;
                        })();

                        const notice = mess.noticePeriod === 'Other' ? mess.noticePeriodCustom : mess.noticePeriod;
                        const validNotice = notice && notice !== '-' && notice.trim() !== '' ? notice : null;

                        const electricity = mess.electricityBill === 'Extra Fixed' && mess.electricityBillAmount
                            ? `Extra Fixed (₹${mess.electricityBillAmount}/mo)`
                            : (mess.electricityBill && mess.electricityBill !== '-' ? mess.electricityBill : null);

                        const rawMaintAmt = mess.maintenanceFeeAmount || (mess.maintenanceCharge?.amount ? String(mess.maintenanceCharge.amount) : '');
                        const hasMaintTaken = mess.maintenanceCharge && (mess.maintenanceCharge.taken === true || mess.maintenanceCharge.taken === 'true' || Number(mess.maintenanceCharge.amount) > 0);
                        const maintenance = (mess.maintenanceFee === 'Extra Charge' || hasMaintTaken)
                            ? `Extra Charge${rawMaintAmt ? ` (₹${rawMaintAmt}/mo)` : ''}`
                            : ((mess.maintenanceFee && mess.maintenanceFee !== '-')
                                ? mess.maintenanceFee
                                : (mess.maintenanceCharge?.taken !== undefined
                                    ? (mess.maintenanceCharge.taken ? `Extra Charge${rawMaintAmt ? ` (₹${rawMaintAmt})` : ''}` : 'No Extra Charge')
                                    : null));

                        const cleaning = mess.cleaningCharges === 'Extra Charge' && mess.cleaningChargesAmount
                            ? `Extra Charge (₹${mess.cleaningChargesAmount}/mo)`
                            : (mess.cleaningCharges && mess.cleaningCharges !== '-' ? mess.cleaningCharges : null);

                        const policyItems = [];
                        if (propType) policyItems.push(<li key="propType"><strong>Property Type:</strong> {propType}</li>);
                        if (secDeposit) policyItems.push(<li key="secDeposit"><strong>Security Deposit:</strong> {secDeposit}</li>);
                        if (validNotice) policyItems.push(<li key="notice"><strong>Notice Period:</strong> {validNotice}</li>);
                        if (electricity) policyItems.push(<li key="electricity"><strong>Electricity:</strong> {electricity}</li>);
                        if (maintenance) policyItems.push(<li key="maintenance"><strong>Maintenance:</strong> {maintenance}</li>);
                        if (cleaning) policyItems.push(<li key="cleaning"><strong>Cleaning:</strong> {cleaning}</li>);

                        // Living Services & Facilities Items
                        const food = (mess.foodFacility && mess.foodFacility !== '-')
                            ? `${mess.foodFacility}${mess.foodType ? ` (${mess.foodType})` : ''}`
                            : (mess.amenities?.food ? 'Food Available' : (mess.foodType && mess.foodType !== '-' ? `Food (${mess.foodType})` : null));

                        const water = mess.waterFacility && mess.waterFacility !== '-' ? mess.waterFacility : null;
                        const laundry = mess.laundryFacility && mess.laundryFacility !== '-' ? mess.laundryFacility : null;
                        const housekeeping = (mess.cleaningFrequency && mess.cleaningFrequency !== '-')
                            ? `${mess.cleaningFrequency} Cleaning`
                            : (mess.cleaningService && mess.cleaningService !== '-' && mess.cleaningService !== 'None' ? mess.cleaningService : null);
                        const security = (mess.cctvInstalled && mess.cctvInstalled !== '-')
                            ? mess.cctvInstalled
                            : ((mess.security && mess.security !== '-')
                                ? mess.security
                                : (mess.cctv ? 'CCTV Installed' : null));

                        const serviceItems = [];
                        if (food) serviceItems.push(<li key="food"><strong>Food:</strong> {food}</li>);
                        if (water) serviceItems.push(<li key="water"><strong>Water Supply:</strong> {water}</li>);
                        if (laundry) serviceItems.push(<li key="laundry"><strong>Laundry:</strong> {laundry}</li>);
                        if (housekeeping) serviceItems.push(<li key="housekeeping"><strong>Housekeeping:</strong> {housekeeping}</li>);
                        if (security) serviceItems.push(<li key="security"><strong>Security:</strong> {security}</li>);

                        if (policyItems.length === 0 && serviceItems.length === 0) return null;

                        const hasBoth = policyItems.length > 0 && serviceItems.length > 0;

                        return (
                            <div className={`mt-6 pt-6 border-t border-gray-100 grid grid-cols-1 ${hasBoth ? 'md:grid-cols-2' : ''} gap-6`}>
                                {policyItems.length > 0 && (
                                    <div>
                                        <h4 className="font-bold text-gray-900 mb-2">Mess Policies &amp; Billing</h4>
                                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1.5">
                                            {policyItems}
                                        </ul>
                                    </div>
                                )}
                                {serviceItems.length > 0 && (
                                    <div>
                                        <h4 className="font-bold text-gray-900 mb-2">Living Services &amp; Facilities</h4>
                                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1.5">
                                            {serviceItems}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </div>
            </div>




            {/* Contact Owner Modal */}
            <AnimatePresence>
                {showConfirmModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                            onClick={() => setShowConfirmModal(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white w-full max-w-sm rounded-3xl p-6 relative z-10 shadow-2xl"
                        >
                            <div className="text-center mb-5">
                                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                                    <Phone size={32} />
                                </div>
                                <h3 className="text-2xl font-bold text-brand-text-dark">Contact Owner</h3>
                                <p className="text-gray-500 mt-2 text-sm">
                                    You are about to call the owner of <strong>{mess.name}</strong>.
                                </p>
                            </div>

                            {/* Polite Instructions */}
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
                                <div className="flex items-start gap-2">
                                    <AlertCircle size={18} className="text-amber-600 mt-0.5 shrink-0" />
                                    <div className="text-sm text-amber-800 space-y-1">
                                        <p className="font-semibold">Please keep in mind:</p>
                                        <ul className="list-disc list-inside text-xs space-y-0.5 text-amber-700">
                                            <li>Introduce yourself politely</li>
                                            <li>Mention you found the mess on <strong>MessKhojo</strong></li>
                                            <li>Be respectful of the owner's time</li>
                                            <li>Ask your queries clearly and patiently</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Room Type</span>
                                    <span className="font-bold text-gray-900">{({
                                        'Single': '1',
                                        'Double': '2',
                                        'Triple': '3',
                                        'Four': '4',
                                        'Five': '5',
                                        'Six': '6'
                                    })[room.occupancy] || room.occupancy} Seater</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Price</span>
                                    <span className="font-bold text-gray-900">₹{room.price}/mo</span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmBooking}
                                    disabled={bookingProcessing}
                                    className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-green-200 disabled:opacity-70 flex items-center justify-center gap-2"
                                >
                                    <Phone size={18} />
                                    {bookingProcessing ? 'Connecting...' : 'Call Now'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Availability Inquiry Modal - Seat availability feature hidden/deactivated */}
            {/*
            <AnimatePresence>
                {showNotifyModal && (
                    <div className={`fixed inset-0 z-50 flex items-center justify-center ${notifyStep === 'success' ? 'p-0' : 'p-4'}`}>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                            onClick={handleCloseNotifyModal}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className={`bg-white w-full ${notifyStep === 'success' ? 'h-full max-w-none rounded-none flex flex-col' : 'max-w-sm rounded-3xl p-6'} relative z-10 shadow-2xl overflow-y-auto scrollbar-hide`}
                        >
                            {notifyStep === 'form' ? (
                                <>
                                    <div className="text-center mb-6">
                                        <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-500">
                                            <Bell size={32} />
                                        </div>
                                        <h3 className="text-2xl font-bold text-brand-text-dark">Unavailable?</h3>
                                        <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                                            This room is currently sold out. Send a request to know when seats become available.
                                        </p>
                                    </div>

                                    <form onSubmit={handleNotifySubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone Number <span className="text-red-500">*</span></label>
                                            <input
                                                type="tel"
                                                value={notifyPhone}
                                                onChange={(e) => setNotifyPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                                placeholder="10 digit mobile number"
                                                required
                                                maxLength="10"
                                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Custom Message (Optional)</label>
                                            <textarea
                                                value={notifyMessage}
                                                onChange={(e) => setNotifyMessage(e.target.value)}
                                                placeholder="Any specific requirements?"
                                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-24"
                                            />
                                        </div>

                                        <div className="flex items-start gap-3 my-2">
                                            <input
                                                type="checkbox"
                                                id="notify-consent"
                                                checked={notifyConsent}
                                                onChange={(e) => setNotifyConsent(e.target.checked)}
                                                className="w-5 h-5 accent-indigo-500 mt-0.5 cursor-pointer shrink-0"
                                            />
                                            <label htmlFor="notify-consent" className="text-xs text-gray-500 cursor-pointer text-left leading-tight">
                                                I agree to the <a href="/terms-and-conditions" target="_blank" rel="noopener noreferrer" className="text-indigo-500 font-bold hover:underline">Terms & Conditions</a> and <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-indigo-500 font-bold hover:underline">Privacy Policy</a>.
                                            </label>
                                        </div>

                                        <div className="flex gap-3 pt-2">
                                            <button
                                                type="button"
                                                onClick={handleCloseNotifyModal}
                                                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={notifyLoading || !notifyConsent}
                                                className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed"
                                            >
                                                {notifyLoading ? 'Sending...' : 'Notify Owner'}
                                            </button>
                                        </div>
                                    </form>
                                </>
                            ) : (
                                <div className="flex flex-col min-h-screen bg-gray-50">
                                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 px-6 pt-16 pb-12 text-white text-center relative shrink-0 shadow-lg">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                                            className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl"
                                        >
                                            <CheckCircle size={48} className="text-indigo-500" />
                                        </motion.div>
                                        
                                        <h3 className="text-3xl font-bold mb-3">Request Received!</h3>
                                        <p className="text-indigo-100 text-lg leading-relaxed max-w-md mx-auto">
                                            You'll be notified when a seat becomes available in the{' '}
                                            <span className="font-semibold text-white">
                                                {room.occupancy} Seater
                                            </span>{' '}
                                            at <span className="font-semibold text-white">{mess.name}</span>.
                                        </p>
                                    </div>

                                    <div className="px-6 pt-8 pb-8 -mt-6 bg-gray-50 rounded-t-3xl flex-1 flex flex-col relative z-10">
                                        {(loadingSimilar || similarRooms.length > 0) && (
                                            <div className="mb-8">
                                                <div className="flex items-center justify-between mb-6">
                                                    <h4 className="text-xl font-bold text-gray-800">
                                                        🛏️ Available Rooms Nearby
                                                    </h4>
                                                    <button 
                                                        onClick={() => { handleCloseNotifyModal(); navigate('/'); }}
                                                        className="text-sm text-indigo-500 font-bold hover:underline"
                                                    >
                                                        Browse All →
                                                    </button>
                                                </div>

                                                {loadingSimilar ? (
                                                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
                                                        {[1, 2, 3].map(i => (
                                                            <div key={i} className="shrink-0 w-60 h-48 rounded-3xl skeleton-shimmer" />
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide">
                                                        {similarRooms.map(sr => (
                                                            <SimilarRoomCard
                                                                key={sr.id}
                                                                room={sr}
                                                                currentMess={mess}
                                                                onClose={handleCloseNotifyModal}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="mt-auto pt-6">
                                            <button
                                                onClick={handleCloseNotifyModal}
                                                className="w-full py-4 bg-white border-2 border-gray-200 hover:bg-gray-100 text-gray-800 font-bold text-lg rounded-2xl transition-colors shadow-sm"
                                            >
                                                Close & Return
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )
                }
            </AnimatePresence >
            */}

            {/* Phone Collection Modal */}
            {
                showPhoneModal && currentUser && (
                    <PhoneCollectionModal
                        user={currentUser}
                        onClose={(phone) => {
                            setUserPhone(phone);
                            setShowPhoneModal(false);
                            setShowConfirmModal(true); // Proceed to booking confirmation
                        }}
                        onSkip={() => {
                            setShowPhoneModal(false);
                            // Don't proceed to booking without phone
                        }}
                    />
                )
            }
        </div >
    );
};

const RoomDetailsSkeleton = () => {
    return (
        <div className="min-h-screen bg-brand-secondary pb-20 font-sans">
            {/* Header / Nav */}
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-brand-light-gray px-4 py-3 flex items-center gap-4">
                <div className="w-8 h-8 rounded-full skeleton-shimmer" />
                <div className="h-6 w-32 rounded-lg skeleton-shimmer" />
            </div>

            <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
                {/* Image Gallery */}
                <div className="bg-white rounded-2xl p-2 border border-brand-light-gray">
                    <div className="w-full h-64 rounded-xl skeleton-shimmer" />
                </div>

                {/* Title & Price */}
                <div className="bg-white rounded-2xl p-6 border border-brand-light-gray flex flex-col md:flex-row justify-between md:items-start gap-4">
                    <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-32 rounded-xl skeleton-shimmer" />
                            <div className="h-5 w-16 rounded-full skeleton-shimmer" />
                            <div className="w-8 h-8 rounded-full skeleton-shimmer" />
                        </div>
                        <div className="h-5 w-48 rounded-lg skeleton-shimmer" />
                    </div>
                    <div className="space-y-2 md:text-right">
                        <div className="h-8 w-28 rounded-xl skeleton-shimmer" />
                        <div className="h-5 w-24 rounded-lg skeleton-shimmer" />
                    </div>
                </div>

                {/* Amenities */}
                <div className="bg-white rounded-2xl p-6 border border-brand-light-gray">
                    <div className="h-6 w-24 rounded-lg skeleton-shimmer mb-4" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((index) => (
                            <div key={index} className="h-20 rounded-xl skeleton-shimmer" />
                        ))}
                    </div>
                </div>

                {/* Description */}
                <div className="bg-white rounded-2xl p-6 border border-brand-light-gray space-y-4">
                    <div className="h-6 w-28 rounded-lg skeleton-shimmer" />
                    <div className="space-y-2">
                        <div className="h-4 w-full rounded-md skeleton-shimmer" />
                        <div className="h-4 w-11/12 rounded-md skeleton-shimmer" />
                        <div className="h-4 w-4/5 rounded-md skeleton-shimmer" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const SimilarRoomCard = ({ room, currentMess, onClose }) => {
    const navigate = useNavigate();
    
    const seats = getCleanOccupancy(room.occupancy);
    const displayImg = room.imageUrls?.[0] || room.imageUrl || '/default-room.jpg';
    const isSameMess = room.messId === currentMess.id;
    
    return (
        <button
            onClick={() => {
                import('../analytics').then(({ trackEvent }) => {
                    trackEvent('SimilarRooms', 'similar_room_clicked', room.messId, room.id);
                });
                onClose();
                navigate(`/room/${toMessSlug(currentMess.name, room.messId)}/${toRoomSlug(room.occupancy, room.id)}`);
            }}
            className="shrink-0 w-60 sm:w-64 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden text-left hover:shadow-md hover:-translate-y-1 transition-all active:scale-95 flex flex-col"
        >
            <div className="relative h-32 bg-gray-100 shrink-0">
                <img src={displayImg} alt={`${seats} Seater Room at ${room.messId !== currentMess.id ? (room.messName || 'Other Mess') : currentMess.name}`} className="w-full h-full object-cover" />
                {isSameMess && (
                    <div className="absolute top-3 left-3 bg-brand-primary text-white text-[10px] font-bold px-2 py-1 rounded-full">
                        Same Mess
                    </div>
                )}
                <div className="absolute top-3 right-3 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                    Available
                </div>
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                    <p className="text-sm font-bold text-gray-900 truncate">{seats} Seater</p>
                    <p className="text-xs text-gray-500 truncate mt-1">
                        {room.messId !== currentMess.id ? room.messName || 'Other Mess' : currentMess.name}
                    </p>
                </div>
                <p className="text-lg font-extrabold text-indigo-600 mt-2">
                    ₹{room.price}<span className="text-xs font-normal text-gray-400">/mo</span>
                </p>
            </div>
        </button>
    );
};

export default RoomDetails;
