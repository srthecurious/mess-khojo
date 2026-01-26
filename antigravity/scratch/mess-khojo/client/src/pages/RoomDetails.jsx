import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { MapPin, Wifi, Zap, CheckCircle, ArrowLeft, BedDouble, Wind, Droplets, Utensils, Star, Shield, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars
import PhoneCollectionModal from '../components/PhoneCollectionModal';
import { trackRoomView, trackBookingInitiated } from '../analytics';

const RoomDetails = () => {
    const { messId, roomId } = useParams();
    const navigate = useNavigate();
    const { currentUser, userRole } = useAuth();

    const [mess, setMess] = useState(null);
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bookingProcessing, setBookingProcessing] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [userPhone, setUserPhone] = useState('');


    useEffect(() => {
        const fetchDetails = async () => {
            try {
                // Fetch Mess
                const messDoc = await getDoc(doc(db, "messes", messId));
                if (messDoc.exists()) {
                    setMess({ id: messDoc.id, ...messDoc.data() });
                }

                // Fetch Room
                const roomDoc = await getDoc(doc(db, "rooms", roomId));
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
    }, [messId, roomId]);

    // Track room view when component mounts
    useEffect(() => {
        if (mess && room) {
            trackRoomView(roomId, messId, room.price);
        }
    }, [mess, room, messId, roomId]);

    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        if (!loading && currentUser && searchParams.get('action') === 'book') {
            handleBookClick();
            // Clear the param to prevent re-triggering
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('action');
            setSearchParams(newParams, { replace: true });
        }
    }, [currentUser, loading]);

    const handleBookClick = async () => {
        if (!currentUser) {
            // Redirect to Login with return URL ensuring action=book is preserved
            const returnUrl = `/room/${messId}/${roomId}?action=book`;
            console.log('🔗 Redirecting to login with return URL:', returnUrl);
            navigate(`/user-login?redirect=${encodeURIComponent(returnUrl)}`);
            return;
        }
        if (userRole !== 'user') {
            alert("Partners cannot book rooms. Please login as a User.");
            return;
        }

        // Check if user has a phone number
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        const phone = userData.phone || '';

        // Track booking initiation
        trackBookingInitiated(roomId, messId, room.price);

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
                status: 'pending',
                createdAt: serverTimestamp()
            };

            await addDoc(collection(db, "bookings"), bookingData);

            // Send Telegram Notification
            import('../utils/telegramNotifier').then(({ sendTelegramNotification, telegramTemplates }) => {
                sendTelegramNotification(telegramTemplates.newBooking(bookingData));
            });
            setShowConfirmModal(false);
            navigate('/booking-success');
        } catch (error) {
            console.error("Booking failed:", error);
            alert("Booking failed. Please try again.");
        } finally {
            setBookingProcessing(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading details...</div>;
    if (!mess || !room) return <div className="p-10 text-center">Details not found.</div>;

    return (
        <div className="min-h-screen bg-brand-secondary pb-20">
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
                            <img src={room.imageUrls[0]} alt="Room Main" className="w-full h-64 object-cover rounded-xl col-span-2" />
                            {room.imageUrls.slice(1, 3).map((url, idx) => (
                                <img key={idx} src={url} alt={`Room ${idx + 1}`} className="w-full h-32 object-cover rounded-xl" />
                            ))}
                        </div>
                    ) : (
                        <img src={room.imageUrl || "/default-room.jpg"} alt="Room" className="w-full h-64 object-cover rounded-xl" />
                    )}
                </div>

                {/* Title & Price */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-light-gray flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-2xl font-bold text-brand-text-dark">{({
                                'Single': '1',
                                'Double': '2',
                                'Triple': '3',
                                'Four': '4',
                                'Five': '5',
                                'Six': '6'
                            })[room.occupancy] || room.occupancy} Seater</h2>
                            <span className="bg-brand-accent-green/10 text-brand-accent-green text-xs font-bold px-2 py-0.5 rounded-full border border-brand-accent-green/20">
                                {room.category || 'Standard'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-brand-text-gray">
                            <MapPin size={16} className="text-brand-primary" />
                            <span className="font-medium text-brand-primary">{mess.name}</span>
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

                    <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-bold text-gray-900 mb-2">Mess Rules</h4>
                            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                <li>Deposit: {mess.advanceDeposit || 'Contact Owner'}</li>
                                <li>Type: {mess.messType}</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 mb-2">Facilities</h4>
                            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                <li>{mess.foodFacility || 'Standard Menu'}</li>
                                <li>{mess.extraAppliances || 'No heavy appliances'}</li>
                                <li>{mess.security || 'Standard Security'}</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 px-6 md:hidden z-20 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <div>
                    <p className="text-xs text-gray-500 font-bold uppercase">Total Rent</p>
                    <p className="text-2xl font-black text-brand-text-dark">₹{room.price}</p>
                </div>
                <button
                    onClick={handleBookClick}
                    disabled={room.availableCount <= 0}
                    className="bg-brand-primary text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg hover:bg-brand-primary-hover active:scale-95 transition-all disabled:bg-gray-300 disabled:shadow-none"
                >
                    {room.availableCount > 0 ? 'Request Booking' : 'Sold Out'}
                </button>
            </div>

            {/* Desktop Action Button (Floating) */}
            <div className="hidden md:block fixed bottom-8 right-8 z-30">
                <button
                    onClick={handleBookClick}
                    disabled={room.availableCount <= 0}
                    className="bg-brand-primary text-white px-10 py-4 rounded-2xl font-bold text-xl shadow-2xl hover:bg-brand-primary-hover hover:scale-105 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-3"
                >
                    {room.availableCount > 0 ? (
                        <>
                            <span>Request Booking</span>
                            <div className="w-px h-6 bg-white/20"></div>
                            <span className="font-normal text-white/80">₹{room.price}</span>
                        </>
                    ) : 'Sold Out'}
                </button>
            </div>


            {/* Confirmation Modal */}
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
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-primary">
                                    <CheckCircle size={32} />
                                </div>
                                <h3 className="text-2xl font-bold text-brand-text-dark">Confirm Booking?</h3>
                                <p className="text-gray-500 mt-2 text-sm">
                                    You are sending a booking request for <strong>{mess.name}</strong>.
                                </p>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
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
                                <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between text-sm">
                                    <span className="text-gray-500">Your Contact</span>
                                    <span className="font-bold text-gray-900">{currentUser.email}</span>
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
                                    className="flex-1 py-3 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold rounded-xl transition-colors shadow-lg disabled:opacity-70"
                                >
                                    {bookingProcessing ? 'Sending...' : 'Confirm'}
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
                        setShowConfirmModal(true); // Proceed to booking confirmation
                    }}
                    onSkip={() => {
                        setShowPhoneModal(false);
                        // Don't proceed to booking without phone
                    }}
                />
            )}
        </div>
    );
};

export default RoomDetails;
