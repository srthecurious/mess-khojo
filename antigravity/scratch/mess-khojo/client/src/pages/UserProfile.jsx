import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Mail, LogOut, Calendar, MapPin, BedDouble, Edit2, Check, X, AlertTriangle, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePageSEO } from '../hooks/usePageSEO';

const UserProfile = () => {
    usePageSEO({ title: 'My Profile | MessKhojo', noindex: true });
    const { currentUser, logout, userRole, deleteAccount, loading: authLoading } = useAuth();
    const [userData, setUserData] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditingPhone, setIsEditingPhone] = useState(false);
    const [editedPhone, setEditedPhone] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [savingPhone, setSavingPhone] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingAccount, setDeletingAccount] = useState(false);
    const [deleteError, setDeleteError] = useState('');
    const [showLogoutModal, setShowLogoutModal] = useState(false);
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

    const handleEditPhone = () => {
        setEditedPhone(userData?.phone || '');
        setIsEditingPhone(true);
        setPhoneError('');
    };

    const handleCancelEditPhone = () => {
        setIsEditingPhone(false);
        setEditedPhone('');
        setPhoneError('');
    };

    const handleSavePhone = async () => {
        if (editedPhone.length < 10) {
            setPhoneError('Please enter a valid 10-digit phone number');
            return;
        }

        setSavingPhone(true);
        setPhoneError('');

        try {
            const userDocRef = doc(db, "users", currentUser.uid);
            await updateDoc(userDocRef, {
                phone: editedPhone
            });

            // Update local state
            setUserData({ ...userData, phone: editedPhone });
            setIsEditingPhone(false);
        } catch (error) {
            console.error("Failed to update phone:", error);
            setPhoneError('Failed to save phone number');
        } finally {
            setSavingPhone(false);
        }
    };

    const handleLogout = () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = async () => {
        try {
            await logout();
            navigate('/user-login');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    const handleDeleteAccount = async () => {
        setDeletingAccount(true);
        setDeleteError('');
        try {
            // Delete user document from Firestore (it cleans up their data profile)
            const userDocRef = doc(db, "users", currentUser.uid);
            await deleteDoc(userDocRef);

            // Delete Firebase Auth user
            await deleteAccount();
            navigate('/user-login');
        } catch (error) {
            console.error("Failed to delete account:", error);
            if (error.code === 'auth/requires-recent-login' || error.message?.includes('requires-recent-login')) {
                setDeleteError("For security reasons, please log out and log back in before deleting your account.");
            } else {
                setDeleteError(error.message || "Failed to delete account. Please try again later.");
            }
        } finally {
            setDeletingAccount(false);
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

                    <div className="relative space-y-8">
                        {/* Avatar and Name Section - Centered */}
                        <div className="flex flex-col items-center text-center space-y-4">
                            {/* Avatar with enhanced styling */}
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-brand-primary to-purple-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                                <div className="relative w-24 h-24 md:w-28 md:h-28 bg-gradient-to-br from-brand-primary/20 to-purple-400/10 rounded-3xl flex items-center justify-center text-brand-primary border-2 border-white shadow-xl overflow-hidden transform group-hover:scale-105 transition-transform duration-300">
                                    {currentUser && currentUser.photoURL ? (
                                        <img
                                            src={currentUser.photoURL}
                                            alt="User profile"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextElementSibling.style.display = 'flex';
                                            }}
                                        />
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
                                <h1 className="text-3xl md:text-4xl font-black text-brand-text-dark leading-tight tracking-tight bg-gradient-to-r from-brand-text-dark to-brand-primary bg-clip-text">
                                    {userData?.name || "User"}
                                </h1>
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
                            
                            {/* Phone Card - Editable */}
                            {!isEditingPhone ? (
                                <div className="flex-1 flex items-center justify-between gap-3 text-sm font-semibold text-brand-text-dark bg-gradient-to-br from-green-50 to-white px-4 py-3.5 rounded-2xl border border-green-100 shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-500/10 rounded-xl">
                                            <Phone size={18} className="text-green-600" />
                                        </div>
                                        <span className="text-xs md:text-sm">{userData?.phone || "Phone Not Set"}</span>
                                    </div>
                                    <button
                                        onClick={handleEditPhone}
                                        className="p-1.5 hover:bg-green-100 rounded-lg transition-all opacity-0 group-hover:opacity-100 transform group-hover:scale-110"
                                        title="Edit phone number"
                                    >
                                        <Edit2 size={14} className="text-green-600" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="tel"
                                            value={editedPhone}
                                            onChange={(e) => setEditedPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                            className="flex-1 px-4 py-3 text-sm border-2 border-brand-primary/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent shadow-sm"
                                            placeholder="10 digit mobile"
                                            maxLength="10"
                                            autoFocus
                                        />
                                        <button
                                            onClick={handleSavePhone}
                                            disabled={savingPhone}
                                            className="p-3 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl disabled:opacity-50 transition-all shadow-lg active:scale-95"
                                            title="Save"
                                        >
                                            <Check size={18} strokeWidth={3} />
                                        </button>
                                        <button
                                            onClick={handleCancelEditPhone}
                                            disabled={savingPhone}
                                            className="p-3 bg-gradient-to-br from-gray-300 to-gray-400 hover:from-gray-400 hover:to-gray-500 text-gray-700 rounded-xl disabled:opacity-50 transition-all shadow-lg active:scale-95"
                                            title="Cancel"
                                        >
                                            <X size={18} strokeWidth={3} />
                                        </button>
                                    </div>
                                    {phoneError && (
                                        <p className="text-xs text-red-600 font-semibold px-2 flex items-center gap-1">
                                            <AlertTriangle size={12} />
                                            {phoneError}
                                        </p>
                                    )}
                                </div>
                            )}
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
                    <h2 className="text-xl font-bold text-brand-text-dark mb-4 pl-1">My Call Requests</h2>

                    {bookings.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-gray-200">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                <Calendar size={32} />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">No call requests yet</h3>
                            <p className="text-gray-500 mb-6">Explore messes and request your first callback!</p>
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

                {/* Logout Button Section */}
                <div className="pt-12 pb-8 border-t border-gray-100 flex flex-col items-center gap-4">
                    <button
                        onClick={handleLogout}
                        className="w-full sm:w-auto min-w-[240px] flex items-center justify-center gap-3 px-10 py-4 bg-white text-red-600 rounded-3xl hover:bg-red-50 transition-all font-black text-sm uppercase tracking-widest border-2 border-red-50 shadow-lg active:scale-95"
                    >
                        <LogOut size={20} strokeWidth={2.5} />
                        Sign Out Account
                    </button>

                    {userRole !== 'admin' && userRole !== 'operator' && (
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="text-xs text-brand-text-gray hover:text-red-500 transition-colors mt-2 font-medium"
                        >
                            Delete My Account
                        </button>
                    )}
                </div>
            </div>

            {/* Delete Account Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl transform transition-all">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-500">
                                <AlertTriangle size={32} />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Delete Account?</h3>
                        <p className="text-center text-sm text-gray-600 mb-6 font-medium">
                            This action cannot be undone. All your details, history, and active requests will be permanently removed.
                        </p>

                        {deleteError && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-center flex flex-col items-center gap-3">
                                <p className="text-red-600 text-xs font-medium">{deleteError}</p>
                                {deleteError.includes('log out and log back in') && (
                                    <button
                                        onClick={handleLogout}
                                        className="px-4 py-2 bg-red-600 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm hover:bg-red-700 active:scale-95 transition-all flex items-center gap-2"
                                    >
                                        <LogOut size={14} strokeWidth={2.5} />
                                        Log Out Now
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deletingAccount}
                                className="w-full py-3.5 bg-red-500 text-white rounded-2xl font-bold uppercase tracking-wide text-sm hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {deletingAccount ? "Deleting..." : "Yes, Delete Account"}
                            </button>
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setDeleteError('');
                                }}
                                disabled={deletingAccount}
                                className="w-full py-3.5 bg-gray-100 text-gray-700 rounded-2xl font-bold uppercase tracking-wide text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
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
        </div>
    );
};

export default UserProfile;
