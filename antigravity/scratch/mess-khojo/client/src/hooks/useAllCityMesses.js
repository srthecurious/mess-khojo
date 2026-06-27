import { useState, useEffect, useMemo } from 'react';
import { watchMesses, watchRooms } from '../services/messService';

/**
 * useAllCityMesses — fetches all messes and rooms, enriches messes with image count
 * and pricing range, groups them by city, and sorts them by default ranking criteria.
 */
const useAllCityMesses = () => {
    const [messes, setMesses] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch all messes
        const unsubscribeMesses = watchMesses((messesData) => {
            setMesses(messesData);
        });

        // Fetch all rooms
        const unsubscribeRooms = watchRooms(null, (roomsData) => {
            setRooms(roomsData);
            setLoading(false);
        });

        return () => {
            unsubscribeMesses();
            unsubscribeRooms();
        };
    }, []);

    // Process, enrich, group, and sort messes by city
    const processData = () => {
        // Filter out hidden messes
        const activeMesses = messes.filter(m => !m.hidden);

        // Enrich messes with rooms data
        const enrichedMesses = activeMesses.map(mess => {
            const messRooms = rooms.filter(room => room.messId === mess.id);

            // Calculate Total Images (Mess Gallery + Room Images)
            let totalImages = 0;
            if (Array.isArray(mess.galleryUrls)) {
                totalImages += mess.galleryUrls.filter(url => url && typeof url === 'string' && url.length > 10 && !url.includes('placeholder')).length;
            } else if (Array.isArray(mess.images)) {
                totalImages += mess.images.filter(url => url && typeof url === 'string' && url.length > 10 && !url.includes('placeholder')).length;
            }
            messRooms.forEach(room => {
                if (Array.isArray(room.imageUrls)) {
                    totalImages += room.imageUrls.filter(url => url && typeof url === 'string' && url.length > 10 && !url.includes('placeholder')).length;
                } else if (room.imageUrl && typeof room.imageUrl === 'string' && room.imageUrl.length > 10 && !room.imageUrl.includes('placeholder')) {
                    totalImages += 1;
                }
            });

            // Calculate Price Range
            const prices = messRooms.map(r => Number(r.price || r.rent)).filter(p => !isNaN(p) && p > 0);
            const minPrice = prices.length ? Math.min(...prices) : null;
            const maxPrice = prices.length ? Math.max(...prices) : null;

            return {
                ...mess,
                minPrice,
                maxPrice,
                totalImages
            };
        });

        // Group messes by city
        const groups = {};
        enrichedMesses.forEach(mess => {
            // Trim and convert to lowercase just to be safe
            const city = mess.city ? mess.city.trim().toLowerCase() : 'other';
            if (!groups[city]) {
                groups[city] = [];
            }
            groups[city].push(mess);
        });

        // Sort messes inside each city group using default ranking logic
        // verified -> not user sourced -> verified poster -> images count -> alphabetical name
        Object.keys(groups).forEach(city => {
            groups[city].sort((a, b) => {
                // Priority 1: Verified listings first
                const isVerifiedA = !!a.isVerified;
                const isVerifiedB = !!b.isVerified;
                if (isVerifiedA !== isVerifiedB) return isVerifiedB ? 1 : -1;

                // Priority 2: User sourced listings last
                const isUserSourcedA = !!a.isUserSourced;
                const isUserSourcedB = !!b.isUserSourced;
                if (isUserSourcedA !== isUserSourcedB) return isUserSourcedA ? 1 : -1;

                // Priority 3: Verified poster
                const hasPosterA = !!a.posterUrl && a.posterUrl.length > 5;
                const hasPosterB = !!b.posterUrl && b.posterUrl.length > 5;
                if (hasPosterA !== hasPosterB) return hasPosterB ? 1 : -1;

                // Priority 4: Image count
                if (a.totalImages !== b.totalImages) return b.totalImages - a.totalImages;

                // Priority 5: Alphabetical name
                return (a.name || '').localeCompare(b.name || '');
            });
        });

        return {
            messesByCity: groups,
            allMesses: enrichedMesses
        };
    };

    const { messesByCity, allMesses } = useMemo(
        () => processData(),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [messes, rooms]
    );

    return {
        messesByCity,
        allMesses,
        rooms,
        loading
    };
};

export default useAllCityMesses;
