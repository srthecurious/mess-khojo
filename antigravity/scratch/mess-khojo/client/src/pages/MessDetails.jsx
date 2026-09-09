import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { 
    MapPin, Phone, ArrowLeft, ExternalLink, Utensils, Droplets, Wifi, Zap, Wind, 
    Camera, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Briefcase, Info, ShieldCheck, AlertCircle, 
    BedDouble, EyeOff, MessageCircle, Send, Check, User, X, Image as ImageIcon, 
    Heart, Building2, Bell, Calendar, Clock, Sparkles, Layers, Shield, CheckCircle2, 
    XCircle, FileText, CheckCircle, Flame, Car, Coffee, HelpCircle, CheckSquare, 
    DoorOpen, Users, Home, AlertTriangle
} from 'lucide-react';
import { auth } from '../firebase';
import { serverTimestamp, collection, getDocs, query, orderBy, startAt, endAt, doc, getDoc, addDoc, where } from 'firebase/firestore';
import { db } from '../firebase';
import { getMess, watchRoomsByMess } from '../services/messService';
import { addClaim } from '../services/bookingService';
import { getUserDoc } from '../services/userService';
import RoomCard from '../components/RoomCard';
import ClaimModal from '../components/ClaimModal';
import PhoneCollectionModal from '../components/PhoneCollectionModal';
import { trackMessView, trackContactClick, trackEvent, trackGalleryView, trackContactOwner, trackBookingInitiated } from '../analytics';
import { usePageSEO, generateMessSchema } from '../hooks/usePageSEO';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { BRAND } from '../constants';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { motion, AnimatePresence } from 'framer-motion';
import { toMessSlug, isSlug, idSuffixFromSlug } from '../utils/slugify';

const getFoodFacilityDisplay = (mess) => {
    if (!mess) return '-';
    if (mess.foodFacility) {
        const ff = mess.foodFacility.trim();
        const lff = ff.toLowerCase();
        if (lff.includes('student')) return 'Managed by Students';
        if (lff.includes('warden')) return 'Managed by Warden';
        if (lff.includes('canteen')) return 'Nearby Canteen';
        if (lff.includes('owner') || lff.includes('fssai') || lff.includes('rent')) return 'Managed by Owner';
        if (lff.includes('no food') || lff.includes('not available')) return 'Not Available';
        if (ff.length > 2) return ff;
    }
    if (mess.foodAvailability === 'No Food') return 'Not Available';
    if (mess.foodAvailability === 'Self Cook') return 'Managed by Students';
    if (mess.managedBy) {
        const val = mess.managedBy.trim();
        if (val.toLowerCase() === 'nearby canteen') return 'Nearby Canteen';
        if (val.toLowerCase().startsWith('managed by')) return val;
        if (val.toLowerCase() === 'none' || val.toLowerCase() === 'no') return 'Not Available';
        return `Managed by ${val}`;
    }
    return 'Managed by Owner';
};

