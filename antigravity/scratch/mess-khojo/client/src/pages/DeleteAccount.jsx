import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { 
    AlertTriangle, 
    Trash2, 
    ArrowLeft, 
    ShieldAlert, 
    User, 
    Mail, 
    Phone, 
    Calendar, 
    Heart, 
    BedDouble, 
    LogOut, 
    CheckSquare, 
    Square 
} from 'lucide-react';
import { usePageSEO } from '../hooks/usePageSEO';
import { trackAccountDelete, trackLogout } from '../analytics';
import { useToast } from '../context/ToastContext';

const DeleteAccount = () => {
    usePageSEO({ title: 'Delete Account | MessKhojo', noindex: true });
    
    const { currentUser, userRole, deleteAccount, logout, loading: authLoading } = useAuth();
    const { success: toastSuccess, error: toastError } = useToast();
    const navigate = useNavigate();

    const [userData, setUserData] = useState(null);
    const [bookingCount, setBookingCount] = useState(0);
    const [wishlistCount, setWishlistCount] = useState(0);
    const [loadingData, setLoadingData] = useState(true);

    const [confirmedChecked, setConfirmedChecked] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [requiresReauth, setRequiresReauth] = useState(false);

    // Fetch user details and active stats to personalize the deletion preview
    useEffect(() => {
        if (authLoading) return;

        if (!currentUser) {
            navigate('/user-login?redirect=/delete-account');
            return;
        }

        const fetchUserData = async () => {
            try {
                // 1. Fetch user profile
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userSnap = await getDoc(userDocRef);
                if (userSnap.exists()) {
                    const data = userSnap.data();
                    setUserData(data);

                    const messesWishlist = Array.isArray(data.wishlistedMesses) ? data.wishlistedMesses.length : 0;
                    const roomsWishlist = Array.isArray(data.wishlistedRooms) ? data.wishlistedRooms.length : 0;
                    setWishlistCount(messesWishlist + roomsWishlist);
                }

                // 2. Fetch booking requests count
                const bookingQuery = query(
                    collection(db, 'bookings'),
                    where('userId', '==', currentUser.uid)
                );
                const bookingSnap = await getDocs(bookingQuery);
                setBookingCount(bookingSnap.size);
            } catch (err) {
                console.error('Error fetching user summary for deletion:', err);
            } finally {
                setLoadingData(false);
            }
        };

        fetchUserData();
    }, [currentUser, authLoading, navigate]);

    // Handle re-authentication redirect
    const handleReauthLogout = async () => {
        try {
            trackLogout(userRole || 'user');
            await logout();
            navigate('/user-login?redirect=/delete-account');
        } catch (err) {
            console.error('Logout error during re-auth:', err);
            navigate('/user-login');
        }
    };

    // Permanently delete user data & auth credentials
    const handleConfirmDelete = async () => {
        if (!confirmedChecked || isDeleting) return;

        setIsDeleting(true);
        setErrorMessage('');
        setRequiresReauth(false);

        try {
            // 1. Delete all bookings associated with this user
            const bookingQuery = query(
                collection(db, 'bookings'),
                where('userId', '==', currentUser.uid)
            );
            const bookingSnap = await getDocs(bookingQuery);
            if (!bookingSnap.empty) {
                const bookingDeletions = bookingSnap.docs.map(bDoc => deleteDoc(doc(db, 'bookings', bDoc.id)));
                await Promise.all(bookingDeletions);
            }

            // 2. Delete user profile document from Firestore
            const userDocRef = doc(db, 'users', currentUser.uid);
            await deleteDoc(userDocRef);

            // 3. Clear relevant user data from localStorage
            try {
                localStorage.removeItem(`notifications_last_seen_${currentUser.uid}`);
                localStorage.removeItem('messkhojo_wishlist_messes');
                localStorage.removeItem('messkhojo_wishlist_rooms');
            } catch (storageErr) {
                console.warn('Could not clear local storage entries:', storageErr);
            }

            // 4. Delete Firebase Auth user account
            await deleteAccount();
            trackAccountDelete(true);

            toastSuccess('Your account and all associated data have been permanently deleted.');
            navigate('/user-login');
        } catch (error) {
            console.error('Failed to permanently delete account:', error);
            const errMsg = error.message || 'Unknown error';
            trackAccountDelete(false, errMsg);

            if (error.code === 'auth/requires-recent-login' || error.message?.includes('requires-recent-login')) {
                setRequiresReauth(true);
                setErrorMessage('For security reasons, your authentication session has expired for sensitive actions. Please log out and sign in again before deleting your account.');
                toastError('Re-authentication required before deleting account');
            } else {
                setErrorMessage(error.message || 'Failed to delete account. Please try again later.');
                toastError('Account deletion failed');
            }
        } finally {
            setIsDeleting(false);
        }
    };

    if (authLoading || loadingData) {
        return (
            <div className="min-h-screen bg-brand-secondary p-4 md:p-8 flex items-center justify-center">
                <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-100 shadow-xl space-y-4 animate-pulse">
                    <div className="w-12 h-12 bg-red-100 rounded-2xl mx-auto"></div>
                    <div className="h-6 w-3/4 bg-gray-200 rounded-lg mx-auto"></div>
                    <div className="h-4 w-1/2 bg-gray-200 rounded-lg mx-auto"></div>
                    <div className="space-y-2 pt-4">
                        <div className="h-20 bg-gray-100 rounded-xl"></div>
                        <div className="h-20 bg-gray-100 rounded-xl"></div>
                    </div>
                </div>
            </div>
        );
    }

    // Guard against admin / operator deletion
    if (userRole === 'admin' || userRole === 'operator') {
        return (
            <div className="min-h-screen bg-brand-secondary p-4 md:p-8 flex items-center justify-center">
                <div className="max-w-lg w-full bg-white rounded-3xl p-8 border border-amber-200 shadow-xl text-center space-y-6">
                    <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 mx-auto">
                        <ShieldAlert size={36} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Restricted Action</h2>
                        <p className="text-sm text-gray-600">
                            Administrative and Operator accounts cannot be self-deleted through this portal. Please contact the platform root administrator for permission changes.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate(userRole === 'admin' ? '/admin/dashboard' : '/operational/dashboard')}
                        className="w-full py-3.5 bg-brand-primary text-white rounded-2xl font-bold text-sm uppercase tracking-wider hover:bg-brand-primary-hover transition-colors"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const userName = userData?.name || currentUser?.displayName || 'User';
    const userEmail = currentUser?.email || userData?.email || 'N/A';
    const userPhone = userData?.phone || currentUser?.phoneNumber || 'Not provided';

    return (
        <div className="min-h-screen bg-brand-secondary py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-between">
            <div className="max-w-2xl mx-auto w-full space-y-6">
                
                {/* Back navigation button */}
                <div className="flex items-center">
                    <button
                        onClick={() => navigate('/profile')}
                        disabled={isDeleting}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-brand-primary transition-colors disabled:opacity-50 group cursor-pointer"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Profile
                    </button>
                </div>

                {/* Main Action Card */}
                <div className="bg-white rounded-3xl shadow-xl border border-red-100 overflow-hidden">
                    
                    {/* Header Banner */}
                    <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-6 sm:p-8">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/30 text-white shadow-inner">
                                <AlertTriangle size={28} />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                                    Delete My Account
                                </h1>
                                <p className="text-red-100 text-sm mt-1 leading-relaxed">
                                    This action is permanent and cannot be undone. Please review what data will be deleted below.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 sm:p-8 space-y-6">

                        {/* Account Summary */}
                        <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4 sm:p-5">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                                Account Being Removed
                            </p>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                                <div>
                                    <h2 className="font-bold text-gray-900 text-base">{userName}</h2>
                                    <p className="text-gray-600 text-xs sm:text-sm">{userEmail}</p>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700">
                                        📞 {userPhone}
                                    </span>
                                    {bookingCount > 0 && (
                                        <span className="px-3 py-1 bg-amber-50 border border-amber-200 rounded-lg text-xs font-bold text-amber-700">
                                            {bookingCount} {bookingCount === 1 ? 'Booking' : 'Bookings'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Error Message & Re-authentication Alert */}
                        {errorMessage && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 space-y-3">
                                <div className="flex items-start gap-3">
                                    <ShieldAlert size={20} className="shrink-0 mt-0.5 text-red-600" />
                                    <div className="text-sm font-medium leading-relaxed">
                                        {errorMessage}
                                    </div>
                                </div>
                                {requiresReauth && (
                                    <div className="pt-2">
                                        <button
                                            type="button"
                                            onClick={handleReauthLogout}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-red-700 active:scale-95 transition-all shadow-sm"
                                        >
                                            <LogOut size={14} />
                                            Log Out & Sign In Again
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* What Data Will Be Deleted Permanently */}
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                                <Trash2 size={20} className="text-red-600" />
                                What data will be deleted permanently?
                            </h2>
                            <p className="text-xs text-gray-500 mb-4">
                                The following records associated with your account will be immediately purged:
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                
                                {/* 1. Profile Data */}
                                <div className="p-4 rounded-2xl border border-gray-200 bg-white hover:border-red-200 transition-colors">
                                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-brand-primary flex items-center justify-center mb-2.5">
                                        <User size={18} />
                                    </div>
                                    <h3 className="font-bold text-sm text-gray-900 mb-1">
                                        Personal Profile Info
                                    </h3>
                                    <p className="text-xs text-gray-600 leading-relaxed">
                                        Your name, registered email, verified phone number, profile photo, and account metadata.
                                    </p>
                                </div>

                                {/* 2. Bookings & Requests */}
                                <div className="p-4 rounded-2xl border border-gray-200 bg-white hover:border-red-200 transition-colors">
                                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2.5">
                                        <BedDouble size={18} />
                                    </div>
                                    <h3 className="font-bold text-sm text-gray-900 mb-1">
                                        Booking & Visit History
                                    </h3>
                                    <p className="text-xs text-gray-600 leading-relaxed">
                                        All active and previous room booking requests, room visit appointments, and operator inquiry records.
                                    </p>
                                </div>

                                {/* 3. Saved Wishlist */}
                                <div className="p-4 rounded-2xl border border-gray-200 bg-white hover:border-red-200 transition-colors">
                                    <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-2.5">
                                        <Heart size={18} />
                                    </div>
                                    <h3 className="font-bold text-sm text-gray-900 mb-1">
                                        Wishlists & Bookmarks
                                    </h3>
                                    <p className="text-xs text-gray-600 leading-relaxed">
                                        All shortlisted messes and rooms saved under your profile ({wishlistCount} saved {wishlistCount === 1 ? 'item' : 'items'}).
                                    </p>
                                </div>

                                {/* 4. Login & Authentication */}
                                <div className="p-4 rounded-2xl border border-gray-200 bg-white hover:border-red-200 transition-colors">
                                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2.5">
                                        <ShieldAlert size={18} />
                                    </div>
                                    <h3 className="font-bold text-sm text-gray-900 mb-1">
                                        Authentication & Sessions
                                    </h3>
                                    <p className="text-xs text-gray-600 leading-relaxed">
                                        Your login credentials, Google SSO token links, active browser sessions, and push notification tokens.
                                    </p>
                                </div>
                            </div>
                        </div>


                        {/* Confirmation Checkbox Safeguard */}
                        <div 
                            onClick={() => !isDeleting && setConfirmedChecked(!confirmedChecked)}
                            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 select-none ${
                                confirmedChecked 
                                    ? 'border-red-500 bg-red-50/40 shadow-sm' 
                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                        >
                            <div className="mt-0.5 text-red-600 shrink-0">
                                {confirmedChecked ? (
                                    <CheckSquare size={20} className="text-red-600" />
                                ) : (
                                    <Square size={20} className="text-gray-400" />
                                )}
                            </div>
                            <label className="text-xs sm:text-sm text-gray-700 font-medium leading-relaxed cursor-pointer">
                                I understand that deleting my account is permanent and cannot be undone. All my profile details, active bookings, and saved listings will be deleted permanently.
                            </label>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => navigate('/profile')}
                                disabled={isDeleting}
                                className="order-2 sm:order-1 flex-1 py-3.5 px-6 rounded-2xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 font-bold text-sm tracking-wide transition-all disabled:opacity-50 text-center cursor-pointer"
                            >
                                Cancel & Keep Account
                            </button>
                            
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                disabled={!confirmedChecked || isDeleting}
                                className="order-1 sm:order-2 flex-1 py-3.5 px-6 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-bold text-sm tracking-wide uppercase transition-all shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {isDeleting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Deleting Account...</span>
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={16} />
                                        <span>Delete Account Permanently</span>
                                    </>
                                )}
                            </button>
                        </div>

                    </div>
                </div>

                {/* Additional Help Link */}
                <div className="text-center text-xs text-gray-500">
                    Having trouble or have questions before deleting?{' '}
                    <Link to="/about-us" className="text-brand-primary underline hover:text-brand-primary-hover font-semibold">
                        Contact Support
                    </Link>
                </div>

            </div>
        </div>
    );
};

export default DeleteAccount;
