import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Mail, LogOut, Calendar, MapPin, BedDouble } from 'lucide-react';

const UserProfile = () => {
    const { currentUser, logout, userRole } = useAuth();
    const [userData, setUserData] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser) {
                navigate('/user-login');
                return;
            }

            try {
                // 1. Fetch User Profile
                const userDocRef = doc(db, "users", currentUser.uid);
                const userSnap = await getDoc(userDocRef);
                if (userSnap.exists()) {
                    setUserData(userSnap.data());
                }

                // 2. Fetch Bookings
                const q = query(
                    collection(db, "bookings"),
                    where("userId", "==", currentUser.uid)
                );
                const querySnapshot = await getDocs(q);
                const bookingsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Sort client-side
                bookingsData.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
                setBookings(bookingsData);

            } catch (error) {
                console.error("Error fetching profile data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentUser, navigate]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/user-login');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading profile...</div>;
    if (!currentUser) return null;

    return (
        <div className="min-h-screen bg-brand-secondary p-4 md:p-8 flex flex-col">
            <div className="max-w-4xl mx-auto space-y-8 flex-grow w-full">
                {/* Role Warning for Admin/Operator */}
                {userRole === 'admin' && (
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3 text-amber-800">
                            <div className="bg-amber-100 p-2 rounded-full">
                                <User size={20} />
                            </div>
                            <p className="text-sm font-medium">
                                You are signed in with an <strong>Operator/Partner</strong> account.
                            </p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="text-amber-700 text-xs font-bold uppercase tracking-wider hover:underline"
                        >
                            Switch to Student Account
                        </button>
                    </div>
                )}

                {/* Profile Header Card */}
                <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 border border-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>

                    <div className="relative flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-5 md:gap-6 w-full md:w-auto">
                            <div className="w-20 h-20 md:w-24 md:h-24 bg-brand-primary/10 rounded-[24px] md:rounded-3xl flex items-center justify-center text-brand-primary shadow-inner shrink-0">
                                <User size={40} strokeWidth={1.5} />
                            </div>
                            <div className="text-center md:text-left space-y-3 w-full">
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-black text-brand-text-dark leading-tight tracking-tight">{userData?.name || "User"}</h1>
                                    <p className="text-brand-text-gray text-[10px] md:text-xs font-bold uppercase tracking-widest flex items-center justify-center md:justify-start gap-1.5 mt-1">
                                        <Calendar size={10} className="text-brand-primary" />
                                        Member since {userData?.createdAt ? new Date(userData.createdAt.seconds * 1000).getFullYear() : '2024'}
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-2 md:gap-4 pt-1">
                                    <div className="flex items-center gap-2 text-xs md:text-sm font-semibold text-brand-text-dark bg-gray-50/50 px-3 py-2 rounded-xl border border-gray-100 w-full sm:w-auto justify-center md:justify-start overflow-hidden">
                                        <Mail size={14} className="text-blue-500 shrink-0" />
                                        <span className="truncate">{currentUser.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs md:text-sm font-semibold text-brand-text-dark bg-gray-50/50 px-3 py-2 rounded-xl border border-gray-100 w-full sm:w-auto justify-center md:justify-start">
                                        <Phone size={14} className="text-green-500 shrink-0" />
                                        <span>{userData?.phone || "Phone Not Set"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-3">
                            <button
                                onClick={() => navigate('/')}
                                className="w-full sm:w-auto px-6 py-3 bg-brand-secondary text-brand-primary rounded-2xl hover:bg-brand-primary/10 transition-all font-bold text-sm flex items-center justify-center gap-2 border border-brand-primary/10 active:scale-95"
                            >
                                <span>←</span> Back to Home
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bookings Section */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-brand-text-dark mb-4 pl-1">My Bookings</h2>

                    {bookings.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-gray-200">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                <Calendar size={32} />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">No bookings yet</h3>
                            <p className="text-gray-500 mb-6">Explore messes and book your first stay!</p>
                            <button
                                onClick={() => navigate('/')}
                                className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover transition-colors"
                            >
                                Browse Messes
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {bookings.map(booking => (
                                <div key={booking.id} className="bg-white rounded-xl p-5 shadow-sm border border-brand-light-gray hover:shadow-md transition-shadow">
                                    <div className="flex flex-col md:flex-row justify-between gap-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-brand-primary font-bold text-lg">
                                                <MapPin size={18} />
                                                {booking.messName}
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <BedDouble size={16} />
                                                <span>{booking.roomType} Room</span>
                                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                <span>₹{booking.price}/mo</span>
                                            </div>
                                            <p className="text-xs text-gray-400">
                                                Booking ID: #{booking.id.slice(0, 6).toUpperCase()} •
                                                Placed on {booking.createdAt ? new Date(booking.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                            </p>
                                        </div>

                                        <div className="flex items-center md:flex-col md:items-end md:justify-center gap-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                                                ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                    booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-yellow-700'}`}>
                                                {booking.status || 'Pending'}
                                            </span>
                                        </div>
                                    </div>
                                    {booking.remark && (
                                        <div className="mt-4 p-3 bg-gray-50 rounded-lg border-l-4 border-brand-primary">
                                            <p className="text-xs font-bold text-brand-primary uppercase mb-1">Operator Remark:</p>
                                            <p className="text-sm text-gray-700 italic">"{booking.remark}"</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Logout Button Section */}
                <div className="pt-12 pb-8 border-t border-gray-100 flex justify-center">
                    <button
                        onClick={handleLogout}
                        className="w-full sm:w-auto min-w-[240px] flex items-center justify-center gap-3 px-10 py-4 bg-white text-red-600 rounded-3xl hover:bg-red-50 transition-all font-black text-sm uppercase tracking-widest border-2 border-red-50 shadow-lg active:scale-95"
                    >
                        <LogOut size={20} strokeWidth={2.5} />
                        Sign Out Account
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
