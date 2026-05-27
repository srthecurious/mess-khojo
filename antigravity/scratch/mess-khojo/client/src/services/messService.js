import { collection, doc, query, where, getDoc, getDocs, addDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Fetch a single mess document.
 */
export const getMess = (messId) => getDoc(doc(db, 'messes', messId));

/**
 * Watch all messes in real-time.
 */
export const watchMesses = (callback) => {
    return onSnapshot(collection(db, 'messes'), (snapshot) => {
        const messesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
        callback(messesData);
    }, (error) => {
        console.error('Error in watchMesses service:', error);
    });
};

/**
 * Watch rooms in real-time, filtered by district.
 */
export const watchRooms = (selectedDistrict, callback) => {
    let roomQuery = collection(db, 'rooms');
    if (selectedDistrict && selectedDistrict !== 'all') {
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
