import { useState, useEffect, useRef } from 'react';
import { onSnapshot } from 'firebase/firestore';

/**
 * Generic hook for real-time Firestore collection/query subscriptions.
 * Replaces ~50+ lines of repeated boilerplate per collection.
 */
export function useFirestoreCollection(queryRef, options = {}) {
    const { transform, sortBy } = options;
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Keep function refs updated to prevent subscription restarts on every render
    const transformRef = useRef(transform);
    const sortByRef = useRef(sortBy);

    useEffect(() => {
        transformRef.current = transform;
        sortByRef.current = sortBy;
    });

    useEffect(() => {
        if (!queryRef) return;
        const unsubscribe = onSnapshot(queryRef,
            (snap) => {
                let result;
                if (snap.docs) {
                    // It's a QuerySnapshot
                    result = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    if (sortByRef.current) result.sort(sortByRef.current);
                } else {
                    // It's a DocumentSnapshot
                    result = snap.exists() ? { id: snap.id, ...snap.data() } : null;
                }
                
                if (transformRef.current) result = transformRef.current(result);
                setData(result);
                setLoading(false);
            },
            (err) => {
                setError(err);
                setLoading(false);
                console.error('[useFirestoreCollection]', err);
            }
        );
        return unsubscribe;
    }, [queryRef]); // In theory queryRef should be stable or wrapped in useMemo by consumer

    return { data, loading, error };
}