const MessDetails = () => {
    // Support both new slug-based URLs (/mess/aryan-boys-mess-a3f9)
    // and legacy raw Firestore ID URLs (/mess/ABC123xyz)
    const { messSlug } = useParams();
    const [resolvedMessId, setResolvedMessId] = useState(() => {
        // If it looks like a raw Firestore ID (no hyphens), use it directly
        if (messSlug && !isSlug(messSlug)) return messSlug;
        return null; // will be resolved via slug suffix lookup
    });
    const messId = resolvedMessId;
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const { currentUser, userRole } = useAuth();
    const { success: toastSuccess, error: toastError } = useToast();
    const { isRoomWishlisted, toggleRoomWishlist, isMessWishlisted, toggleMessWishlist } = useWishlist();
    const [loginPromptConfig, setLoginPromptConfig] = useState({ show: false, title: '', message: '', icon: '' });
    const [showClaimModal, setShowClaimModal] = useState(false);
    const [showBackToTop, setShowBackToTop] = useState(false);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [userPhone, setUserPhone] = useState('');
    const [bookingProcessing, setBookingProcessing] = useState(false);

    useEffect(() => {
        const onScroll = () => setShowBackToTop(window.scrollY > 400);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const handleRoomWishlistToggle = async (roomId) => {
        if (!currentUser) { 
            setLoginPromptConfig({
                show: true,
                title: 'Save to Wishlist',
                message: 'Login to save messes and rooms to your personal wishlist.',
                icon: '❤️'
            }); 
            return; 
        }
        await toggleRoomWishlist(roomId);
    };
    const [mess, setMess] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(false);
    const [showUserSourcedListing, setShowUserSourcedListing] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [selectedOccupancy, setSelectedOccupancy] = useState('');

    // Extract unique available occupancies from rooms
    const availableOccupancies = useMemo(() => {
        if (!rooms || rooms.length === 0) return [];
        const map = new Map();
        rooms.forEach(r => {
            const occName = r.occupancy || r.name || 'Standard Room';
            if (!map.has(occName)) {
                map.set(occName, {
                    occupancy: occName,
                    price: Number(r.price || r.rent || 0),
                    rentCycle: r.rentCycle || 'monthly',
                    roomId: r.id || null
                });
            }
        });
        return Array.from(map.values());
    }, [rooms]);

    const handleShare = async () => {
        const shareData = {
            title: mess.name,
            text: `Check out ${mess.name} on Mess Khojo!`,
            url: window.location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
                trackEvent('Share', 'share_clicked', 'native', messId);
            } else {
                await navigator.clipboard.writeText(shareData.url);
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
                trackEvent('Share', 'link_copied', 'clipboard', messId);
            }
        } catch (err) {
            console.error('Error sharing:', err);
        }
    };

    const handleBookClick = async (targetRoom = null) => {
        if (!currentUser) {
            const returnUrl = `/mess/${messSlug}?action=book`;
            console.log('🔗 Redirecting to login with return URL:', returnUrl);
            navigate(`/user-login?redirect=${encodeURIComponent(returnUrl)}`);
            return;
        }

        if (!mess.contact || mess.hideContact) {
            alert("Owner's contact is currently unavailable for this mess. Please try again later.");
            return;
        }
        if (userRole !== 'user') {
            alert("Partners cannot book rooms. Please login as a User.");
            return;
        }

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
        }

        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        const phone = userData.phone || '';

        trackBookingInitiated(targetRoom?.id || null, messId, targetRoom?.price || mess.startingPrice || 0);
        trackContactOwner('button_clicked', messId, targetRoom?.id || null);

        setSelectedOccupancy('');

        if (!phone || phone === 'N/A') {
            setShowPhoneModal(true);
        } else {
            setUserPhone(phone);
            setShowConfirmModal(true);
        }
    };

    const handleConfirmBooking = async () => {
        if (!selectedOccupancy) return;
        setBookingProcessing(true);
        try {
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            const userData = userDoc.exists() ? userDoc.data() : {};

            const activeOccObj = availableOccupancies.find(o => o.occupancy === selectedOccupancy);
            const chosenOccupancy = selectedOccupancy || (availableOccupancies[0]?.occupancy) || "General Inquiry";
            const chosenPrice = activeOccObj?.price || mess.startingPrice || 0;

            const bookingData = {
                userId: currentUser.uid,
                userName: userData.name || currentUser.displayName || "User",
                userPhone: userPhone || userData.phone || "N/A",
                messId: mess.id,
                messName: mess.name,
                roomId: activeOccObj?.roomId || null,
                roomType: chosenOccupancy,
                price: chosenPrice,
                rentCycle: activeOccObj?.rentCycle || 'monthly',
                ownerPhone: mess.contact,
                status: 'contacted',
                createdAt: serverTimestamp()
            };

            await addDoc(collection(db, "bookings"), bookingData);

            // Send Telegram Notification
            import('../utils/telegramNotifier').then(({ sendTelegramNotification, telegramTemplates }) => {
                sendTelegramNotification(telegramTemplates.newBooking(bookingData));
            }).catch(err => console.error("Telegram notification error:", err));

            setShowConfirmModal(false);

            trackContactOwner('call_confirmed', messId, activeOccObj?.roomId || null);
            window.location.href = `tel:${mess.contact}`;
        } catch (error) {
            console.error("Contact owner failed:", error);
            alert("Something went wrong. Please try again.");
        } finally {
            setBookingProcessing(false);
        }
    };

    useEffect(() => {
        if (!loading && currentUser && mess) {
            if (searchParams.get('action') === 'book') {
                handleBookClick();
                const newParams = new URLSearchParams(searchParams);
                newParams.delete('action');
                setSearchParams(newParams, { replace: true });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser, loading, mess]);

    const handleClaimListing = () => {
        if (!auth.currentUser) {
            setLoginPromptConfig({
                show: true,
                title: 'Login Required',
                message: 'Please login to claim this listing.',
                icon: '🔒'
            });
            return;
        }
        setShowClaimModal(true);
    };

    const handleClaimSubmit = async (claimFormData) => {
        try {
            setClaiming(true);
            const userDoc = await getUserDoc(auth.currentUser.uid);
            let userData = {};
            if (userDoc.exists()) userData = userDoc.data();

            const claimData = {
                messId,
                messName: mess.name,
                userId: auth.currentUser.uid,
                userName: userData.name || auth.currentUser.displayName || "Registered User",
                userEmail: auth.currentUser.email,
                claimantName: claimFormData.claimantName,
                userPhone: claimFormData.phone,
                isOwner: claimFormData.isOwner,
                claimAction: claimFormData.actionType === 'change' ? 'change_details' : 'remove_mess',
                feedback: claimFormData.feedback,
                status: 'pending',
                createdAt: serverTimestamp()
            };
            await addClaim(claimData);
            import('../utils/telegramNotifier').then(({ sendTelegramNotification, telegramTemplates }) => {
                sendTelegramNotification(telegramTemplates.newClaim(claimData));
            });
            setShowClaimModal(false);
            toastSuccess('Claim request sent! Our team will contact you for verification.');
        } catch (err) {
            console.error("Claim error:", err);
            toastError('Failed to send claim request. Please try again.');
        } finally {
            setClaiming(false);
        }
    };

    const handleMessWishlistClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!currentUser) {
            setLoginPromptConfig({
                show: true,
                title: 'Save to Wishlist',
                message: 'Login to save messes and rooms to your personal wishlist.',
                icon: '❤️'
            });
            return;
        }
        toggleMessWishlist(messId);
    };

    // Resolve slug to full Firestore document ID using the 4-char suffix
    useEffect(() => {
        if (!messSlug) return;
        if (!isSlug(messSlug)) {
            // Already a raw Firestore ID, no lookup needed
            setResolvedMessId(messSlug);
            return;
        }
        // Extract the 4-char suffix (which is the prefix of the Firestore document ID)
        const suffix = idSuffixFromSlug(messSlug);
        if (!suffix) return;

        // Query Firestore: find all docs whose ID starts with this prefix
        getDocs(query(
            collection(db, 'messes'),
            orderBy('__name__'),
            startAt(suffix),
            endAt(suffix + '\uf8ff')
        )).then(snap => {
            if (!snap.empty) {
                // Find the exact matching document where slug matches
                const matchedDoc = snap.docs.find(doc => {
                    return toMessSlug(doc.data().name, doc.id) === messSlug;
                });
                setResolvedMessId(matchedDoc ? matchedDoc.id : snap.docs[0].id);
            } else {
                // Fallback: treat the whole slug as a raw ID (handles edge cases)
                setResolvedMessId(messSlug);
            }
        }).catch(() => setResolvedMessId(messSlug));
    }, [messSlug]);

    useEffect(() => {
        if (!resolvedMessId) return;
        let unsubscribeRooms = null;

        const fetchMessAndRooms = async () => {
            try {
                // 1. Fetch Mess Details
                const messDoc = await getMess(resolvedMessId);
                if (messDoc.exists()) {
                    const loadedData = { id: messDoc.id, ...messDoc.data() };
                    window.__currentMess = loadedData;
                    console.log('CURRENT_MESS_DATA:', JSON.stringify(loadedData));
                    setMess(loadedData);
                }

                // 2. Fetch Rooms for this Mess (real-time)
                unsubscribeRooms = watchRoomsByMess(resolvedMessId, (roomsData) => {
                    setRooms(roomsData);
                    setLoading(false);
                });
            } catch (error) {
                console.error("Error fetching details:", error);
                setLoading(false);
            }
        };

        fetchMessAndRooms();

        return () => {
            if (unsubscribeRooms) unsubscribeRooms();
        };
    }, [resolvedMessId]);

    // Scroll to top on mount/change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [messId]);

    // Ensure URL in address bar displays canonical mess name and ID slug format
    useEffect(() => {
        if (mess && mess.name && mess.id) {
            const canonicalSlug = toMessSlug(mess.name, mess.id);
            if (messSlug !== canonicalSlug) {
                navigate(`/mess/${canonicalSlug}${window.location.search}${window.location.hash}`, { replace: true });
            }
        }
    }, [mess, messSlug, navigate]);


    // Track mess view when component mounts
    useEffect(() => {
        if (mess) {
            trackMessView(messId, mess.name);
        }
    }, [mess, messId]);

    // Dynamic SEO for mess detail pages
    usePageSEO({
        title: mess ? `${mess.name} - ${mess.messType || 'Mess'} in ${mess.district ? mess.district.charAt(0).toUpperCase() + mess.district.slice(1) : 'Balasore'} | MessKhojo` : 'Loading... | MessKhojo',
        description: mess ? `${mess.name} offers ${mess.messType || 'quality'} accommodation in ${mess.address || 'Balasore'}. ${mess.description ? mess.description.substring(0, 120) + '...' : `Check amenities, pricing & availability. ${mess.amenities?.food ? 'Food available. ' : ''}${mess.amenities?.wifi ? 'WiFi included. ' : ''}`}` : 'Find mess accommodation on MessKhojo',
        keywords: mess ? `${mess.name}, ${mess.name} balasore, ${mess.name} ${mess.address || ''}, ${mess.messType} mess balasore, mess near ${mess.address || 'fm college'}, ${mess.name} hostel, student accommodation balasore` : undefined,
        canonicalUrl: mess ? `https://messkhojo.com/mess/${toMessSlug(mess.name, mess.id)}` : undefined,
        ogImage: mess?.posterUrl || mess?.images?.[0] || 'https://messkhojo.com/logo.png',
        ogType: 'business.business',
        structuredData: mess ? generateMessSchema({ ...mess, _slug: toMessSlug(mess.name, mess.id) }) : null
    });

    useBodyScrollLock(showConfirmModal || showPhoneModal || showClaimModal);

    // Inject structured data for this mess
    useEffect(() => {
        if (!mess) return;

        const schema = generateMessSchema({ ...mess, id: messId });
        if (!schema) return;

        // Create or update script tag
        let scriptTag = document.getElementById('mess-schema');
        if (!scriptTag) {
            scriptTag = document.createElement('script');
            scriptTag.id = 'mess-schema';
            scriptTag.type = 'application/ld+json';
            document.head.appendChild(scriptTag);
        }
        scriptTag.textContent = JSON.stringify(schema);

        return () => {
            const tag = document.getElementById('mess-schema');
            if (tag) tag.remove();
        };
    }, [mess, messId]);

    if (loading) return <MessDetailsSkeleton />;
    if (!mess) return <div className="p-10 text-center text-red-500 font-bold">Mess not found</div>;

    // Handle hidden messes for regular users
    const isOperator = auth.currentUser?.email === import.meta.env.VITE_OP_EMAIL;
    if (mess.hidden && !isOperator) {
        return (
            <div className="min-h-screen bg-brand-secondary flex items-center justify-center p-4">
                <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md text-center">
                    <div className="bg-rose-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-500">
                        <EyeOff size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-brand-text-dark mb-2">Listing Private</h2>
                    <p className="text-brand-text-gray mb-8">This mess listing is currently shared only as a private link or is being updated by the team.</p>
                    <button onClick={() => navigate('/')} className="w-full bg-brand-primary text-white py-3 rounded-2xl font-bold">
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    // Helper to normalize occupancy for consistent grouping
    const normalizeOccupancy = (val) => {
        if (!val) return 'Other';
        const s = String(val).toLowerCase().trim();
        // Check for 1/Single
        if (s === '1' || s === 'single' || s === '1 seater' || s.includes('single')) return '1';
        // Check for 2/Double
        if (s === '2' || s === 'double' || s === '2 seater' || s.includes('double')) return '2';
        // Check for 3/Triple
        if (s === '3' || s === 'triple' || s === '3 seater' || s.includes('triple')) return '3';
        // Check for 4
        if (s === '4' || s === 'four' || s === '4 seater') return '4';
        // Check for 5
        if (s === '5' || s === 'five' || s === '5 seater') return '5';
        // Check for 6
        if (s === '6' || s === 'six' || s === '6 seater') return '6';
        // Check for 8
        if (s === '8' || s === 'eight' || s === '8 seater') return '8';

        return val; // Fallback for custom types
    };

    // Group rooms by Occupancy
    const groupedRooms = rooms.reduce((acc, room) => {
        const rawOccupancy = room.occupancy || 'Other';
        const occupancy = normalizeOccupancy(rawOccupancy);

        if (!acc[occupancy]) {
            acc[occupancy] = [];
        }
        acc[occupancy].push(room);
        return acc;
    }, {});

    // Sort room groups: 1, 2, 3, ... others
    const occupancyOrder = ['1', '2', '3', '4', '5', '6', '8'];
    const sortedGroups = Object.entries(groupedRooms).sort((a, b) => {
        const indexA = occupancyOrder.indexOf(a[0]);
        const indexB = occupancyOrder.indexOf(b[0]);

        // If both are in the known order list
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;

        // If only A is known, it comes first
        if (indexA !== -1) return -1;

        // If only B is known, it comes first
        if (indexB !== -1) return 1;

        // If neither is known, sort alphabetically/numerically
        return a[0].localeCompare(b[0], undefined, { numeric: true, sensitivity: 'base' });
    });

    // Helper to check amenity for display (Mess Level > Fallback to Room Level)
    const checkAmenity = (key) => {
        if (mess.amenities && mess.amenities[key] !== undefined) return mess.amenities[key];
        return rooms.some(r => {
            const rAm = r.amenities || r;
            return rAm[key] === true;
        });
    };

    const hasFood = checkAmenity('food');
    const hasWifi = checkAmenity('wifi');
    const hasInverter = checkAmenity('inverter');

    return (
        <div className="min-h-screen bg-brand-secondary font-sans text-brand-text-dark pb-20">

            {/* Claim Modal */}
            {showClaimModal && (
                <ClaimModal
                    messName={mess.name}
                    onSubmit={handleClaimSubmit}
                    onClose={() => setShowClaimModal(false)}
                    loading={claiming}
                />
            )}

            {/* Back to Top Button */}
            <AnimatePresence>
                {showBackToTop && (
                    <motion.button
                        initial={{ opacity: 0, y: 20, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="fixed bottom-24 right-6 z-50 w-11 h-11 bg-brand-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-brand-primary-hover transition-colors"
                        aria-label="Back to top"
                    >
                        <ChevronUp size={20} />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Login Prompt Modal - slides down from top */}
            {loginPromptConfig.show && (
                <div className="fixed inset-0 z-[200] flex flex-col items-center pointer-events-none">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
                        onClick={() => setLoginPromptConfig({ ...loginPromptConfig, show: false })}
                    />
                    <div className="relative pointer-events-auto w-full max-w-sm mt-20 mx-4 bg-white rounded-3xl shadow-2xl p-6">
                        <div className="flex flex-col items-center text-center gap-3">
                            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-2xl">{loginPromptConfig.icon || '👋'}</div>
                            <h3 className="text-lg font-bold text-brand-text-dark">{loginPromptConfig.title || 'Login Required'}</h3>
                            <p className="text-sm text-brand-text-gray">{loginPromptConfig.message || 'Please login to continue.'}</p>
                            <button
                                onClick={() => { setLoginPromptConfig({ ...loginPromptConfig, show: false }); navigate(`/user-login?redirect=${encodeURIComponent(window.location.pathname)}`); }}
                                className="w-full py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary-hover transition-colors shadow-lg shadow-brand-primary/20"
                            >
                                Login / Sign Up
                            </button>
                            <button
                                onClick={() => setLoginPromptConfig({ ...loginPromptConfig, show: false })}
                                className="text-sm text-brand-text-gray hover:text-brand-text-dark transition-colors"
                            >
                                Maybe later
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header Area — Full-width Image Banner */}
            {(() => {
                const bannerImage = mess.posterUrl || mess.galleryUrls?.[0] || null;
                return (
                    <div className="relative overflow-hidden shadow-lg">
                        {/* --- IMAGE or GRADIENT BANNER --- */}
                        {bannerImage ? (
                            <div className="relative w-full h-56 sm:h-72 md:h-80">
                                <img
                                    src={bannerImage}
                                    alt={`${mess.name} — ${Array.isArray(mess.messType) ? mess.messType.join(' & ') : (mess.messType || 'Mess')} in ${mess.city ? mess.city.charAt(0).toUpperCase() + mess.city.slice(1) : 'Balasore'}, Odisha`}
                                    className="w-full h-full object-cover"
                                />
                                {/* Darkening overlay so text is always readable */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />
                            </div>
                        ) : (
                            /* Fallback: rich gradient with pattern */
                            <div className="relative w-full h-56 sm:h-72 md:h-80 bg-gradient-to-br from-brand-primary via-purple-700 to-indigo-800 flex items-center justify-center overflow-hidden">
                                {/* subtle decorative circles */}
                                <div className="absolute -top-16 -left-16 w-64 h-64 bg-white/5 rounded-full" />
                                <div className="absolute -bottom-20 -right-8 w-72 h-72 bg-white/5 rounded-full" />
                                <div className="absolute top-8 right-12 w-32 h-32 bg-white/5 rounded-full" />
                            </div>
                        )}

                        {/* --- FLOATING TOP BAR: Back + Share + Wishlist --- */}
                        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20">
                            <button
                                onClick={() => {
                                    if (window.history.length > 1) {
                                        // Primary: go back in browser history (preserves full history stack)
                                        navigate(-1);
                                    } else {
                                        // Fallback for direct page loads (e.g. opened via shared link):
                                        // navigate to the originating city page if CityPage passed it in state,
                                        // otherwise fall back to the homepage.
                                        const fromCityPath = location.state?.fromCityPath;
                                        navigate(fromCityPath || '/');
                                    }
                                }}
                                className="inline-flex items-center text-sm font-semibold text-white bg-black/30 hover:bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-sm transition-all"
                            >
                                <ArrowLeft size={16} className="mr-1.5" /> Back
                            </button>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleMessWishlistClick}
                                    className={`flex items-center justify-center w-9 h-9 rounded-full border shadow-sm backdrop-blur-md transition-all active:scale-95 ${
                                        isMessWishlisted(messId)
                                            ? 'bg-red-500/80 border-red-400'
                                            : 'bg-black/30 border-white/20 hover:bg-black/50'
                                    }`}
                                    title={isMessWishlisted(messId) ? 'Remove from wishlist' : 'Add to wishlist'}
                                >
                                    <Heart size={16} className={`transition-all ${
                                        isMessWishlisted(messId) ? 'fill-white text-white scale-110' : 'text-white fill-transparent'
                                    }`} />
                                </button>
                                <button
                                    onClick={handleShare}
                                    className="flex items-center justify-center w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md border border-white/20 text-white shadow-sm transition-all active:scale-95"
                                    title="Share"
                                >
                                    {isCopied ? <Check size={16} /> : <Send size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* --- BOTTOM OVERLAY: Name + Address + Amenity Pills --- */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 z-20">
                            <div className="flex items-end justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight drop-shadow-md">
                                            {mess.name}
                                        </h1>
                                    </div>
                                    <div className="flex items-center text-white/80 mb-2">
                                        <MapPin size={14} className="mr-1 shrink-0" />
                                        <span className="text-sm line-clamp-1">{mess.address || 'Address not available'}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {/* Property Type Badge */}
                                        {mess.messType && (
                                            <span className="flex items-center text-xs font-semibold text-white bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/20">
                                                <Briefcase size={11} className="mr-1" /> {Array.isArray(mess.messType) ? mess.messType.join(' & ') : mess.messType}
                                            </span>
                                        )}
                                        {/* Operating Since Badge */}
                                        {mess.operatingSince && (
                                            <span className="flex items-center text-xs font-semibold text-white bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/20">
                                                <Calendar size={11} className="mr-1" /> Est. {mess.operatingSince}
                                            </span>
                                        )}
                                        {/* Food Pill */}
                                        {hasFood && (
                                            <span className="flex items-center text-xs font-semibold text-white bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/20">
                                                <Utensils size={11} className="mr-1" /> {mess.foodType ? `Food (${mess.foodType})` : 'Food Available'}
                                            </span>
                                        )}
                                        {/* WiFi Pill */}
                                        {hasWifi && (
                                            <span className="flex items-center text-xs font-semibold text-white bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/20">
                                                <Wifi size={11} className="mr-1" /> WiFi
                                            </span>
                                        )}
                                        {/* Inverter/Power Pill */}
                                        {hasInverter && (
                                            <span className="flex items-center text-xs font-semibold text-white bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/20">
                                                <Zap size={11} className="mr-1" /> Power Backup
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons — anchored to bottom-right */}
                                <div className="flex flex-col gap-2 shrink-0">
                                    {mess.locationUrl ? (
                                        <a
                                            href={mess.locationUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={() => trackContactClick('location', messId)}
                                            className="flex items-center gap-1.5 bg-brand-primary hover:bg-brand-primary-hover text-white px-3 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg active:scale-95"
                                        >
                                            <MapPin size={15} /> Locate
                                            <ExternalLink size={12} className="opacity-70" />
                                        </a>
                                    ) : (
                                        <button disabled className="flex items-center gap-1.5 bg-white/20 text-white/50 px-3 py-2 rounded-xl text-sm cursor-not-allowed">
                                            <MapPin size={15} /> Locate
                                        </button>
                                    )}

                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {mess.isUserSourced && (
                <div className="max-w-[1440px] mx-auto px-4 mt-6">
                    <div className={`grid grid-cols-1 ${showUserSourcedListing ? 'md:grid-cols-2' : ''} gap-4`}>
                        <div className="bg-brand-accent-blue/10 border border-brand-accent-blue/20 rounded-2xl p-3 flex flex-col justify-between">
                            <div className="flex items-start gap-3">
                                <div className="bg-brand-accent-blue/20 p-1.5 rounded-lg text-brand-accent-blue mt-1 shrink-0">
                                    <ShieldCheck size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-brand-text-dark mb-0.5 text-sm">Our Policy</h3>
                                    <p className="text-xs text-brand-text-gray leading-relaxed">
                                        We strive for accuracy, but we recommend visiting the premises before making any payments.
                                        <strong> Mess Khojo is not responsible for any discrepancies.</strong>
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowUserSourcedListing(!showUserSourcedListing)}
                                className="self-end mt-2 text-xs font-bold text-brand-primary hover:text-brand-primary-hover flex items-center gap-1 transition-colors"
                            >
                                {showUserSourcedListing ? 'Show Less' : 'Read More'}
                                {showUserSourcedListing ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                        </div>

                        {showUserSourcedListing && (
                            <div className="bg-brand-amber/10 border border-brand-amber/20 rounded-2xl p-3 flex items-start gap-3 animate-fadeIn">
                                <div className="bg-brand-amber/20 p-1.5 rounded-lg text-brand-amber mt-1 shrink-0">
                                    <Info size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-brand-text-dark mb-0.5 text-sm">User Sourced Listing</h3>
                                    <p className="text-xs text-brand-text-gray mb-1.5">This information was provided by our community and has not been verified by the owner yet.</p>
                                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-brand-amber uppercase tracking-wider">
                                        <AlertCircle size={12} /> Last updated: {mess.lastUpdatedDate ? new Date(mess.lastUpdatedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently'}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Rooms Grid */}
            <div className="max-w-[1440px] mx-auto px-4 py-8 md:py-12">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold text-brand-text-dark">Available Room Types</h2>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-primary/10 text-brand-primary">
                            {sortedGroups.length} Types
                        </span>
                    </div>
                    {sortedGroups.length > 1 && (
                        <div className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-gray-400">
                            <span>Scroll horizontally</span>
                            <span>→</span>
                        </div>
                    )}
                </div>

                {
                    rooms.length > 0 ? (
                        <div className="flex flex-col md:flex-row md:overflow-x-auto gap-6 pb-6 pt-1 md:snap-x md:hide-scrollbar md:-mx-4 md:px-4 lg:mx-0 lg:px-0">
                            {sortedGroups.map(([occupancy, groupRooms]) => (
                                <div
                                    key={occupancy}
                                    className="w-full md:min-w-[320px] md:max-w-[360px] md:flex-shrink-0 md:snap-start flex flex-col"
                                >
                                    <RoomTypeGroup
                                        occupancy={occupancy}
                                        rooms={groupRooms}
                                        isRoomWishlisted={isRoomWishlisted}
                                        onToggleRoomWishlist={handleRoomWishlistToggle}
                                        isUserSourced={mess.isUserSourced}
                                        messName={mess.name}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-white rounded-3xl shadow-sm border border-dashed border-brand-light-gray flex flex-col items-center gap-4">
                            <div className="bg-brand-secondary p-4 rounded-full text-brand-primary">
                                <Utensils size={40} className="opacity-40" />
                            </div>
                            <div>
                                <p className="text-brand-text-dark font-bold text-xl">More details coming soon!</p>
                                <p className="text-brand-text-gray">We're collecting more information about this mess. Please contact the provider for current availability.</p>
                            </div>
                        </div>
                    )
                }

                {/* About, Policies, Services & Fee Structure Section */}
                <div className="mt-12 space-y-8">
                    {/* Top Overview & Policies Banner */}
                    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-brand-light-gray">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-purple-100 p-2.5 rounded-xl text-brand-primary">
                                <Info size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-brand-text-dark">About &amp; Overview</h2>
                                <p className="text-xs text-brand-text-gray mt-0.5">Property specifications, management, and occupancy rules</p>
                            </div>
                        </div>

                        {mess.description && (
                            <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap mb-6 bg-gray-50/70 p-4 rounded-2xl border border-gray-100">
                                {mess.description}
                            </div>
                        )}

                        {/* Metadata Grid */}
                        {(() => {
                            const propType = Array.isArray(mess.messType) 
                                ? (mess.messType.length > 0 ? mess.messType.join(' & ') : null)
                                : (mess.messType && mess.messType !== '-' ? mess.messType : null);

                            const hasFoodInfo = Boolean(
                                mess.managedBy || 
                                mess.foodFacility || 
                                mess.foodAvailability || 
                                mess.amenities?.food || 
                                mess.foodType || 
                                hasFood
                            );
                            const foodDisplay = hasFoodInfo ? getFoodFacilityDisplay(mess) : null;

                            const resolvedNotice = mess.noticePeriod === 'Other' ? mess.noticePeriodCustom : mess.noticePeriod;
                            const hasNotice = resolvedNotice && resolvedNotice.trim() !== '' && resolvedNotice !== '-';

                            const hasOperatingSince = mess.operatingSince && mess.operatingSince.toString().trim() !== '' && mess.operatingSince !== '-';

                            const capacity = (mess.totalBeds || mess.totalRooms);
                            const hasCapacity = capacity && capacity.toString().trim() !== '' && capacity !== '-';

                            const items = [];

                            if (propType) {
                                items.push(
                                    <div key="type" className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 flex flex-col justify-between flex-1 min-w-[140px]">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Property Type</span>
                                        <div className="flex items-center gap-1.5 mt-1 font-bold text-gray-800 text-sm">
                                            <Briefcase size={14} className="text-brand-primary shrink-0" />
                                            <span className="truncate">{propType}</span>
                                        </div>
                                    </div>
                                );
                            }

                            if (foodDisplay && foodDisplay !== '-') {
                                items.push(
                                    <div key="food" className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 flex flex-col justify-between flex-1 min-w-[140px]">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Food Facility</span>
                                        <div className="flex items-center gap-1.5 mt-1 font-bold text-gray-800 text-sm" title={`Food Facility: ${foodDisplay}`}>
                                            <Utensils size={14} className="text-emerald-600 shrink-0" />
                                            <span className="truncate">{foodDisplay}</span>
                                        </div>
                                    </div>
                                );
                            }

                            if (hasNotice) {
                                items.push(
                                    <div key="notice" className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 flex flex-col justify-between flex-1 min-w-[140px]">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Notice Period</span>
                                        <div className="flex items-center gap-1.5 mt-1 font-bold text-gray-800 text-sm">
                                            <Clock size={14} className="text-indigo-600 shrink-0" />
                                            <span className="truncate">{resolvedNotice}</span>
                                        </div>
                                    </div>
                                );
                            }

                            if (hasOperatingSince) {
                                items.push(
                                    <div key="operating" className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 flex flex-col justify-between flex-1 min-w-[140px]">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Established</span>
                                        <div className="flex items-center gap-1.5 mt-1 font-bold text-gray-800 text-sm">
                                            <Calendar size={14} className="text-amber-600 shrink-0" />
                                            <span className="truncate">{mess.operatingSince.toString().startsWith('Est.') ? mess.operatingSince : `Est. ${mess.operatingSince}`}</span>
                                        </div>
                                    </div>
                                );
                            }

                            if (hasCapacity) {
                                items.push(
                                    <div key="capacity" className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 flex flex-col justify-between flex-1 min-w-[140px]">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Capacity</span>
                                        <div className="flex items-center gap-1.5 mt-1 font-bold text-gray-800 text-sm">
                                            <BedDouble size={14} className="text-cyan-600 shrink-0" />
                                            <span className="truncate">{capacity} Beds</span>
                                        </div>
                                    </div>
                                );
                            }

                            if (items.length === 0) return null;

                            return (
                                <div className="flex flex-wrap gap-3">
                                    {items}
                                </div>
                            );
                        })()}
                    </div>

                    {/* Services & Facilities Grid Card */}
                    {(() => {
                        const hasFoodData = Boolean(
                            mess.foodFacility || 
                            mess.foodAvailability || 
                            mess.foodType || 
                            mess.managedBy || 
                            hasFood
                        );
                        const hasWater = Boolean(mess.waterFacility && mess.waterFacility.trim() !== '' && mess.waterFacility !== '-');
                        const hasLaundry = Boolean(mess.laundryFacility && mess.laundryFacility.trim() !== '' && mess.laundryFacility !== '-');
                        const hasCleaning = Boolean(
                            (mess.cleaningFrequency && mess.cleaningFrequency.trim() !== '' && mess.cleaningFrequency !== '-') ||
                            (mess.cleaningService && mess.cleaningService.trim() !== '' && mess.cleaningService !== '-' && mess.cleaningService !== 'None')
                        );
                        const hasWifiService = Boolean(mess.wifiAvailable || mess.wifi === true || hasWifi);
                        const hasPower = Boolean(mess.powerBackup === true || (typeof mess.powerBackup === 'string' && mess.powerBackup.trim() !== '' && mess.powerBackup !== '-') || hasInverter);
                        const hasCctv = Boolean(mess.cctvInstalled || mess.security || mess.cctv === true);
                        const hasWarden = Boolean(mess.wardenAvailable || mess.wardenWatchman === true || mess.managedBy === 'Warden');
                        
                        const hasExtraSpaces = Array.isArray(mess.extraSpace) && mess.extraSpace.length > 0;
                        const hasOtherFacilities = Array.isArray(mess.facilities) && mess.facilities.filter(f => !['Wifi', 'AC', 'Food Facility', 'InverterPower', 'CCTV'].includes(f)).length > 0;

                        const anyService = hasFoodData || hasWater || hasLaundry || hasCleaning || hasWifiService || hasPower || hasCctv || hasWarden;

                        if (!anyService && !hasExtraSpaces && !hasOtherFacilities) {
                            return null;
                        }

                        return (
                            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-brand-light-gray">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-600">
                                        <Sparkles size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-brand-text-dark">Living &amp; Utility Services</h2>
                                        <p className="text-xs text-brand-text-gray mt-0.5">Key daily essentials and facilities provided on premises</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                                    {/* Food Facility */}
                                    {hasFoodData && (
                                        <div className="p-3.5 rounded-2xl border bg-orange-50/60 border-orange-100 flex items-start gap-3">
                                            <div className="p-2 rounded-xl bg-orange-100 text-orange-600 shrink-0 mt-0.5">
                                                <Utensils size={18} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wider block">Food Service</span>
                                                <p className="font-bold text-gray-900 text-sm mt-0.5 truncate">
                                                    {getFoodFacilityDisplay(mess) === 'Not Available'
                                                        ? 'No Food Facility'
                                                        : (mess.foodFacility && !mess.foodFacility.toLowerCase().includes('managed by')
                                                            ? mess.foodFacility
                                                            : 'Food Available')}
                                                </p>
                                                <p className="text-xs text-orange-800/80 font-medium mt-0.5">
                                                    {getFoodFacilityDisplay(mess) === 'Not Available'
                                                        ? 'Self cooking or outside arrangements'
                                                        : (mess.foodType ? `${mess.foodType} • ` : '') + getFoodFacilityDisplay(mess)}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Water Supply */}
                                    {hasWater && (
                                        <div className="p-3.5 rounded-2xl border bg-blue-50/60 border-blue-100 flex items-start gap-3">
                                            <div className="p-2 rounded-xl bg-blue-100 text-blue-600 shrink-0 mt-0.5">
                                                <Droplets size={18} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Drinking Water</span>
                                                <p className="font-bold text-gray-900 text-sm mt-0.5 truncate">
                                                    {mess.waterFacility}
                                                </p>
                                                <p className="text-xs text-blue-800/80 font-medium mt-0.5">{mess.waterFacility === 'None' ? 'Not Provided' : 'Clean & Accessible'}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Laundry Facility */}
                                    {hasLaundry && (
                                        <div className="p-3.5 rounded-2xl border bg-cyan-50/60 border-cyan-100 flex items-start gap-3">
                                            <div className="p-2 rounded-xl bg-cyan-100 text-cyan-600 shrink-0 mt-0.5">
                                                <Layers size={18} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider block">Laundry</span>
                                                <p className="font-bold text-gray-900 text-sm mt-0.5 truncate">
                                                    {mess.laundryFacility}
                                                </p>
                                                <p className="text-xs text-cyan-800/80 font-medium mt-0.5">{mess.laundryFacility === 'None' ? 'Not Provided' : 'Dedicated Washing Space'}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Cleaning / Housekeeping */}
                                    {hasCleaning && (
                                        <div className="p-3.5 rounded-2xl border bg-emerald-50/60 border-emerald-100 flex items-start gap-3">
                                            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600 shrink-0 mt-0.5">
                                                <CheckCircle2 size={18} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Housekeeping</span>
                                                <p className="font-bold text-gray-900 text-sm mt-0.5 truncate">
                                                    {mess.cleaningFrequency ? `${mess.cleaningFrequency} Cleaning` : mess.cleaningService}
                                                </p>
                                                <p className="text-xs text-emerald-800/80 font-medium mt-0.5">Premises Cleanliness</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* WiFi */}
                                    {hasWifiService && (
                                        <div className="p-3.5 rounded-2xl border bg-indigo-50/60 border-indigo-100 flex items-start gap-3">
                                            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600 shrink-0 mt-0.5">
                                                <Wifi size={18} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">Internet / WiFi</span>
                                                <p className="font-bold text-gray-900 text-sm mt-0.5 truncate">
                                                    {mess.wifiAvailable || (mess.wifi ? 'WiFi Available' : 'WiFi Available')}
                                                </p>
                                                <p className="text-xs text-indigo-800/80 font-medium mt-0.5">Seamless Connectivity</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Power Backup */}
                                    {hasPower && (
                                        <div className="p-3.5 rounded-2xl border bg-amber-50/60 border-amber-100 flex items-start gap-3">
                                            <div className="p-2 rounded-xl bg-amber-100 text-amber-600 shrink-0 mt-0.5">
                                                <Zap size={18} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Power Backup</span>
                                                <p className="font-bold text-gray-900 text-sm mt-0.5 truncate">
                                                    {typeof mess.powerBackup === 'string' && mess.powerBackup !== 'true' ? mess.powerBackup : 'Inverter Backup'}
                                                </p>
                                                <p className="text-xs text-amber-800/80 font-medium mt-0.5">Lighting &amp; Fans</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Security / CCTV */}
                                    {hasCctv && (
                                        <div className="p-3.5 rounded-2xl border bg-purple-50/60 border-purple-100 flex items-start gap-3">
                                            <div className="p-2 rounded-xl bg-purple-100 text-purple-600 shrink-0 mt-0.5">
                                                <Camera size={18} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">Security</span>
                                                <p className="font-bold text-gray-900 text-sm mt-0.5 truncate">
                                                    {mess.cctvInstalled || mess.security || (mess.cctv ? 'CCTV Installed' : 'Resident Safety')}
                                                </p>
                                                <p className="text-xs text-purple-800/80 font-medium mt-0.5">Resident Safety</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Warden / Supervision */}
                                    {hasWarden && (
                                        <div className="p-3.5 rounded-2xl border bg-rose-50/60 border-rose-100 flex items-start gap-3">
                                            <div className="p-2 rounded-xl bg-rose-100 text-rose-600 shrink-0 mt-0.5">
                                                <Shield size={18} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">Warden / Caretaker</span>
                                                <p className="font-bold text-gray-900 text-sm mt-0.5 truncate">
                                                    {mess.wardenAvailable || (mess.managedBy === 'Warden' ? 'Warden Available' : (mess.wardenWatchman ? 'Warden / Watchman' : 'Caretaker on Call'))}
                                                </p>
                                                <p className="text-xs text-rose-800/80 font-medium mt-0.5">
                                                    {mess.wardenAvailable || mess.managedBy === 'Warden' ? 'Support & Discipline' : 'Assistance Available'}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Extra Common Spaces & Facilities Chips */}
                                {(hasExtraSpaces || hasOtherFacilities) && (
                                    <div className="mt-6 pt-5 border-t border-gray-100">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Common Areas &amp; Extra Spaces</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {hasExtraSpaces && mess.extraSpace.map(space => (
                                                <span key={space} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
                                                    <Sparkles size={12} className="text-brand-primary" />
                                                    {space}
                                                </span>
                                            ))}
                                            {hasOtherFacilities && mess.facilities.filter(f => !['Wifi', 'AC', 'Food Facility', 'InverterPower', 'CCTV'].includes(f)).map(f => (
                                                <span key={f} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
                                                    <Building2 size={12} className="text-brand-primary" />
                                                    {f}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {/* Fee Structure, Inclusions & Deposits Card */}
                    {(() => {
                        const utilityItems = [];
                        const depositItems = [];

                        // 1. Electricity
                        const eb = mess.electricityBill;
                        if (eb && eb.trim() !== '' && eb !== '-') {
                            const isIncluded = eb.toLowerCase().includes('included');
                            const amt = mess.electricityBillAmount ? `₹${mess.electricityBillAmount}/mo` : '';
                            utilityItems.push(
                                <div key="eb" className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${isIncluded ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-amber-50/70 border-amber-200 text-amber-900'}`}>
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <Zap size={16} className={isIncluded ? 'text-emerald-600' : 'text-amber-600'} />
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Electricity</p>
                                            <p className="font-bold text-sm text-gray-800">{eb} {amt && `(${amt})`}</p>
                                        </div>
                                    </div>
                                    <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg ${isIncluded ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                        {isIncluded ? '✓ Included' : '⚡ Extra / Units'}
                                    </span>
                                </div>
                            );
                        }

                        // 2. Food Charges
                        const fb = mess.foodBill || (hasFood ? 'Included in Rent' : (mess.foodFacility ? mess.foodFacility : null));
                        if (fb && fb.trim() !== '' && fb !== '-') {
                            const isIncluded = fb.toLowerCase().includes('included');
                            utilityItems.push(
                                <div key="fb" className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${isIncluded ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-gray-50 border-gray-200 text-gray-800'}`}>
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <Utensils size={16} className={isIncluded ? 'text-emerald-600' : 'text-gray-500'} />
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Food Charges</p>
                                            <p className="font-bold text-sm text-gray-800">{fb}</p>
                                        </div>
                                    </div>
                                    <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg ${isIncluded ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'}`}>
                                        {isIncluded ? '✓ Included' : '🍽️ ' + fb}
                                    </span>
                                </div>
                            );
                        }

                        // 3. Cleaning Charges
                        const cc = mess.cleaningCharges;
                        if (cc && cc.trim() !== '' && cc !== '-') {
                            const isIncluded = cc.toLowerCase().includes('included') || cc.toLowerCase().includes('no');
                            const amt = mess.cleaningChargesAmount ? `₹${mess.cleaningChargesAmount}/mo` : '';
                            utilityItems.push(
                                <div key="cc" className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${isIncluded ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-amber-50/70 border-amber-200 text-amber-900'}`}>
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <CheckCircle2 size={16} className={isIncluded ? 'text-emerald-600' : 'text-amber-600'} />
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cleaning &amp; Housekeeping</p>
                                            <p className="font-bold text-sm text-gray-800">{cc} {amt && `(${amt})`}</p>
                                        </div>
                                    </div>
                                    <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg ${isIncluded ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                        {isIncluded ? '✓ No Extra' : `🧹 ${amt || 'Extra'}`}
                                    </span>
                                </div>
                            );
                        }

                        // 4. Maintenance Fee
                        let mf = mess.maintenanceFee;
                        let rawMaintAmt = mess.maintenanceFeeAmount || (mess.maintenanceCharge?.amount ? String(mess.maintenanceCharge.amount) : '');

                        if (mess.maintenanceCharge && typeof mess.maintenanceCharge === 'object' && (mess.maintenanceCharge.taken === true || mess.maintenanceCharge.taken === 'true' || Number(mess.maintenanceCharge.amount) > 0)) {
                            mf = 'Extra Charge';
                            if (!rawMaintAmt && mess.maintenanceCharge.amount) rawMaintAmt = String(mess.maintenanceCharge.amount);
                        } else if (!mf && mess.maintenanceCharge && typeof mess.maintenanceCharge === 'object' && mess.maintenanceCharge.taken === false) {
                            mf = 'Included';
                        }

                        if (mf && mf.trim() !== '' && mf !== '-') {
                            const isIncluded = mf === 'Included' || mf.toLowerCase().includes('included') || mf.toLowerCase() === 'no extra charge' || mf.toLowerCase() === 'no extra';
                            const amt = (!isIncluded && rawMaintAmt) ? `₹${rawMaintAmt}/mo` : '';
                            utilityItems.push(
                                <div key="mf" className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${isIncluded ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-amber-50/70 border-amber-200 text-amber-900'}`}>
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <ShieldCheck size={16} className={isIncluded ? 'text-emerald-600' : 'text-amber-600'} />
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Maintenance Charge</p>
                                            <p className="font-bold text-sm text-gray-800">{mf} {amt && `(${amt})`}</p>
                                        </div>
                                    </div>
                                    <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg ${isIncluded ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                        {isIncluded ? '✓ Included' : `🛠️ ${amt || 'Extra'}`}
                                    </span>
                                </div>
                            );
                        }

                        // 5. Kitchen Utensils
                        const ut = mess.utensilsCharges;
                        if (ut && ut.trim() !== '' && ut !== '-') {
                            utilityItems.push(
                                <div key="ut" className="p-3.5 rounded-2xl border bg-gray-50 border-gray-200 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <Coffee size={16} className="text-gray-500" />
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Kitchen Utensils</p>
                                            <p className="font-bold text-sm text-gray-800">{ut}</p>
                                        </div>
                                    </div>
                                    <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-gray-200 text-gray-700">
                                        🍳 {ut}
                                    </span>
                                </div>
                            );
                        }

                        // Deposits
                        let depLabel = null;
                        let isZeroDeposit = false;
                        if (mess.securityDeposit === 'Custom') {
                            depLabel = mess.securityDepositCustom ? `₹${mess.securityDepositCustom}` : null;
                        } else if (mess.securityDeposit === 'No Deposit' || mess.securityDeposit === '0' || mess.securityDeposit === '₹0') {
                            isZeroDeposit = true;
                            depLabel = 'No Deposit Required';
                        } else if (mess.securityDeposit && mess.securityDeposit !== '-') {
                            depLabel = mess.securityDeposit;
                        } else if (mess.advanceDeposit && mess.advanceDeposit !== '-') {
                            if (mess.advanceDeposit === '₹0' || mess.advanceDeposit === '0' || mess.advanceDeposit.toLowerCase().includes('no deposit')) {
                                isZeroDeposit = true;
                                depLabel = 'No Deposit Required';
                            } else {
                                depLabel = mess.advanceDeposit;
                            }
                        }

                        if (depLabel) {
                            depositItems.push(
                                <div key="deposit" className={`bg-gradient-to-br ${isZeroDeposit ? 'from-emerald-50 to-teal-50 border-emerald-200' : 'from-green-50 to-emerald-50 border-green-200'} p-5 rounded-2xl border flex flex-col justify-between`}>
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`${isZeroDeposit ? 'bg-emerald-100 text-emerald-700' : 'bg-green-100 text-green-700'} p-2 rounded-xl shrink-0 font-bold`}>
                                                ₹
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-gray-900 text-sm">Security Deposit</h5>
                                                <p className={`text-xs ${isZeroDeposit ? 'text-emerald-800 font-bold' : 'text-green-800 font-semibold'}`}>{depLabel}</p>
                                            </div>
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isZeroDeposit ? 'bg-emerald-200/80 text-emerald-800' : 'bg-green-200/80 text-green-800'} px-2 py-0.5 rounded-md`}>
                                            {isZeroDeposit ? 'Zero Deposit' : 'Refundable'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600 leading-relaxed mt-1">
                                        {isZeroDeposit ? 'No security deposit is charged upfront for moving in.' : 'Refunded at the time of moving out subject to property inspection and notice completion.'}
                                    </p>
                                </div>
                            );
                        }

                        // Advance Payment
                        let advLabel = null;
                        let isZeroAdvance = false;
                        if (mess.advancePayment === 'Custom') {
                            advLabel = mess.advancePaymentCustom ? `₹${mess.advancePaymentCustom}` : null;
                        } else if (mess.advancePayment === 'No Advance' || mess.advancePayment === 'None') {
                            isZeroAdvance = true;
                            advLabel = 'No Advance Required';
                        } else if (typeof mess.advancePayment === 'object' && mess.advancePayment !== null) {
                            if (mess.advancePayment.type === 'Custom Amount' || mess.advancePayment.type === 'Custom') {
                                advLabel = mess.advancePayment.customAmount ? `₹${mess.advancePayment.customAmount}` : null;
                            } else if (mess.advancePayment.type === 'None') {
                                isZeroAdvance = true;
                                advLabel = 'No Advance Required';
                            } else if (mess.advancePayment.type) {
                                advLabel = mess.advancePayment.type;
                            }
                        } else if (typeof mess.advancePayment === 'string' && mess.advancePayment && mess.advancePayment !== '-') {
                            advLabel = mess.advancePayment;
                        }

                        if (advLabel) {
                            depositItems.push(
                                <div key="adv" className="bg-gradient-to-br from-indigo-50 to-blue-50 p-5 rounded-2xl border border-indigo-200 flex flex-col justify-between">
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-indigo-100 text-indigo-700 p-2 rounded-xl shrink-0 font-bold">
                                                <FileText size={16} />
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-gray-900 text-sm">Advance Rent Payment</h5>
                                                <p className={`text-xs ${isZeroAdvance ? 'text-indigo-900 font-bold' : 'text-indigo-800 font-semibold'}`}>{advLabel}</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-200/80 text-indigo-800 px-2 py-0.5 rounded-md">
                                            {isZeroAdvance ? 'Zero Advance' : 'Adjustable'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600 leading-relaxed mt-1">
                                        {isZeroAdvance ? 'No advance rent is required before moving into this mess.' : 'Payable at the time of booking/move-in, fully adjusted towards your first month(s) rent.'}
                                    </p>
                                </div>
                            );
                        }

                        if (utilityItems.length === 0 && depositItems.length === 0) {
                            return null;
                        }

                        const hasBothCols = utilityItems.length > 0 && depositItems.length > 0;

                        return (
                            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-brand-light-gray">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="bg-blue-100 p-2.5 rounded-xl text-brand-primary">
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-brand-text-dark">Fee Structure &amp; Inclusions</h2>
                                        <p className="text-xs text-brand-text-gray mt-0.5">Transparent breakdown of rent, utility billing, and security deposits</p>
                                    </div>
                                </div>

                                <div className={`grid grid-cols-1 ${hasBothCols ? 'md:grid-cols-2' : ''} gap-6`}>
                                    {utilityItems.length > 0 && (
                                        <div className="space-y-3">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Monthly Inclusions &amp; Utility Bills</h4>
                                            {utilityItems}
                                        </div>
                                    )}

                                    {depositItems.length > 0 && (
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Deposits &amp; Move-in Payments</h4>
                                            {depositItems}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {/* Photo Gallery Section */}
                {mess.galleryUrls && mess.galleryUrls.length > 0 && (
                    <div className="mt-12">
                        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-brand-light-gray hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-brand-accent-blue/10 p-2.5 rounded-xl text-brand-accent-blue">
                                    <ImageIcon size={24} />
                                </div>
                                <h2 className="text-2xl font-bold text-brand-text-dark">Photo Gallery</h2>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {mess.galleryUrls.map((url, idx) => (
                                    <div key={idx} className="relative shadow-sm aspect-square group rounded-2xl overflow-hidden border border-brand-light-gray cursor-pointer" onClick={() => { trackGalleryView(messId); window.open(url, '_blank'); }}>
                                        <img
                                            src={url}
                                            alt={`${mess.name} — Street View Photo ${idx + 1}`}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none rounded-2xl"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Global Actions for User Sourced - Seat availability feature hidden/deactivated */}
                {/* 
                    mess.isUserSourced && (
                        <div className="mt-12 flex flex-col items-center gap-6">
                            <div className="text-center bg-white p-8 rounded-3xl shadow-lg border-2 border-brand-amber/20 w-full max-w-2xl">
                                <div className="bg-brand-amber/10 w-16 h-16 rounded-full flex items-center justify-center text-brand-amber mx-auto mb-4">
                                    <Info size={32} />
                                </div>
                                <h3 className="text-2xl font-bold text-brand-text-dark mb-2">Know Seat Availability</h3>
                                <p className="text-brand-text-gray mb-6 leading-relaxed">
                                    We're currently collecting more information about this mess.
                                    If you're interested, you can inquire directly about seat availability.
                                </p>
                                <button
                                    onClick={() => {
                                        setShowInquiryModal(true);
                                        trackAvailabilityCheck(messId);
                                    }}
                                    className="w-full md:w-auto flex items-center justify-center gap-3 bg-brand-primary text-white px-10 py-4 rounded-2xl font-bold hover:bg-brand-primary/90 transition-all shadow-xl active:scale-95"
                                >
                                    <BedDouble size={24} />
                                    Know Seat Availability
                                </button>
                            </div>
                        </div>
                    )
                */}
            </div >



            {/* Inquiry Modal - Seat availability feature hidden/deactivated */}
            {/*
                showInquiryModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-brand-text-dark/70 backdrop-blur-sm transition-opacity"
                            onClick={() => setShowInquiryModal(false)}
                        ></div>
                        <div className="w-full max-w-md relative z-10 bg-white rounded-3xl shadow-2xl overflow-hidden transform transition-all animate-fadeIn scale-100">

                            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <div>
                                    <h2 className="text-xl font-bold text-brand-text-dark">Check Availability</h2>
                                    <p className="text-xs text-brand-text-gray mt-0.5">Connect directly with the owner</p>
                                </div>
                                <button
                                    onClick={() => setShowInquiryModal(false)}
                                    className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6">
                                <form onSubmit={handleInquirySubmit} className="space-y-5">

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-brand-text-dark uppercase tracking-wide ml-1">Your Name</label>
                                        <div className="relative group">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-primary transition-colors">
                                                <User size={18} />
                                            </div>
                                            <input
                                                type="text"
                                                required
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 text-brand-text-dark text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all placeholder:text-gray-400"
                                                value={inquiryData.name}
                                                onChange={(e) => setInquiryData({ ...inquiryData, name: e.target.value })}
                                                placeholder="Enter your full name"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-brand-text-dark uppercase tracking-wide ml-1">Phone Number</label>
                                        <div className="relative group">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-primary transition-colors">
                                                <Phone size={18} />
                                            </div>
                                            <input
                                                type="tel"
                                                required
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 text-brand-text-dark text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all placeholder:text-gray-400"
                                                value={inquiryData.phone}
                                                maxLength="10"
                                                onChange={(e) => setInquiryData({ ...inquiryData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                                placeholder="10 digit mobile number"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-brand-text-dark uppercase tracking-wide ml-1">Looking for</label>
                                        <div className="relative group">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-primary transition-colors">
                                                <BedDouble size={18} />
                                            </div>
                                            <select
                                                className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 text-brand-text-dark text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all appearance-none cursor-pointer"
                                                value={inquiryData.seating}
                                                onChange={(e) => setInquiryData({ ...inquiryData, seating: e.target.value })}
                                            >
                                                <option value="Any">Any Room Type</option>
                                                <option value="1 Seater">1 Seater (Single)</option>
                                                <option value="2 Seater">2 Seater (Double)</option>
                                                <option value="3 Seater">3 Seater (Triple)</option>
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                                <ChevronDown size={16} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-2 flex flex-col gap-3">
                                        <div className="flex items-start gap-2 px-1">
                                            <input
                                                type="checkbox"
                                                id="inquiry-consent"
                                                checked={inquiryData.consent}
                                                onChange={(e) => setInquiryData({ ...inquiryData, consent: e.target.checked })}
                                                className="w-4 h-4 accent-brand-primary mt-1 cursor-pointer"
                                            />
                                            <label htmlFor="inquiry-consent" className="text-xs text-gray-500 cursor-pointer text-left leading-tight">
                                                I agree to the <a href="/terms-and-conditions" target="_blank" rel="noopener noreferrer" className="text-brand-primary font-bold hover:underline">Terms & Conditions</a> and <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-brand-primary font-bold hover:underline">Privacy Policy</a>.
                                            </label>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={submittingInquiry || !inquiryData.consent}
                                            className="w-full py-3.5 px-6 bg-brand-primary text-white font-bold rounded-xl shadow-lg shadow-brand-primary/30 hover:bg-brand-primary-hover transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                                        >
                                            {submittingInquiry ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <span>Submit Inquiry</span>
                                                    <Send size={16} />
                                                </>
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowInquiryModal(false)}
                                            className="w-full py-3 px-6 text-gray-500 font-bold rounded-xl hover:bg-gray-50 hover:text-gray-700 transition-colors text-xs"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )
            */}


            {/* Claim Listing - Small Footer Link */}
            <div className="max-w-[1440px] mx-auto px-4 py-6 mt-8 border-t border-gray-200">
                <div className="flex justify-center">
                    <button
                        onClick={handleClaimListing}
                        disabled={claiming}
                        className="text-xs text-gray-400 hover:text-brand-primary underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {claiming ? 'Sending...' : 'Claim Listing'}
                    </button>
                </div>
            </div>

            {/* Floating Action Button (Mobile & Desktop) */}
            {mess.contact && !mess.hideContact && (
                <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-30">
                    <button
                        onClick={handleBookClick}
                        className="bg-brand-primary hover:bg-brand-primary-hover px-6 py-3 rounded-2xl font-bold text-base shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 text-white"
                    >
                        <span>Contact Owner</span>
                        {mess.startingPrice && (
                            <>
                                <div className="w-px h-5 bg-white/20"></div>
                                <span className="font-normal text-white/80">₹{mess.startingPrice}</span>
                            </>
                        )}
                    </button>
                </div>
            )}

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
                                <div className="flex justify-between items-center text-sm pb-2 border-b border-gray-200">
                                    <span className="text-gray-500 font-medium">Property</span>
                                    <span className="font-bold text-gray-900">{mess.name}</span>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                        Which occupancy are you calling for?
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {availableOccupancies.map(occObj => (
                                            <button
                                                key={occObj.occupancy}
                                                type="button"
                                                onClick={() => setSelectedOccupancy(occObj.occupancy)}
                                                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                                                    selectedOccupancy === occObj.occupancy
                                                        ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                                                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                                                }`}
                                            >
                                                {occObj.occupancy}
                                            </button>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => setSelectedOccupancy('General Inquiry')}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                                selectedOccupancy === 'General Inquiry'
                                                    ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                                                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                                            }`}
                                        >
                                            General Inquiry
                                        </button>
                                    </div>
                                    {!selectedOccupancy && (
                                        <p className="text-[11px] text-amber-700 font-medium mt-2">
                                            * Please select an option above to proceed with the call.
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmBooking}
                                    disabled={bookingProcessing || !selectedOccupancy}
                                    className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-green-200 disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                                >
                                    {bookingProcessing ? 'Connecting...' : 'Call Now'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Phone Collection Modal */}
            {showPhoneModal && currentUser && (
                <PhoneCollectionModal
                    user={currentUser}
                    onClose={(phone) => {
                        setUserPhone(phone);
                        setShowPhoneModal(false);
                        setShowConfirmModal(true);
                    }}
                    onSkip={() => {
                        setShowPhoneModal(false);
                    }}
                />
            )}

        </div >
    );
};

const RoomTypeGroup = ({ occupancy, rooms, isRoomWishlisted, onToggleRoomWishlist, isUserSourced, messName }) => {
    const scrollRef = useRef(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Calculate price range
    const prices = rooms.map(r => Number(r.price || r.rent)).sort((a, b) => a - b);
    const minPrice = prices[0];
    const maxPrice = prices[prices.length - 1];
    const priceDisplay = minPrice === maxPrice ? `₹${minPrice}` : `₹${minPrice} - ₹${maxPrice}`;
    const cycleSuffix = (rooms[0] && rooms[0].rentCycle === 'yearly') ? '/yr' : '/mo';

    // Calculate total available beds
    const totalAvailable = rooms.reduce((sum, r) => sum + (r.availableCount || 0), 0);

    const occupancyMap = {
        'Single': '1',
        'Double': '2',
        'Triple': '3',
        'Four': '4',
        'Five': '5',
        'Six': '6'
    };
    const displayOccupancy = occupancyMap[occupancy] || occupancy;

    const scroll = (direction) => {
        if (scrollRef.current) {
            const width = scrollRef.current.clientWidth;
            scrollRef.current.scrollBy({
                left: direction === 'right' ? width : -width,
                behavior: 'smooth'
            });
        }
    };

    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            if (clientWidth > 0) {
                const index = Math.round(scrollLeft / clientWidth);
                setCurrentIndex(index);
            }
        }
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-3xl p-4 sm:p-5 border border-brand-light-gray shadow-sm hover:shadow-md transition-shadow">
            {/* Header Section */}
            <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-100 gap-2">
                <div>
                    <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-lg font-bold text-brand-text-dark">{displayOccupancy} Seater Rooms</h3>
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-brand-light-gray text-brand-text-gray">
                            {rooms.length} {rooms.length === 1 ? 'Variant' : 'Variants'}
                        </span>
                    </div>
                    <p className="text-brand-text-gray text-xs font-medium">
                        Starting from <span className="font-bold text-brand-primary">{priceDisplay}{cycleSuffix}</span>
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {!isUserSourced && (
                        totalAvailable > 0 ? (
                            <span className="text-brand-accent-green text-[10px] font-bold uppercase tracking-wider bg-brand-accent-green/10 px-2.5 py-1 rounded-full border border-brand-accent-green/20 shrink-0">
                                Available
                            </span>
                        ) : (
                            <span className="text-brand-red text-[10px] font-bold uppercase tracking-wider bg-brand-red/10 px-2.5 py-1 rounded-full border border-brand-red/20 shrink-0">
                                Full
                            </span>
                        )
                    )}
                </div>
            </div>

            {/* Room Cards Carousel / Swiper */}
            <div className="relative flex-1 flex flex-col justify-between">
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="w-full flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-3"
                >
                    {rooms.map(room => (
                        <div key={room.id} className="w-full min-w-full flex-shrink-0 snap-center">
                            <RoomCard
                                room={room}
                                isWishlisted={isRoomWishlisted(room.id)}
                                onToggleWishlist={onToggleRoomWishlist}
                                isUserSourced={isUserSourced}
                                messName={messName || ''}
                            />
                        </div>
                    ))}
                </div>

                {/* Left Arrow (when scrolled past first variant) */}
                {rooms.length > 1 && currentIndex > 0 && (
                    <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); scroll('left'); }}
                        className="absolute -left-2.5 top-[35%] -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white shadow-[0_4px_14px_rgba(0,0,0,0.18)] text-brand-primary flex items-center justify-center border border-gray-200 transition-all hover:scale-110 active:scale-95 hover:bg-gray-50 cursor-pointer"
                        title="Previous variant"
                        aria-label="Previous variant"
                    >
                        <ChevronLeft size={18} strokeWidth={2.5} />
                    </button>
                )}

                {/* Right Arrow (to swipe to next variant) */}
                {rooms.length > 1 && currentIndex < rooms.length - 1 && (
                    <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); scroll('right'); }}
                        className="absolute -right-2.5 top-[35%] -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white shadow-[0_4px_14px_rgba(0,0,0,0.18)] text-brand-primary flex items-center justify-center border border-gray-200 transition-all hover:scale-110 active:scale-95 hover:bg-gray-50 cursor-pointer"
                        title="Next variant"
                        aria-label="Next variant"
                    >
                        <ChevronRight size={18} strokeWidth={2.5} />
                    </button>
                )}

                {/* Pagination Dots / Indicators */}
                {rooms.length > 1 && (
                    <div className="flex items-center justify-center gap-1.5 mt-3">
                        {rooms.map((_, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                    if (scrollRef.current) {
                                        scrollRef.current.scrollTo({
                                            left: idx * scrollRef.current.clientWidth,
                                            behavior: 'smooth'
                                        });
                                    }
                                }}
                                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                                    currentIndex === idx 
                                        ? 'w-4 bg-brand-primary' 
                                        : 'w-1.5 bg-gray-200 hover:bg-gray-300'
                                }`}
                                aria-label={`Go to variant ${idx + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const MessDetailsSkeleton = () => {
    return (
        <div className="min-h-screen bg-brand-secondary pb-20 font-sans">
            {/* Header Area — Full-width Shimmer Banner */}
            <div className="relative h-56 sm:h-72 md:h-80 bg-brand-light-gray overflow-hidden">
                <div className="absolute inset-0 skeleton-shimmer" />
                
                {/* FLOATING TOP BAR: Back + Share */}
                <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20">
                    <div className="w-16 h-8 rounded-full skeleton-shimmer opacity-80" />
                    <div className="w-9 h-9 rounded-full skeleton-shimmer opacity-80" />
                </div>

                {/* BOTTOM OVERLAY: Name + Address + Amenity Pills */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 z-20">
                    <div className="flex items-end justify-between gap-4">
                        <div className="flex-1 space-y-3">
                            <div className="h-8 w-2/3 sm:w-1/2 rounded-xl skeleton-shimmer" />
                            <div className="h-4 w-1/3 sm:w-1/4 rounded-lg skeleton-shimmer" />
                            <div className="flex gap-2">
                                <div className="w-16 h-6 rounded-full skeleton-shimmer" />
                                <div className="w-16 h-6 rounded-full skeleton-shimmer" />
                                <div className="w-16 h-6 rounded-full skeleton-shimmer" />
                            </div>
                        </div>
                        <div className="w-24 h-10 rounded-xl skeleton-shimmer shrink-0" />
                    </div>
                </div>
            </div>

            {/* Rooms Grid Skeleton */}
            <div className="max-w-[1440px] mx-auto px-4 py-12">
                <div className="flex items-center mb-8">
                    <div className="h-7 w-56 rounded-xl skeleton-shimmer" />
                    <div className="ml-4 h-px flex-grow bg-brand-light-gray" />
                </div>

                {/* Shimmering Room Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((index) => (
                        <div key={index} className="bg-white rounded-3xl p-4 border border-brand-light-gray space-y-4">
                            <div className="aspect-[16/10] w-full rounded-2xl skeleton-shimmer" />
                            <div className="space-y-2">
                                <div className="h-5 w-2/3 rounded-lg skeleton-shimmer" />
                                <div className="h-4 w-1/2 rounded-lg skeleton-shimmer" />
                            </div>
                            <div className="flex justify-between items-center pt-2">
                                <div className="h-6 w-20 rounded-md skeleton-shimmer" />
                                <div className="h-9 w-24 rounded-xl skeleton-shimmer" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* About & Facilities Skeleton */}
                <div className="mt-12">
                    <div className="bg-white rounded-3xl p-6 md:p-8 border border-brand-light-gray space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl skeleton-shimmer" />
                            <div className="h-6 w-48 rounded-lg skeleton-shimmer" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="h-4 w-full rounded-md skeleton-shimmer" />
                                <div className="h-4 w-11/12 rounded-md skeleton-shimmer" />
                                <div className="h-4 w-4/5 rounded-md skeleton-shimmer" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="h-12 rounded-xl skeleton-shimmer" />
                                <div className="h-12 rounded-xl skeleton-shimmer" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MessDetails;
