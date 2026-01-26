import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Phone, ArrowLeft, ExternalLink, Utensils, Droplets, Wifi, Zap, ChevronDown, ChevronUp, Briefcase, Info, ShieldCheck, AlertCircle, BedDouble, EyeOff, MessageCircle, Send, Check } from 'lucide-react';
import { db, auth } from '../firebase';
import { doc, getDoc, collection, query, where, onSnapshot, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import RoomCard from '../components/RoomCard';
import { trackMessView, trackContactClick, trackAvailabilityCheck, trackEvent } from '../analytics';
import { usePageSEO, generateMessSchema } from '../hooks/usePageSEO';

const MessDetails = () => {
    const { id: messId } = useParams();
    const navigate = useNavigate();
    const [mess, setMess] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(false);
    const [showInquiryModal, setShowInquiryModal] = useState(false);
    const [inquiryData, setInquiryData] = useState({ name: '', phone: '', seating: 'Any' });
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

    const handleClaimListing = async () => {
        if (!auth.currentUser) {
            alert("Please login to claim this listing.");
            return;
        }

        // Always ask for phone number
        const phoneNumber = prompt("Please enter your mobile number for verification:");

        if (!phoneNumber) {
            // User cancelled or didn't provide phone
            return;
        }

        // Validate phone number (at least 10 digits)
        const cleanPhone = phoneNumber.replace(/\D/g, '');
        if (cleanPhone.length < 10) {
            alert("Please enter a valid 10-digit phone number.");
            return;
        }

        try {
            setClaiming(true);
            const userDoc = await getDocs(query(collection(db, "users"), where("__name__", "==", auth.currentUser.uid)));
            let userData = {};
            if (!userDoc.empty) {
                userData = userDoc.docs[0].data();
            }

            const claimData = {
                messId,
                messName: mess.name,
                userId: auth.currentUser.uid,
                userName: userData.name || auth.currentUser.displayName || "Registered User",
                userEmail: auth.currentUser.email,
                userPhone: phoneNumber, // Use the phone number provided by user
                status: 'pending',
                createdAt: serverTimestamp()
            };

            await addDoc(collection(db, "claims"), claimData);

            // Send Telegram Notification
            import('../utils/telegramNotifier').then(({ sendTelegramNotification, telegramTemplates }) => {
                sendTelegramNotification(telegramTemplates.newClaim(claimData));
            });

            alert("Claim request sent! Our team will contact you for verification.");
        } catch (error) {
            console.error("Claim error:", error);
            alert("Failed to send claim request.");
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

            await addDoc(collection(db, "inquiries"), inquiryDocData);

            // Send Telegram Notification
            import('../utils/telegramNotifier').then(({ sendTelegramNotification, telegramTemplates }) => {
                // Ensure inquiry notification template handles fields correctly
                sendTelegramNotification(telegramTemplates.newInquiry(inquiryDocData));
            });

            // 2. Prepare WhatsApp message
            const message = `*Inquiry for ${mess.name}* \n\nHello Mess Khojo, I am ${inquiryData.name}. I am looking for a ${inquiryData.seating === 'Any' ? 'room' : inquiryData.seating + ' room'} in *${mess.name}*. \n\nMy contact: ${inquiryData.phone}\n\nPlease help me with seat availability and details.`;
            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/+919692819621?text=${encodedMessage}`;

            // 3. Close modal and redirect
            setShowInquiryModal(false);
            window.location.href = whatsappUrl;

        } catch (error) {
            console.error("Inquiry failed:", error);
            alert("Could not process inquiry. Please try again.");
        } finally {
            setSubmittingInquiry(false);
        }
    };

    useEffect(() => {
        const fetchMessAndRooms = async () => {
            try {
                // 1. Fetch Mess Details
                const messDoc = await getDoc(doc(db, "messes", messId));
                if (messDoc.exists()) {
                    setMess({ id: messDoc.id, ...messDoc.data() });
                }

                // 2. Fetch Rooms for this Mess
                const q = query(collection(db, "rooms"), where("messId", "==", messId));
                const unsubscribe = onSnapshot(q, (snapshot) => {
                    const roomsData = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setRooms(roomsData);
                    setLoading(false);
                });

                return () => unsubscribe();
            } catch (error) {
                console.error("Error fetching details:", error);
                setLoading(false);
            }
        };

        fetchMessAndRooms();
    }, [messId]);

    // Track mess view when component mounts
    useEffect(() => {
        if (mess) {
            trackMessView(messId, mess.name);
        }
    }, [mess, messId]);

    // Dynamic SEO for mess detail pages
    usePageSEO({
        title: mess ? `${mess.name} - ${mess.messType || ''} Mess in ${mess.address || 'Balasore'} | MessKhojo` : 'Loading... | MessKhojo',
        description: mess ? `${mess.name} offers ${mess.messType || ''} accommodation in ${mess.address || 'Balasore'}. ${mess.amenities?.food ? 'Food available. ' : ''}${mess.amenities?.wifi ? 'WiFi included. ' : ''}Book your stay on MessKhojo.` : 'Find mess accommodation on MessKhojo',
        canonicalUrl: mess ? `https://messkhojo.com/mess/${messId}` : undefined,
        ogImage: mess?.posterUrl || mess?.images?.[0] || 'https://messkhojo.com/logo.png',
        ogType: 'business.business'
    });

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

    if (loading) return <div className="p-10 text-center">Loading...</div>;
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

    // Group rooms by Occupancy
    const groupedRooms = rooms.reduce((acc, room) => {
        const occupancy = room.occupancy || 'Other';
        if (!acc[occupancy]) {
            acc[occupancy] = [];
        }
        acc[occupancy].push(room);
        return acc;
    }, {});

    // Sort room groups by predefined order
    const occupancyOrder = ['1', '2', '3', '4', '5', '6', '1 Seater', '2 Seater', '3 Seater', 'Single', 'Double', 'Triple', 'Other'];
    const sortedGroups = Object.entries(groupedRooms).sort((a, b) => {
        return occupancyOrder.indexOf(a[0]) - occupancyOrder.indexOf(b[0]);
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
            {/* Header Area */}
            {/* Header Area */}
            <div className="bg-gradient-to-b from-purple-100 to-white border-b border-brand-light-gray/60 shadow-sm relative overflow-hidden">
                {/* Decorative background blob */}
                <div className="absolute top-[-20%] right-[-5%] w-64 h-64 bg-purple-200/40 rounded-full blur-3xl pointer-events-none"></div>

                <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
                    <div className="flex items-center justify-between mb-6">
                        <Link to="/" className="inline-flex items-center text-sm font-medium text-brand-text-gray hover:text-brand-primary transition-colors bg-white/60 px-3 py-1.5 rounded-full backdrop-blur-sm border border-brand-light-gray hover:border-brand-primary/30 shadow-sm">
                            <ArrowLeft size={16} className="mr-1.5" /> Back to Explore
                        </Link>
                        <button
                            onClick={handleShare}
                            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/60 border border-brand-light-gray text-brand-primary shadow-sm hover:bg-brand-primary hover:text-white transition-all active:scale-95 backdrop-blur-sm"
                            title="Share"
                        >
                            {isCopied ? <Check size={18} /> : <Send size={18} />}
                        </button>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                        <div>
                            <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-purple-600 mb-2 tracking-tight drop-shadow-sm">{mess.name}</h1>
                            <div className="flex items-center text-brand-text-gray mb-4">
                                <MapPin size={18} className="text-gray-400 mr-1.5 flex-shrink-0" />
                                <span className="text-lg">{mess.address || "Address not available"}</span>
                            </div>

                            {/* Global Amenities Display - Modern Pills */}
                            <div className="flex flex-wrap gap-3 mt-1">
                                {hasFood && (
                                    <div className="flex items-center text-sm font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-full border border-green-100/50">
                                        <Utensils size={14} className="mr-1.5" /> Food Available
                                    </div>
                                )}
                                {hasWifi && (
                                    <div className="flex items-center text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100/50">
                                        <Wifi size={14} className="mr-1.5" /> WiFi
                                    </div>
                                )}
                                {hasInverter && (
                                    <div className="flex items-center text-sm font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100/50">
                                        <Zap size={14} className="mr-1.5" /> Power Backup
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {mess.locationUrl ? (
                                <a
                                    href={mess.locationUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => trackContactClick('location', messId)}
                                    className="flex items-center bg-brand-primary text-white border border-brand-primary hover:bg-brand-primary-hover px-5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
                                >
                                    <MapPin size={18} className="mr-2" />
                                    <span className="font-semibold">Locate</span>
                                    <ExternalLink size={14} className="ml-2 opacity-70" />
                                </a>
                            ) : (
                                <button disabled className="flex items-center bg-gray-100 text-gray-400 px-5 py-2.5 rounded-xl cursor-not-allowed">
                                    <MapPin size={18} className="mr-2" />
                                    <span>Locate</span>
                                </button>
                            )}

                            {!mess.hideContact && (
                                <div className="flex items-center px-5 py-2.5 rounded-xl border bg-white border-brand-light-gray text-brand-text-dark shadow-sm">
                                    <Phone size={18} className="mr-2 text-brand-accent-green" />
                                    <span className="font-semibold">{mess.contact || "No Contact"}</span>
                                </div>
                            )}


                        </div>
                    </div>
                </div>
            </div>

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
                                <RoomTypeGroup key={occupancy} occupancy={occupancy} rooms={groupRooms} />
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

                {/* About & Facilities Section (Moved) */}
                <div className="mt-12">
                    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-brand-light-gray">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-purple-100 p-2.5 rounded-xl text-brand-primary">
                                <Info size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-brand-text-dark">About & Facilities</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Left Column: Description & Basic Info */}
                            <div className="space-y-6">
                                {mess.messType && (
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Property Type</h4>
                                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${mess.messType === 'Boys' ? 'bg-blue-100 text-blue-700' : mess.messType === 'Girls' ? 'bg-pink-100 text-pink-700' : 'bg-purple-100 text-purple-700'}`}>
                                            <Briefcase size={16} />
                                            {mess.messType} Mess
                                        </span>
                                    </div>
                                )}

                                {mess.advanceDeposit && (
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Financials</h4>
                                        <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                            <div className="bg-green-100 text-green-700 p-2 rounded-lg">
                                                <span className="font-bold text-lg">₹</span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800">Advance / Deposit Information</p>
                                                <p className="text-sm text-gray-600 mt-1">{mess.advanceDeposit}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right Column: Facilities Grid */}
                            <div className="space-y-6">
                                {(mess.foodFacility || mess.security || mess.extraAppliances) && (
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Amenities & Features</h4>
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
                        <div className="absolute inset-0 bg-brand-text-dark/60 backdrop-blur-sm" onClick={() => setShowInquiryModal(false)}></div>
                        <div className="uiverse-card w-full max-w-md relative z-10 bg-white p-8 overflow-y-auto max-h-[90vh]">
                            <h2 className="text-2xl font-bold text-brand-text-dark mb-2">Seat Availability Inquiry</h2>
                            <p className="text-brand-text-gray text-sm mb-6">Fill in your details and we'll help you connect with the owner on WhatsApp.</p>

                            <form onSubmit={handleInquirySubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-brand-text-dark mb-1 ml-1">Your Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="uiverse-input w-full"
                                        value={inquiryData.name}
                                        onChange={(e) => setInquiryData({ ...inquiryData, name: e.target.value })}
                                        placeholder="Enter your full name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-brand-text-dark mb-1 ml-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        required
                                        className="uiverse-input w-full"
                                        value={inquiryData.phone}
                                        onChange={(e) => setInquiryData({ ...inquiryData, phone: e.target.value })}
                                        placeholder="10 digit mobile number"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-brand-text-dark mb-1 ml-1">Looking for (Seater)</label>
                                    <select
                                        className="uiverse-input w-full"
                                        value={inquiryData.seating}
                                        onChange={(e) => setInquiryData({ ...inquiryData, seating: e.target.value })}
                                    >
                                        <option value="Any">Any Choice</option>
                                        <option value="1 Seater">1 Seater</option>
                                        <option value="2 Seater">2 Seater</option>
                                        <option value="3 Seater">3 Seater</option>
                                    </select>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowInquiryModal(false)}
                                        className="flex-1 py-4 px-6 border border-brand-light-gray text-brand-text-gray font-bold rounded-2xl hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submittingInquiry}
                                        className="flex-[2] py-4 px-6 bg-brand-primary text-white font-bold rounded-2xl shadow-lg hover:bg-brand-primary/90 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {submittingInquiry ? 'Please wait...' : 'Submit Inquiry'}
                                    </button>
                                </div>
                            </form>
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
                    const message = `Hi MessKhojo, I want to know more about ${mess.name} (${mess.address || 'No Address'})`;
                    window.open(`https://wa.me/919692819621?text=${encodeURIComponent(message)}`, '_blank');
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

const RoomTypeGroup = ({ occupancy, rooms }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Calculate price range
    const prices = rooms.map(r => Number(r.price || r.rent)).sort((a, b) => a - b);
    const minPrice = prices[0];
    const maxPrice = prices[prices.length - 1];
    const priceDisplay = minPrice === maxPrice ? `₹${minPrice}` : `₹${minPrice} - ₹${maxPrice}`;

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
        <div className="bg-white rounded-2xl shadow-sm border border-brand-light-gray overflow-hidden transition-all hover:shadow-md">
            <div
                className="p-6 flex flex-col md:flex-row md:items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-bold text-brand-text-dark">{displayOccupancy} Seater Rooms</h3>
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-brand-light-gray text-brand-text-gray">{rooms.length} Variants</span>
                    </div>
                    <p className="text-brand-text-gray text-sm">Starting from <span className="font-semibold text-brand-primary">{priceDisplay}/mo</span></p>
                </div>

                <div className="flex items-center gap-4 mt-4 md:mt-0">
                    {totalAvailable > 0 ? (
                        <span className="text-brand-accent-green text-sm font-medium bg-brand-accent-green/10 px-3 py-1 rounded-full">
                            Available
                        </span>
                    ) : (
                        <span className="text-brand-red text-sm font-medium bg-brand-red/10 px-3 py-1 rounded-full">
                            Full
                        </span>
                    )}

                    <button className="flex items-center gap-1 text-brand-primary font-medium hover:text-brand-primary-hover transition-colors">
                        {isOpen ? 'Hide Rooms' : 'View Rooms'}
                        {isOpen ? <ChevronDown size={20} className="rotate-180 transition-transform" /> : <ChevronDown size={20} className="transition-transform" />}
                    </button>
                </div>
            </div>

            {/* Dropdown Content - Subcategories */}
            {isOpen && (
                <div className="p-6 bg-brand-secondary/30 border-t border-brand-light-gray">
                    <div className="flex overflow-x-auto pb-4 gap-4 snap-x hide-scrollbar">
                        {rooms.map(room => (
                            <div key={room.id} className="min-w-[260px] md:min-w-[340px] snap-center">
                                <RoomCard room={room} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MessDetails;
