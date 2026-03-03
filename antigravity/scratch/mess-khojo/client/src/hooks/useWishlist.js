import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export const useWishlist = () => {
    const { currentUser } = useAuth();
    const [wishlistedMesses, setWishlistedMesses] = useState(new Set());
    const [wishlistedRooms, setWishlistedRooms] = useState(new Set());
    const [loading, setLoading] = useState(false);

    // Load wishlist from Firestore when user logs in
    useEffect(() => {
        if (!currentUser) {
            setWishlistedMesses(new Set());
            setWishlistedRooms(new Set());
            return;
        }

        const fetchWishlist = async () => {
            setLoading(true);
            try {
                const userRef = doc(db, 'users', currentUser.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const data = userSnap.data();
                    setWishlistedMesses(new Set(data.wishlistedMesses || []));
                    setWishlistedRooms(new Set(data.wishlistedRooms || []));
                }
            } catch (err) {
                console.error('Wishlist load failed:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchWishlist();
    }, [currentUser]);

    // Toggle mess in wishlist
    const toggleMessWishlist = useCallback(async (messId) => {
        if (!currentUser) return false; // auth gate — caller handles prompt
        const userRef = doc(db, 'users', currentUser.uid);
        const isAdding = !wishlistedMesses.has(messId);

        // Optimistic UI update
        setWishlistedMesses(prev => {
            const next = new Set(prev);
            isAdding ? next.add(messId) : next.delete(messId);
            return next;
        });

        try {
            await updateDoc(userRef, {
                wishlistedMesses: isAdding ? arrayUnion(messId) : arrayRemove(messId)
            });
        } catch (err) {
            // Rollback on error
            console.error('Wishlist update failed:', err);
            setWishlistedMesses(prev => {
                const next = new Set(prev);
                isAdding ? next.delete(messId) : next.add(messId);
                return next;
            });
        }

        return true;
    }, [currentUser, wishlistedMesses]);

    // Toggle room in wishlist
    const toggleRoomWishlist = useCallback(async (roomId) => {
        if (!currentUser) return false;
        const userRef = doc(db, 'users', currentUser.uid);
        const isAdding = !wishlistedRooms.has(roomId);

        setWishlistedRooms(prev => {
            const next = new Set(prev);
            isAdding ? next.add(roomId) : next.delete(roomId);
            return next;
        });

        try {
            await updateDoc(userRef, {
                wishlistedRooms: isAdding ? arrayUnion(roomId) : arrayRemove(roomId)
            });
        } catch (err) {
            console.error('Room wishlist update failed:', err);
            setWishlistedRooms(prev => {
                const next = new Set(prev);
                isAdding ? next.delete(roomId) : next.add(roomId);
                return next;
            });
        }

        return true;
    }, [currentUser, wishlistedRooms]);

    return {
        wishlistedMesses,
        wishlistedRooms,
        toggleMessWishlist,
        toggleRoomWishlist,
        isMessWishlisted: (id) => wishlistedMesses.has(id),
        isRoomWishlisted: (id) => wishlistedRooms.has(id),
        totalCount: wishlistedMesses.size + wishlistedRooms.size,
        loading,
    };
};
