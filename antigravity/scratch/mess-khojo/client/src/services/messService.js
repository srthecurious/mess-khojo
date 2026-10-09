import { collection, doc, query, where, getDoc, getDocs, addDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Fetch a single mess document.
 */
export const getMess = (messId) => getDoc(doc(db, 'messes', messId));

/**
 * Watch messes in real-time, optionally filtered by district to minimize Firestore reads.
 */
export const watchMesses = (selectedDistrict, callback) => {
    let cb = callback;
    let district = selectedDistrict;
    if (typeof selectedDistrict === 'function') {
        cb = selectedDistrict;
        district = null;
    }

    let messQuery = collection(db, 'messes');
    // Note: Legacy messes in Firestore without a district field implicitly belong to Balasore.
    // Firestore `where('district', '==', ...)` drops documents that don't have the field.
    // For specific non-balasore districts (bhadrak, mayurbhanj, jajpur, khorda), use server filter to reduce read costs.
    // For 'balasore' or 'all', query all and filter client-side to preserve legacy listings.
    if (district && district !== 'all' && district !== 'balasore') {
        messQuery = query(collection(db, 'messes'), where('district', '==', district));
    }

    return onSnapshot(messQuery, (snapshot) => {
        const messesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
        if (cb) cb(messesData);
    }, (error) => {
        console.error('Error in watchMesses service:', error);
    });
};

/**
 * Watch rooms in real-time, filtered by district.
 */
export const watchRooms = (selectedDistrict, callback) => {
    let roomQuery = collection(db, 'rooms');
    // Note: 434 legacy rooms in Firestore do not have district set on them, belonging to Balasore.
    // Using server-side where('district', '==', 'balasore') drops all 434 legacy rooms.
    // For other districts, filter server-side to save Firebase cost. For Balasore/all, filter client-side.
    if (selectedDistrict && selectedDistrict !== 'all' && selectedDistrict !== 'balasore') {
        roomQuery = query(collection(db, 'rooms'), where('district', '==', selectedDistrict));
    }
    return onSnapshot(roomQuery, (snapshot) => {
        const roomsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
        callback(roomsData);
    }, (error) => {
        console.error('Error in watchRooms service:', error);
    });
};

/**
 * Watch rooms for a specific mess.
 */
export const watchRoomsByMess = (messId, callback) => {
    const q = query(collection(db, 'rooms'), where('messId', '==', messId));
    return onSnapshot(q, (snapshot) => {
        const roomsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
        callback(roomsData);
    }, (error) => {
        console.error('Error in watchRoomsByMess service:', error);
    });
};

/**
 * Watch mess profile owned by a specific admin user ID.
 */
export const watchMessByAdmin = (adminId, callback) => {
    const q = query(collection(db, 'messes'), where('adminId', '==', adminId));
    return onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
            callback({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
        } else {
            callback(null);
        }
    }, (error) => {
        console.error('Error in watchMessByAdmin service:', error);
    });
};

/**
 * Update a specific mess document.
 */
export const updateMess = (messId, data) => updateDoc(doc(db, 'messes', messId), data);

/**
 * Create a new mess document.
 */
export const addMess = (data) => addDoc(collection(db, 'messes'), data);

/**
 * Delete a mess document.
 */
export const deleteMess = (messId) => deleteDoc(doc(db, 'messes', messId));

/**
 * Create a new room document.
 */
export const addRoom = (data) => addDoc(collection(db, 'rooms'), data);

/**
 * Update a specific room document.
 */
export const updateRoom = (roomId, data) => updateDoc(doc(db, 'rooms', roomId), data);

/**
 * Delete a specific room document.
 */
export const deleteRoom = (roomId) => deleteDoc(doc(db, 'rooms', roomId));

/**
 * Get all messes (one-time read).
 */
export const getMesses = () => getDocs(collection(db, 'messes'));

/**
 * Get all rooms (one-time read).
 */
export const getRooms = () => getDocs(collection(db, 'rooms'));
