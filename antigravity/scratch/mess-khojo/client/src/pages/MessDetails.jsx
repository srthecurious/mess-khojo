import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Phone, ArrowLeft, ExternalLink, Utensils, Droplets, Wifi, Zap, Wind, Camera, ChevronDown, ChevronUp, Briefcase, Info, ShieldCheck, AlertCircle, BedDouble, EyeOff, MessageCircle, Send, Check, User, X, Image as ImageIcon, Heart, Building2 } from 'lucide-react';
import { auth } from '../firebase';
import { serverTimestamp, collection, getDocs, query, orderBy, startAt, endAt } from 'firebase/firestore';
import { db } from '../firebase';
import { getMess, watchRoomsByMess } from '../services/messService';
import { addClaim, addInquiry } from '../services/bookingService';
import { getUserDoc } from '../services/userService';
import RoomCard from '../components/RoomCard';
import ClaimModal from '../components/ClaimModal';
import { trackMessView, trackContactClick, trackAvailabilityCheck, trackEvent, trackGalleryView } from '../analytics';
import { usePageSEO, generateMessSchema } from '../hooks/usePageSEO';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { BRAND } from '../constants';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { motion, AnimatePresence } from 'framer-motion';
import { toMessSlug, isSlug, idSuffixFromSlug } from '../utils/slugify';

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
    const { currentUser } = useAuth();
    const { success: toastSuccess, error: toastError } = useToast();
    const { isRoomWishlisted, toggleRoomWishlist, isMessWishlisted, toggleMessWishlist } = useWishlist();
    const [loginPromptConfig, setLoginPromptConfig] = useState({ show: false, title: '', message: '', icon: '' });
    const [showClaimModal, setShowClaimModal] = useState(false);
    const [showBackToTop, setShowBackToTop] = useState(false);

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
    const [showInquiryModal, setShowInquiryModal] = useState(false);
    const [inquiryData, setInquiryData] = useState({ name: '', phone: '', seating: 'Any', consent: false });
    const [submittingInquiry, setSubmittingInquiry] = useState(false);
    const [showUserSourcedListing, setShowUserSourcedListing] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

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

    const handleClaimSubmit = async (phoneNumber) => {
        try {
            setClaiming(true);
            const userDoc = await getUserDoc(auth.currentUser.uid);
            let userData = {};
            if (userDoc.exists()) userData = userDoc.data();

            const claimData = {
                messId, messName: mess.name,
                userId: auth.currentUser.uid,
                userName: userData.name || auth.currentUser.displayName || "Registered User",
                userEmail: auth.currentUser.email,
                userPhone: phoneNumber,
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

    const handleInquirySubmit = async (e) => {
        e.preventDefault();
        setSubmittingInquiry(true);

        try {
            // 1. Save to inquiries collection
            const inquiryDocData = {
                ...inquiryData,
                messId,
                messName: mess.name,
                status: 'pending',
                createdAt: serverTimestamp()
            };

            await addInquiry(inquiryDocData);

            // 2. Prepare WhatsApp message
            const message = `* Inquiry for ${mess.name} * \n\nHello Mess Khojo, I am ${inquiryData.name}. I am looking for a ${inquiryData.seating === 'Any' ? 'room' : inquiryData.seating + ' room'} in * ${mess.name}*.\n\nMy contact: ${inquiryData.phone} \n\nPlease help me with seat availability and details.`;
            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/${BRAND.whatsappNumber}?text=${encodedMessage}`;

            setShowInquiryModal(false);
            window.open(whatsappUrl, '_blank');

        } catch (error) {
            console.error("Inquiry failed:", error);
            toastError('Could not process inquiry. Please try again.');
        } finally {
            setSubmittingInquiry(false);
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
                    setMess({ id: messDoc.id, ...messDoc.data() });
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

    useBodyScrollLock(showInquiryModal);

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
                        className="fixed bottom-24 right-4 z-50 w-11 h-11 bg-brand-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-brand-primary-hover transition-colors"
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
                            <Link
                                to="/"
                                className="inline-flex items-center text-sm font-semibold text-white bg-black/30 hover:bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-sm transition-all"
                            >
                                <ArrowLeft size={16} className="mr-1.5" /> Back
                            </Link>
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
                                        {hasFood && (
                                            <span className="flex items-center text-xs font-semibold text-white bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/20">
                                                <Utensils size={11} className="mr-1" /> Food
                                            </span>
                                        )}
                                        {hasWifi && (
                                            <span className="flex items-center text-xs font-semibold text-white bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/20">
                                                <Wifi size={11} className="mr-1" /> WiFi
                                            </span>
                                        )}
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
                <div className="max-w-7xl mx-auto px-4 mt-6">
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
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex items-center mb-8">
                    <h2 className="text-2xl font-bold text-brand-text-dark">Available Room Types</h2>
                    <div className="ml-4 h-px flex-grow bg-brand-light-gray"></div>
                </div>

                {
                    rooms.length > 0 ? (
                        <div className="space-y-8">
                            {sortedGroups.map(([occupancy, groupRooms]) => (
                                <RoomTypeGroup
                                    key={occupancy}
                                    occupancy={occupancy}
                                    rooms={groupRooms}
                                    isRoomWishlisted={isRoomWishlisted}
                                    onToggleRoomWishlist={handleRoomWishlistToggle}
                                    isUserSourced={mess.isUserSourced}
                                    messName={mess.name}
                                />
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

                {/* About & Facilities Section */}
                <div className="mt-12">
                    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-brand-light-gray">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-purple-100 p-2.5 rounded-xl text-brand-primary">
                                <Info size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-brand-text-dark">About & Facilities</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Left Column: Description, Type, Managed By, Financials, Inclusions */}
                            <div className="space-y-5">
                                {mess.description && (
                                    <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap">
                                        {mess.description}
                                    </div>
                                )}

                                {/* Property Type */}
                                {mess.messType && (
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Property Type</h4>
                                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${
                                            Array.isArray(mess.messType)
                                                ? mess.messType.includes('Boys') && mess.messType.includes('Girls') ? 'bg-purple-100 text-purple-700'
                                                    : mess.messType.includes('Girls') ? 'bg-pink-100 text-pink-700'
                                                    : 'bg-blue-100 text-blue-700'
                                                : mess.messType === 'Boys' ? 'bg-blue-100 text-blue-700'
                                                    : mess.messType === 'Girls' ? 'bg-pink-100 text-pink-700'
                                                    : 'bg-purple-100 text-purple-700'
                                        }`}>
                                            <Briefcase size={16} />
                                            {Array.isArray(mess.messType) ? mess.messType.join(' & ') : mess.messType} Mess
                                        </span>
                                    </div>
                                )}

                                {/* Managed By */}
                                {mess.managedBy && (
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Food Facility Managed By</h4>
                                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${
                                            mess.managedBy === 'Students' ? 'bg-emerald-100 text-emerald-700'
                                                : mess.managedBy === 'Warden' ? 'bg-purple-100 text-purple-700'
                                                : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            {mess.managedBy === 'Students' ? '👥' : mess.managedBy === 'Warden' ? '🛡️' : '🏢'} {mess.managedBy} Managed
                                        </span>
                                    </div>
                                )}

                                {/* Financials — new schema (advancePayment + maintenanceCharge) or old (advanceDeposit string) */}
                                {(() => {
                                    let advanceLabel = null;
                                    if (mess.advancePayment?.type && (mess.advancePayment.type !== 'None' || (mess.maintenanceCharge?.taken && mess.maintenanceCharge?.amount))) {
                                        const adv = mess.advancePayment;
                                        const maint = mess.maintenanceCharge;
                                        const advStr = adv.type && adv.type !== 'None'
                                            ? (adv.type === 'Custom Amount' ? `₹${adv.customAmount}` : adv.type)
                                            : 'No Deposit';
                                        const maintStr = maint?.taken && maint?.amount
                                            ? ` + ₹${maint.amount} maintenance (${maint.frequency || 'Per Year'})`
                                            : '';
                                        advanceLabel = advStr === 'No Deposit' && maintStr
                                            ? `₹${maint.amount} maintenance (${maint.frequency || 'Per Year'})`
                                            : advStr + maintStr;
                                    } else if (mess.advanceDeposit) {
                                        advanceLabel = mess.advanceDeposit;
                                    }
                                    return advanceLabel ? (
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Advance &amp; Deposit</h4>
                                            <div className="flex items-start gap-3 bg-green-50 p-4 rounded-2xl border border-green-100">
                                                <div className="bg-green-100 text-green-700 p-2 rounded-lg shrink-0">
                                                    <span className="font-bold text-base">₹</span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800 text-sm">Security Deposit Required</p>
                                                    <p className="text-sm text-green-700 font-semibold mt-0.5">{advanceLabel}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : null;
                                })()}

                                {/* Included in Rent */}
                                {mess.includedInRent !== undefined && (
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Included in Rent</h4>
                                        <div className="flex flex-col gap-2">
                                            {[
                                                { key: 'Food Charges', label: 'Food Charges', icon: '🍽️' },
                                                { key: 'Electricity Bills', label: 'Electricity Bill', icon: '⚡' },
                                                { key: 'Cleaning Charges', label: 'Cleaning', icon: '🧹' }
                                            ].map(({ key, label, icon }) => {
                                                const included = Array.isArray(mess.includedInRent) && mess.includedInRent.includes(key);
                                                return (
                                                    <div key={key} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold border ${
                                                        included
                                                            ? 'bg-green-50 text-green-700 border-green-200'
                                                            : 'bg-red-50 text-red-600 border-red-100'
                                                    }`}>
                                                        <span>{icon}</span>
                                                        <span className="flex-1">{label}</span>
                                                        <span className="text-xs font-bold">{included ? '✓ Included' : '✗ Extra'}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right Column: Facilities */}
                            <div className="space-y-6">
                                {/* New: facilities array from registration */}
                                {mess.facilities && mess.facilities.length > 0 && (() => {
                                    const facilityMap = {
                                        'Wifi': { Icon: Wifi, bg: 'bg-blue-50 border-blue-100', ic: 'text-blue-600', label: 'WiFi' },
                                        'AC': { Icon: Wind, bg: 'bg-cyan-50 border-cyan-100', ic: 'text-cyan-600', label: 'Air Conditioning' },
                                        'Food Facility': { Icon: Utensils, bg: 'bg-orange-50 border-orange-100', ic: 'text-orange-500', label: 'Food Available' },
                                        'InverterPower': { Icon: Zap, bg: 'bg-yellow-50 border-yellow-100', ic: 'text-yellow-600', label: 'Power Backup' },
                                        'CCTV': { Icon: Camera, bg: 'bg-purple-50 border-purple-100', ic: 'text-purple-600', label: 'CCTV Security' },
                                    };
                                    return (
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Available Facilities</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {mess.facilities.map(f => {
                                                    const cfg = facilityMap[f] || { Icon: null, bg: 'bg-gray-50 border-gray-100', ic: 'text-gray-500', label: f };
                                                    return (
                                                        <div key={f} className={`${cfg.bg} p-3 rounded-xl border flex items-center gap-2.5`}>
                                                            {cfg.Icon && <cfg.Icon size={16} className={`${cfg.ic} shrink-0`} />}
                                                            <span className="text-sm font-semibold text-gray-700">{cfg.label}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Legacy: old text-based fields for backward compatibility */}
                                {(mess.foodFacility || mess.security || mess.extraAppliances) && (
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Amenities &amp; Features</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {mess.foodFacility && (
                                                <div className="bg-orange-50 p-3 rounded-xl border border-orange-100/50 flex items-center gap-3">
                                                    <Utensils size={18} className="text-orange-500 shrink-0" />
                                                    <p className="text-sm text-gray-700 font-medium">{mess.foodFacility}</p>
                                                </div>
                                            )}
                                            {mess.security && (
                                                <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100/50 flex items-center gap-3">
                                                    <ShieldCheck size={18} className="text-indigo-500 shrink-0" />
                                                    <p className="text-sm text-gray-700 font-medium">{mess.security}</p>
                                                </div>
                                            )}
                                            {mess.extraAppliances && (
                                                <div className="bg-teal-50 p-3 rounded-xl border border-teal-100/50 flex items-center gap-3 sm:col-span-2">
                                                    <Zap size={18} className="text-teal-500 shrink-0" />
                                                    <p className="text-sm text-gray-700 font-medium">{mess.extraAppliances}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
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

                {/* Global Actions for User Sourced */}
                {
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
                }
            </div >



            {/* Inquiry Modal */}
            {
                showInquiryModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-brand-text-dark/70 backdrop-blur-sm transition-opacity"
                            onClick={() => setShowInquiryModal(false)}
                        ></div>
                        <div className="w-full max-w-md relative z-10 bg-white rounded-3xl shadow-2xl overflow-hidden transform transition-all animate-fadeIn scale-100">

                            {/* Modal Header */}
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

                                    {/* Name Input */}
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

                                    {/* Phone Input */}
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

                                    {/* Seater Selection */}
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
            }


            {/* Claim Listing - Small Footer Link */}
            {
                mess?.isUserSourced && (
                    <div className="max-w-7xl mx-auto px-4 py-6 mt-8 border-t border-gray-200">
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
                )
            }

            <button
                onClick={() => {
                    if (!currentUser) {
                        setLoginPromptConfig({
                            show: true,
                            title: 'Login to Chat',
                            message: 'Please login to use WhatsApp for queries or help.',
                            icon: '💬'
                        });
                        return;
                    }
                    const message = `Hi MessKhojo, I want to know more about ${mess.name} (${mess.address || 'No Address'})`;
                    window.open(`https://wa.me/${BRAND.whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
                }}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(37,211,102,0.6)] hover:shadow-[0_8px_25px_rgba(37,211,102,0.5)] hover:-translate-y-1 transition-all duration-300 animate-bounce-slow"
                title="Chat with Support"
            >
                <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor" className="text-white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
            </button>

        </div >
    );
};

const RoomTypeGroup = ({ occupancy, rooms, isRoomWishlisted, onToggleRoomWishlist, isUserSourced, messName }) => {
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

    return (
        <div className="mb-10 last:mb-0">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 px-2">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-bold text-brand-text-dark">{displayOccupancy} Seater Rooms</h3>
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-brand-light-gray text-brand-text-gray">{rooms.length} Variants</span>
                    </div>
                    <p className="text-brand-text-gray text-sm">Starting from <span className="font-semibold text-brand-primary">{priceDisplay}{cycleSuffix}</span></p>
                </div>

                <div className="flex items-center gap-4 mt-2 md:mt-0">
                    {!isUserSourced && (
                        totalAvailable > 0 ? (
                            <span className="text-brand-accent-green text-xs font-bold uppercase tracking-wide bg-brand-accent-green/10 px-3 py-1.5 rounded-full border border-brand-accent-green/20">
                                Available
                            </span>
                        ) : (
                            <span className="text-brand-red text-xs font-bold uppercase tracking-wide bg-brand-red/10 px-3 py-1.5 rounded-full border border-brand-red/20">
                                Full
                            </span>
                        )
                    )}
                </div>
            </div>

            {/* Always Visible Rooms Grid */}
            <div className="flex overflow-x-auto pb-4 gap-4 snap-x hide-scrollbar px-2">
                {rooms.map(room => (
                    <div key={room.id} className="min-w-[280px] md:min-w-[320px] snap-center">
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
            <div className="max-w-7xl mx-auto px-4 py-12">
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
