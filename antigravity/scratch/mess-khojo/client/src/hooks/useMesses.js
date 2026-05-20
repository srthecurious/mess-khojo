import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * useMesses — fetches messes and rooms from Firestore, filtered by district.
 * Messes are filtered server-side via a Firestore where() clause.
 * Rooms are fetched separately for the "available only" filter feature.
 */
const useMesses = (selectedDistrict) => {
    const [messes, setMesses] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);

        // Fetch Messes — client-side filtering to handle legacy messes that don't have a district field
        const unsubscribeMesses = onSnapshot(
            collection(db, 'messes'),
            (snapshot) => {
                let messesData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                // Client-side filter to handle legacy messes gracefully
                if (selectedDistrict) {
                    messesData = messesData.filter(m => 
                        m.district === selectedDistrict || (!m.district && selectedDistrict === 'balasore')
                    );
                }

                setMesses(messesData);
            },
            (error) => {
                console.error('Error fetching messes:', error);
                setLoading(false);
            }
        );

        // Fetch Rooms — needed for available-only filter and price range display
        const unsubscribeRooms = onSnapshot(
            collection(db, 'rooms'),
            (snapshot) => {
                const roomsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setRooms(roomsData);
                setLoading(false);
            },
            (error) => {
                console.error('Error fetching rooms:', error);
                setLoading(false);
            }
        );

        return () => {
            unsubscribeMesses();
            unsubscribeRooms();
        };
    }, [selectedDistrict]);

    return { messes, rooms, loading };
};

export default useMesses;
