import { useState, useEffect } from 'react';
import { auth } from '../../../firebase';
import { watchMessByAdmin, watchRoomsByMess } from '../../../services/messService';
import { watchBookingsByMess } from '../../../services/bookingService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { signOut } from 'firebase/auth';

export function useAdminData() {
    const { userRole } = useAuth();
    const [user, setUser] = useState(null);
    const [messProfile, setMessProfile] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const navigate = useNavigate();

    // 1. Auth Listener
    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                navigate('/admin/login');
            }
        });
        return unsubscribeAuth;
    }, [navigate]);

    // 2. Security check
    useEffect(() => {
        if (user && userRole) {
            if (userRole !== 'admin' && userRole !== 'operator') {
                signOut(auth).then(() => {
                    navigate('/?error=access_denied');
                });
            }
        }
    }, [user, userRole, navigate]);

    // 3. Listen to Mess Profile
    useEffect(() => {
        if (!user) return;
        const unsubscribeMess = watchMessByAdmin(user.uid, (profile) => {
            setMessProfile(profile);
            setLoadingProfile(false);
        });

        return unsubscribeMess;
    }, [user]);

    // 4. Listen to Rooms
    useEffect(() => {
        if (!messProfile) {
            setTimeout(() => setRooms([]), 0);
            return;
        }
        const unsubscribeRooms = watchRoomsByMess(messProfile.id, (roomsData) => {
            setRooms(roomsData);
        });

        return unsubscribeRooms;
    }, [messProfile]);

    // 5. Listen to Bookings
    useEffect(() => {
        if (!messProfile) {
            setTimeout(() => setBookings([]), 0);
            return;
        }
        const unsubscribeBookings = watchBookingsByMess(messProfile.id, (bookingsData) => {
            setBookings(bookingsData);
        });

        return unsubscribeBookings;
    }, [messProfile]);

    return {
        user,
        messProfile,
        rooms,
        setRooms,
        bookings,
        loadingProfile,
        setMessProfile
    };
}

