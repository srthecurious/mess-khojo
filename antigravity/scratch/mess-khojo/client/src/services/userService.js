import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Fetch a user document directly by UID.
 */
export const getUserDoc = (uid) => getDoc(doc(db, 'users', uid));

/**
 * Listen to real-time updates for a specific user's document.
 */
export const watchUserDoc = (uid, callback) => {
    return onSnapshot(doc(db, 'users', uid), (snapshot) => {
        if (snapshot.exists()) {
            callback({ id: snapshot.id, ...snapshot.data() });
        } else {
            callback(null);
        }
    }, (error) => {
        console.error('Error in watchUserDoc service:', error);
    });
};

/**
 * Update user profile details.
 */
export const updateUserDoc = (uid, data) => updateDoc(doc(db, 'users', uid), data);
