import { useState, useEffect } from 'react';
import { watchMesses, watchRooms } from '../services/messService';

// Module-level in-memory cache to eliminate duplicate network reads when switching pages/tabs
const districtCache = new Map();

/**
 * useMesses — fetches messes and rooms from Firestore, filtered by district.
 * Uses district-scoped Firestore queries and in-memory caching to minimize Firebase read costs.
 */
const useMesses = (selectedDistrict) => {
    const cacheKey = selectedDistrict || 'all';
    const cached = districtCache.get(cacheKey);

    const [messes, setMesses] = useState(() => cached?.messes || []);
    const [rooms, setRooms] = useState(() => cached?.rooms || []);
    const [loading, setLoading] = useState(() => !cached);

    useEffect(() => {
        let currentMesses = districtCache.get(cacheKey)?.messes || [];
        let currentRooms = districtCache.get(cacheKey)?.rooms || [];

        // Fetch Messes filtered by district
        const unsubscribeMesses = watchMesses(
            selectedDistrict,
            (messesData) => {
                let filtered = messesData;
                if (selectedDistrict && selectedDistrict !== 'all') {
                    const normDist = selectedDistrict.toLowerCase();
                    filtered = messesData.filter(m => 
                        (m.district && m.district.toLowerCase() === normDist) || 
                        (!m.district && normDist === 'balasore')
                    );
                }
                currentMesses = filtered;
                districtCache.set(cacheKey, { messes: currentMesses, rooms: currentRooms, timestamp: Date.now() });
                setMesses(filtered);
            }
        );

        // Fetch Rooms filtered by district (drastically reduces document reads)
        const unsubscribeRooms = watchRooms(
            selectedDistrict,
            (roomsData) => {
                let filtered = roomsData;
                if (selectedDistrict && selectedDistrict !== 'all') {
                    const normDist = selectedDistrict.toLowerCase();
                    filtered = roomsData.filter(r => 
                        (r.district && r.district.toLowerCase() === normDist) || 
                        (!r.district && normDist === 'balasore')
                    );
                }
                currentRooms = filtered;
                districtCache.set(cacheKey, { messes: currentMesses, rooms: currentRooms, timestamp: Date.now() });
                setRooms(filtered);
                setLoading(false);
            }
        );

        return () => {
            unsubscribeMesses();
            unsubscribeRooms();
        };
    }, [selectedDistrict, cacheKey]);

    return { messes, rooms, loading };
};

export default useMesses;
