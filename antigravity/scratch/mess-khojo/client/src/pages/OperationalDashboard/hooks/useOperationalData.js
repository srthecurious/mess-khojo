import { useMemo } from 'react';
import { collection, query } from 'firebase/firestore';

import { db } from '../../../firebase';
import { useFirestoreCollection } from '../../../hooks/useFirestoreCollection';

export function useOperationalData() {
    const { data: bookings } = useFirestoreCollection(
        useMemo(() => query(collection(db, 'bookings')), []),
        { sortBy: (a, b) => b.createdAt?.seconds - a.createdAt?.seconds }
    );

    const { data: claims } = useFirestoreCollection(
        useMemo(() => query(collection(db, 'claims')), []),
        { sortBy: (a, b) => b.createdAt?.seconds - a.createdAt?.seconds }
    );

    const { data: inquiries } = useFirestoreCollection(
        useMemo(() => query(collection(db, 'inquiries')), []),
        { sortBy: (a, b) => b.createdAt?.seconds - a.createdAt?.seconds }
    );

    const { data: roomInquiries } = useFirestoreCollection(
        useMemo(() => query(collection(db, 'room_inquiries')), []),
        { sortBy: (a, b) => b.createdAt?.seconds - a.createdAt?.seconds }
    );

    const { data: feedbacks } = useFirestoreCollection(
        useMemo(() => query(collection(db, 'feedbacks')), []),
        { sortBy: (a, b) => b.createdAt?.seconds - a.createdAt?.seconds }
    );

    const { data: registrations } = useFirestoreCollection(
        useMemo(() => query(collection(db, 'mess_registrations')), []),
        { sortBy: (a, b) => b.createdAt?.seconds - a.createdAt?.seconds }
    );

    const { data: messes } = useFirestoreCollection(
        useMemo(() => query(collection(db, 'messes')), []),
        { sortBy: (a, b) => (a.name || a.messName || '').localeCompare(b.name || b.messName || '') }
    );

    const { data: rooms } = useFirestoreCollection(
        useMemo(() => query(collection(db, 'rooms')), [])
    );

    return {
        bookings,
        claims,
        inquiries,
        roomInquiries,
        feedbacks,
        registrations,
        messes,
        rooms
    };
}

