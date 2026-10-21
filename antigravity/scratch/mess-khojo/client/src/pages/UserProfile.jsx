import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Mail, LogOut, Calendar, MapPin, BedDouble, Edit2, Check, X, AlertTriangle, Heart, Maximize2, Lock, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePageSEO } from '../hooks/usePageSEO';
import { trackLogout } from '../analytics';
import ImageModal from '../components/ImageModal';
import { useToast } from '../context/ToastContext';

const UserProfile = () => {
    usePageSEO({ title: 'My Profile | MessKhojo', noindex: true });
    const { currentUser, logout, userRole, loading: authLoading } = useAuth();
    const { success: toastSuccess, error: toastError } = useToast();
    const [userData, setUserData] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editError, setEditError] = useState('');
    const [savingDetails, setSavingDetails] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (authLoading) return;

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
    }, [currentUser, authLoading, navigate]);


    const handleOpenEditModal = () => {
        setEditName(userData?.name || currentUser?.displayName || '');
        setEditPhone(userData?.phone || '');
        setEditError('');
        setIsEditModalOpen(true);
    };

    const handleSaveDetails = async (e) => {
        if (e && e.preventDefault) e.preventDefault();

        const trimmedName = editName.trim();
        if (!trimmedName) {
            setEditError('Please enter your full name');
            return;
        }

        const cleanPhone = editPhone.replace(/\D/g, '').slice(0, 10);
        if (cleanPhone && cleanPhone.length !== 10) {
            setEditError('Please enter a valid 10-digit mobile number');
            return;
        }

        setSavingDetails(true);
        setEditError('');

        try {
            const userDocRef = doc(db, "users", currentUser.uid);
            await updateDoc(userDocRef, {
                name: trimmedName,
                phone: cleanPhone
            });

            if (currentUser) {
                try {
                    await updateProfile(currentUser, { displayName: trimmedName });
                } catch (authErr) {
                    console.warn("Could not update auth profile displayName:", authErr);
                }
            }

            setUserData(prev => ({ ...prev, name: trimmedName, phone: cleanPhone }));
            setIsEditModalOpen(false);
            toastSuccess('Profile details updated successfully!');
        } catch (error) {
            console.error("Failed to update profile details:", error);
            setEditError(error.message || 'Failed to update profile details');
            toastError('Failed to save details');
        } finally {
            setSavingDetails(false);
        }
    };

    const handleLogout = () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = async () => {
        try {
            trackLogout(userRole || 'user');
            await logout();
            navigate('/user-login');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-brand-secondary p-4 md:p-8 flex flex-col">
            <div className="max-w-4xl mx-auto space-y-8 flex-grow w-full animate-pulse">
                {/* Skeleton Profile Header */}
                <div className="bg-gray-100 rounded-3xl shadow-xl p-6 md:p-10 border border-gray-200 relative overflow-hidden">
                    <div className="relative space-y-8">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-24 h-24 md:w-28 md:h-28 bg-gray-200 rounded-3xl"></div>
                            <div className="space-y-3">
                                <div className="h-8 w-40 bg-gray-200 rounded-lg mx-auto"></div>
                                <div className="h-5 w-28 bg-gray-200 rounded-full mx-auto"></div>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch justify-center gap-3 max-w-2xl mx-auto">
                            <div className="flex-1 h-12 bg-gray-200 rounded-2xl"></div>
                            <div className="flex-1 h-12 bg-gray-200 rounded-2xl"></div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch justify-center gap-3 pt-4">
                            <div className="h-12 w-40 bg-gray-200 rounded-2xl"></div>
                            <div className="h-12 w-40 bg-gray-200 rounded-2xl"></div>
                        </div>
                    </div>
                </div>

                {/* Skeleton Bookings Section */}
                <div className="space-y-4">
                    <div className="h-6 w-40 bg-gray-200 rounded-lg mb-4"></div>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-gray-100 rounded-xl p-5 border border-gray-200">
                                <div className="flex flex-col md:flex-row justify-between gap-4">
                                    <div className="space-y-3 w-full">
                                        <div className="h-5 w-48 bg-gray-200 rounded"></div>
                                        <div className="h-4 w-36 bg-gray-200 rounded"></div>
                                        <div className="h-3 w-32 bg-gray-200 rounded"></div>
                                    </div>
                                    <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
    if (!currentUser) return null;

    return (
        <div className="min-h-screen bg-brand-secondary p-4 md:p-8 flex flex-col">
            <div className="max-w-4xl mx-auto space-y-8 flex-grow w-full">


                {/* Profile Header Card */}
                <div className="bg-gradient-to-br from-white via-white to-brand-primary/5 rounded-3xl shadow-2xl p-6 md:p-10 border border-brand-primary/10 relative overflow-hidden backdrop-blur-sm">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-brand-primary/10 to-transparent rounded-full -mr-20 -mt-20 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-400/5 to-transparent rounded-full -ml-16 -mb-16 blur-2xl"></div>

                    {/* Edit Details Button */}
                    <button
                        onClick={handleOpenEditModal}
                        className="absolute top-5 right-5 sm:top-7 sm:right-7 flex items-center gap-1.5 px-3.5 py-2 bg-white/90 hover:bg-white text-gray-700 hover:text-brand-primary rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all font-bold text-xs uppercase tracking-wider cursor-pointer group backdrop-blur-sm z-10"
                        title="Edit Details"
                    >
                        <Edit2 size={13} className="text-brand-primary group-hover:scale-110 transition-transform" />
                        <span className="hidden sm:inline">Edit Details</span>
                    </button>

                    <div className="relative space-y-8">
                        {/* Avatar and Name Section - Centered */}
                        <div className="flex flex-col items-center text-center space-y-4">
                            {/* Avatar with enhanced styling */}
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-brand-primary to-purple-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                                <div 
                                    className={`relative w-24 h-24 md:w-28 md:h-28 bg-gradient-to-br from-brand-primary/20 to-purple-400/10 rounded-3xl flex items-center justify-center text-brand-primary border-2 border-white shadow-xl overflow-hidden transform group-hover:scale-105 transition-transform duration-300 ${currentUser?.photoURL ? 'cursor-pointer' : ''}`}
                                    onClick={() => {
                                        if (currentUser?.photoURL) {
                                            setIsImageModalOpen(true);
                                        }
                                    }}
                                    title={currentUser?.photoURL ? "Click to view full profile photo" : ""}
                                >
                                    {currentUser && currentUser.photoURL ? (
                                        <>
                                            <img
                                                src={currentUser.photoURL}
                                                alt="User profile"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextElementSibling.style.display = 'flex';
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                <Maximize2 size={24} className="text-white drop-shadow-md" />
                                            </div>
                                        </>
                                    ) : null}
                                    <div 
                                        className="w-full h-full flex items-center justify-center"
                                        style={{ display: (currentUser && currentUser.photoURL) ? 'none' : 'flex' }}
                                    >
                                        <User size={48} strokeWidth={1.5} />
                                    </div>
                                </div>
                            </div>

                            {/* Name and Member Since */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-center gap-2">
                                    <h1 className="text-3xl md:text-4xl font-black text-brand-text-dark leading-tight tracking-tight bg-gradient-to-r from-brand-text-dark to-brand-primary bg-clip-text">
                                        {userData?.name || "User"}
                                    </h1>
                                    <button
                                        onClick={handleOpenEditModal}
                                        className="p-1.5 text-gray-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-xl transition-all cursor-pointer group"
                                        title="Edit details"
                                        aria-label="Edit details"
                                    >
                                        <Edit2 size={20} className="group-hover:scale-110 transition-transform" />
                                    </button>
                                </div>
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-primary/10 rounded-full border border-brand-primary/20">
                                    <Calendar size={14} className="text-brand-primary" />
                                    <p className="text-brand-text-gray text-xs font-bold uppercase tracking-wider">
                                        Member since {userData?.createdAt ? new Date(userData.createdAt.seconds * 1000).getFullYear() : '2024'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Contact Info Section - Improved cards */}
                        <div className="flex flex-col sm:flex-row items-stretch justify-center gap-3 max-w-2xl mx-auto">
                            {/* Email Card */}
                            <div className="flex-1 flex items-center gap-3 text-sm font-semibold text-brand-text-dark bg-gradient-to-br from-blue-50 to-white px-4 py-3.5 rounded-2xl border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="p-2 bg-blue-500/10 rounded-xl">
                                    <Mail size={18} className="text-blue-600" />
                                </div>
                                <span className="truncate text-xs md:text-sm">{currentUser.email}</span>
                            </div>
                            
                            {/* Phone Card */}
                            <div className="flex-1 flex items-center justify-between gap-3 text-sm font-semibold text-brand-text-dark bg-gradient-to-br from-green-50 to-white px-4 py-3.5 rounded-2xl border border-green-100 shadow-sm hover:shadow-md transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-500/10 rounded-xl">
                                        <Phone size={18} className="text-green-600" />
                                    </div>
                                    <span className="text-xs md:text-sm">{userData?.phone || "Phone Not Set"}</span>
                                </div>
                                <button
                                    onClick={handleOpenEditModal}
                                    className="p-1.5 hover:bg-green-100 text-green-600 rounded-lg transition-all transform hover:scale-110 cursor-pointer"
                                    title="Edit phone number"
                                    aria-label="Edit phone number"
                                >
                                    <Edit2 size={15} />
                                </button>
                            </div>
                        </div>

                        {/* Action Buttons - Enhanced */}
                        <div className="flex flex-col sm:flex-row items-stretch justify-center gap-3 pt-4">
                            <Link
                                to="/wishlist"
                                className="group relative px-8 py-4 bg-gradient-to-br from-red-50 to-pink-50 text-red-600 hover:from-red-500 hover:to-pink-500 hover:text-white rounded-2xl transition-all duration-300 font-bold text-sm flex items-center justify-center gap-3 border border-red-100 shadow-lg hover:shadow-xl active:scale-95 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                                <Heart size={20} className="fill-current group-hover:scale-125 transition-transform duration-300 relative z-10" />
                                <span className="relative z-10">My Wishlist</span>
                            </Link>
                            <button
                                onClick={() => navigate('/')}
                                className="group px-8 py-4 bg-gradient-to-br from-brand-secondary to-brand-primary/5 text-brand-primary hover:from-brand-primary hover:to-brand-primary-hover hover:text-white rounded-2xl transition-all duration-300 font-bold text-sm flex items-center justify-center gap-3 border border-brand-primary/20 shadow-lg hover:shadow-xl active:scale-95"
                            >
                                <span className="text-lg group-hover:-translate-x-1 transition-transform">←</span>
                                <span>Back to Home</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bookings Section */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-brand-text-dark mb-4 pl-1">Recent call history</h2>

                    {bookings.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-gray-200">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                <Calendar size={32} />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">No recent call history</h3>
                            <p className="text-gray-500 mb-6">Explore messes and contact owners directly!</p>
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
                                                <span>{(({
                                                    'Single': '1',
                                                    'Double': '2',
                                                    'Triple': '3',
                                                    'Four': '4',
                                                    'Five': '5',
                                                    'Six': '6'
                                                })[booking.roomType] || booking.roomType)} Seater</span>
                                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                <span>₹{booking.price}/mo</span>
                                            </div>
                                            <p className="text-xs text-gray-400">
                                                Request ID: #{booking.id.slice(0, 6).toUpperCase()} •
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

                {/* Account Actions Section */}
                <div className="pt-12 pb-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        onClick={handleLogout}
                        className="w-full sm:w-auto min-w-[240px] flex items-center justify-center gap-3 px-10 py-4 bg-white text-brand-primary rounded-3xl hover:bg-brand-primary/5 transition-all font-black text-sm uppercase tracking-widest border-2 border-brand-primary/15 shadow-lg active:scale-95 cursor-pointer"
                    >
                        <LogOut size={20} strokeWidth={2.5} />
                        Sign Out Account
                    </button>

                    {userRole !== 'admin' && userRole !== 'operator' && (
                        <button
                            onClick={() => navigate('/delete-account')}
                            className="w-full sm:w-auto min-w-[240px] flex items-center justify-center gap-3 px-10 py-4 bg-white text-red-600 rounded-3xl hover:bg-red-50 transition-all font-black text-sm uppercase tracking-widest border-2 border-red-50 shadow-lg active:scale-95 cursor-pointer"
                        >
                            <Trash2 size={20} strokeWidth={2.5} />
                            Delete My Account
                        </button>
                    )}
                </div>
            </div>

            {/* Edit Profile Details Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl border border-gray-100 relative">
                        {/* Close button */}
                        <button
                            onClick={() => !savingDetails && setIsEditModalOpen(false)}
                            disabled={savingDetails}
                            className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                            aria-label="Close"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary">
                                <Edit2 size={22} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Edit Details</h3>
                                <p className="text-xs text-gray-500">Update your account display information</p>
                            </div>
                        </div>

                        {editError && (
                            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-semibold flex items-center gap-2">
                                <AlertTriangle size={16} className="shrink-0" />
                                <span>{editError}</span>
                            </div>
                        )}

                        <form onSubmit={handleSaveDetails} className="space-y-4">
                            {/* Full Name input */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                        <User size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        placeholder="Enter your name"
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all"
                                        disabled={savingDetails}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {/* Mobile Phone Number input */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                    Mobile Phone Number
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                        <Phone size={18} />
                                    </div>
                                    <input
                                        type="tel"
                                        value={editPhone}
                                        onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        placeholder="10-digit mobile number"
                                        maxLength="10"
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all"
                                        disabled={savingDetails}
                                    />
                                </div>
                            </div>

                            {/* Email Address readonly */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Email Address
                                    </label>
                                    <span className="text-[10px] text-gray-400 flex items-center gap-1 font-semibold">
                                        <Lock size={10} /> Locked
                                    </span>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        type="email"
                                        value={currentUser.email || ''}
                                        readOnly
                                        disabled
                                        className="w-full pl-10 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-500 cursor-not-allowed select-none"
                                    />
                                </div>
                            </div>

                            {/* Modal Action Buttons */}
                            <div className="flex gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    disabled={savingDetails}
                                    className="flex-1 py-3 px-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingDetails}
                                    className="flex-1 py-3 px-4 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {savingDetails ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Check size={16} />
                                            <span>Save Changes</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Logout Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl transform transition-all">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary">
                                <LogOut size={32} />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Sign Out?</h3>
                        <p className="text-center text-sm text-gray-600 mb-6 font-medium">
                            Are you sure you want to sign out of your account?
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={confirmLogout}
                                className="w-full py-3.5 bg-brand-primary text-white rounded-2xl font-bold uppercase tracking-wide text-sm hover:bg-brand-primary-hover transition-colors flex items-center justify-center gap-2"
                            >
                                Yes, Sign Out
                            </button>
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="w-full py-3.5 bg-gray-100 text-gray-700 rounded-2xl font-bold uppercase tracking-wide text-sm hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Profile Photo Popup Modal */}
            <ImageModal
                isOpen={isImageModalOpen}
                onClose={() => setIsImageModalOpen(false)}
                src={currentUser?.photoURL}
                title={userData?.name ? `${userData.name} - Profile Photo` : 'Profile Photo'}
            />
        </div>
    );
};

export default UserProfile;
