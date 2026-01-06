import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Phone, ArrowLeft, ExternalLink, Utensils, Droplets, Wifi, Zap, ChevronDown, ChevronUp, Briefcase, Info, ShieldCheck, AlertCircle, BedDouble } from 'lucide-react';
import { db, auth } from '../firebase';
import { doc, getDoc, collection, query, where, onSnapshot, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import RoomCard from '../components/RoomCard';

const MessDetails = () => {
    const { id: messId } = useParams();
    const [mess, setMess] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(false);
    const [showInquiryModal, setShowInquiryModal] = useState(false);
    const [inquiryData, setInquiryData] = useState({ name: '', phone: '', seating: 'Any' });
    const [submittingInquiry, setSubmittingInquiry] = useState(false);

    const handleClaimListing = async () => {
        if (!auth.currentUser) {
            alert("Please login to claim this listing.");
            return;
        }

        try {
            setClaiming(true);
            const userDoc = await getDocs(query(collection(db, "users"), where("__name__", "==", auth.currentUser.uid)));
            let userData = {};
            if (!userDoc.empty) {
                userData = userDoc.docs[0].data();
            }

            await addDoc(collection(db, "claims"), {
                messId,
                messName: mess.name,
                userId: auth.currentUser.uid,
                userName: userData.name || auth.currentUser.displayName || "Registered User",
                userEmail: auth.currentUser.email,
                userPhone: userData.phone || "Not provided",
                status: 'pending',
                createdAt: serverTimestamp()
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
            await addDoc(collection(db, "inquiries"), {
                ...inquiryData,
                messId,
                messName: mess.name,
                status: 'pending',
                createdAt: serverTimestamp()
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
    const occupancyOrder = ['Single', 'Double', 'Triple', 'Four', 'Five', 'Six', 'Other'];
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
            <div className="bg-white border-b border-brand-light-gray shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <Link to="/" className="inline-flex items-center text-brand-text-gray hover:text-brand-primary mb-6 transition-colors font-medium">
                        <ArrowLeft size={20} className="mr-2" /> Back to Explore
                    </Link>
                    <h1 className="text-4xl font-bold text-brand-text-dark mb-4">{mess.name}</h1>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap gap-6 text-brand-text-dark">
                            <div className="flex items-center bg-brand-light-gray px-4 py-2 rounded-full">
                                <MapPin size={20} className="mr-2 text-brand-accent-blue" />
                                <span>{(!mess.address || mess.address.startsWith('http')) ? "No information" : mess.address}</span>
                                {mess.locationUrl && (
                                    <a
                                        href={mess.locationUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="ml-2 text-brand-accent-blue hover:text-brand-primary"
                                        title="View on Google Maps"
                                    >
                                        <ExternalLink size={16} />
                                    </a>
                                )}
                            </div>
                            <div className="flex items-center bg-brand-light-gray px-4 py-2 rounded-full">
                                <Phone size={20} className="mr-2 text-brand-accent-green" />
                                <span>{mess.hideContact ? "Not Available" : (mess.contact || "No information")}</span>
                            </div>
                        </div>

                        {/* Global Amenities Display */}
                        <div className="flex flex-wrap gap-4 mt-2">
                            {hasFood && (
                                <div className="flex items-center text-sm font-medium text-brand-text-dark bg-brand-secondary px-3 py-1.5 rounded-lg border border-brand-light-gray">
                                    <Utensils size={16} className="mr-2 text-brand-accent-green" /> Food Available
                                </div>
                            )}
                            {hasWifi && (
                                <div className="flex items-center text-sm font-medium text-brand-text-dark bg-brand-secondary px-3 py-1.5 rounded-lg border border-brand-light-gray">
                                    <Wifi size={16} className="mr-2 text-brand-primary" /> Free WiFi
                                </div>
                            )}
                            {hasInverter && (
                                <div className="flex items-center text-sm font-medium text-brand-text-dark bg-brand-secondary px-3 py-1.5 rounded-lg border border-brand-light-gray">
                                    <Zap size={16} className="mr-2 text-brand-amber" /> Power Backup
                                </div>
                            )}
                        </div>
                    </div>

                    {mess.isUserSourced && (
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-brand-amber/10 border border-brand-amber/20 rounded-2xl p-5 flex items-start gap-4">
                                <div className="bg-brand-amber/20 p-2 rounded-lg text-brand-amber mt-1">
                                    <Info size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-brand-text-dark mb-1">User Sourced Listing</h3>
                                    <p className="text-sm text-brand-text-gray mb-2">This information was provided by our community and has not been verified by the owner yet.</p>
                                    <div className="flex items-center gap-2 text-xs font-semibold text-brand-amber uppercase tracking-wider">
                                        <AlertCircle size={14} /> Last updated: {mess.lastUpdatedDate ? new Date(mess.lastUpdatedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently'}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-brand-accent-blue/10 border border-brand-accent-blue/20 rounded-2xl p-5 flex items-start gap-4">
                                <div className="bg-brand-accent-blue/20 p-2 rounded-lg text-brand-accent-blue mt-1">
                                    <ShieldCheck size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-brand-text-dark mb-1">Our Policy</h3>
                                    <p className="text-sm text-brand-text-gray leading-relaxed">
                                        We strive for accuracy, but we recommend visiting the premises before making any payments.
                                        <strong> Mess Khojo is not responsible for any discrepancies in user-sourced details.</strong>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Rooms Grid */}
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex items-center mb-8">
                    <h2 className="text-2xl font-bold text-brand-text-dark">Available Room Types</h2>
                    <div className="ml-4 h-px flex-grow bg-brand-light-gray"></div>
                </div>

                {rooms.length > 0 ? (
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
                )}

                {/* Global Actions for User Sourced */}
                {mess.isUserSourced && (
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
                                onClick={() => setShowInquiryModal(true)}
                                className="w-full md:w-auto flex items-center justify-center gap-3 bg-brand-primary text-white px-10 py-4 rounded-2xl font-bold hover:bg-brand-primary/90 transition-all shadow-xl active:scale-95"
                            >
                                <BedDouble size={24} />
                                Know Seat Availability
                            </button>
                        </div>

                        <button
                            onClick={handleClaimListing}
                            disabled={claiming}
                            className="w-full md:w-auto flex items-center justify-center gap-3 bg-brand-amber text-brand-text-dark px-10 py-4 rounded-2xl font-bold hover:bg-brand-amber/90 transition-all shadow-xl hover:shadow-brand-amber/20 active:scale-95 disabled:bg-gray-400 border-2 border-brand-amber/20"
                        >
                            <Briefcase size={24} />
                            {claiming ? 'Sending Request...' : 'Are you the Owner? Claim this Listing'}
                        </button>
                    </div>
                )}
            </div>

            {/* Inquiry Modal */}
            {showInquiryModal && (
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
                                    <option value="1 Seater">Single (1 Seater)</option>
                                    <option value="2 Seater">Double (2 Seater)</option>
                                    <option value="3 Seater">Triple (3 Seater)</option>
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
            )}
        </div>
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

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-brand-light-gray overflow-hidden transition-all hover:shadow-md">
            <div
                className="p-6 flex flex-col md:flex-row md:items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-bold text-brand-text-dark">{occupancy} Seater Rooms</h3>
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
                        {isOpen ? 'Hide Options' : 'View Options'}
                        {isOpen ? <ChevronDown size={20} className="rotate-180 transition-transform" /> : <ChevronDown size={20} className="transition-transform" />}
                    </button>
                </div>
            </div>

            {/* Dropdown Content - Subcategories */}
            {isOpen && (
                <div className="p-6 bg-brand-secondary/30 border-t border-brand-light-gray">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {rooms.map(room => (
                            <RoomCard key={room.id} room={room} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MessDetails;
