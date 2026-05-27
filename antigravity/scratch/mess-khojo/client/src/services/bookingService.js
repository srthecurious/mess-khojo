import { collection, doc, query, where, addDoc, updateDoc, deleteDoc, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Watch bookings in real-time, ordered by creation date descending.
 */
export const watchBookings = (callback) => {
    const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const bookingsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
        callback(bookingsData);
    }, (error) => {
        console.error('Error in watchBookings service:', error);
    });
};

/**
 * Watch bookings for a specific mess.
 */
export const watchBookingsByMess = (messId, callback) => {
    const q = query(collection(db, 'bookings'), where('messId', '==', messId));
    return onSnapshot(q, (snapshot) => {
        const bookingsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
        bookingsData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        callback(bookingsData);
    }, (error) => {
        console.error('Error in watchBookingsByMess service:', error);
    });
};

/**
 * Watch mess claims in real-time.
 */
export const watchClaims = (callback) => {
    return onSnapshot(collection(db, 'claims'), (snapshot) => {
        const claimsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
        callback(claimsData);
    }, (error) => {
        console.error('Error in watchClaims service:', error);
    });
};

/**
 * Watch inquiries in real-time.
 */
export const watchInquiries = (callback) => {
    return onSnapshot(collection(db, 'inquiries'), (snapshot) => {
        const inquiriesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
        callback(inquiriesData);
    }, (error) => {
        console.error('Error in watchInquiries service:', error);
    });
};

/**
 * Watch room inquiries in real-time.
 */
export const watchRoomInquiries = (callback) => {
    return onSnapshot(collection(db, 'room_inquiries'), (snapshot) => {
        const roomInquiriesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
        callback(roomInquiriesData);
    }, (error) => {
        console.error('Error in watchRoomInquiries service:', error);
    });
};

/**
 * Watch feedback messages in real-time.
 */
export const watchFeedbacks = (callback) => {
    return onSnapshot(collection(db, 'feedbacks'), (snapshot) => {
        const feedbacksData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
        callback(feedbacksData);
    }, (error) => {
        console.error('Error in watchFeedbacks service:', error);
    });
};

/**
 * Watch partner/mess registrations.
 */
export const watchMessRegistrations = (callback) => {
    return onSnapshot(collection(db, 'mess_registrations'), (snapshot) => {
        const registrationsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
        callback(registrationsData);
    }, (error) => {
        console.error('Error in watchMessRegistrations service:', error);
    });
};

/**
 * Add a new room booking document.
 */
export const addBooking = (data) => addDoc(collection(db, 'bookings'), data);

/**
 * Add a new mess claim request.
 */
export const addClaim = (data) => addDoc(collection(db, 'claims'), data);

/**
 * Add a new general mess inquiry.
 */
export const addInquiry = (data) => addDoc(collection(db, 'inquiries'), data);

/**
 * Add a new room inquiry.
 */
export const addRoomInquiry = (data) => addDoc(collection(db, 'room_inquiries'), data);

/**
 * Add a feedback document.
 */
export const addFeedback = (data) => addDoc(collection(db, 'feedbacks'), data);

/**
 * Add a partner/mess registration document.
 */
export const addMessRegistration = (data) => addDoc(collection(db, 'mess_registrations'), data);

/**
 * Update an existing booking.
 */
export const updateBookingStatus = (id, data) => updateDoc(doc(db, 'bookings', id), data);

/**
 * Update a claim.
 */
export const updateClaimStatus = (id, data) => updateDoc(doc(db, 'claims', id), data);

/**
 * Update a general inquiry.
 */
export const updateInquiryStatus = (id, data) => updateDoc(doc(db, 'inquiries', id), data);

/**
 * Update a room inquiry.
 */
export const updateRoomInquiryStatus = (id, data) => updateDoc(doc(db, 'room_inquiries', id), data);

/**
 * Update feedback.
 */
export const updateFeedbackStatus = (id, data) => updateDoc(doc(db, 'feedbacks', id), data);

/**
 * Update a partner/mess registration.
 */
export const updateRegistrationStatus = (id, data) => updateDoc(doc(db, 'mess_registrations', id), data);

/**
 * Watch all banner ads for admin dashboard.
 */
export const watchHeroAds = (section, callback) => {
    const q = query(collection(db, `hero_ads_${section}`));
    return onSnapshot(q, (snapshot) => {
        const adsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
        callback(adsData);
    }, (error) => {
        console.error(`Error in watchHeroAds service for ${section}:`, error);
    });
};

/**
 * Watch active banner ads ordered by standard weight.
 */
export const watchActiveHeroAds = (section, callback) => {
    const q = query(collection(db, `hero_ads_${section}`), where('active', '==', true), orderBy('order', 'asc'));
    return onSnapshot(q, (snapshot) => {
        const adsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
        callback(adsData);
    }, (error) => {
        console.error(`Error in watchActiveHeroAds service for ${section}:`, error);
    });
};

/**
 * Update a hero ad banner metadata.
 */
export const updateHeroAd = (section, id, data) => updateDoc(doc(db, `hero_ads_${section}`, id), data);

/**
 * Delete a hero ad banner.
 */
export const deleteHeroAd = (section, id) => deleteDoc(doc(db, `hero_ads_${section}`, id));
