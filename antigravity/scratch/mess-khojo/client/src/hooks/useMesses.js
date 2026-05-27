import { useState, useEffect } from 'react';
import { watchMesses, watchRooms } from '../services/messService';

/**
 * useMesses — fetches messes and rooms from Firestore, filtered by district.
 * Messes and rooms are fetched using the decoupled Firestore service layer.
 */
const useMesses = (selectedDistrict) => {
    const [messes, setMesses] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);

        // Fetch Messes using messService
        const unsubscribeMesses = watchMesses(
            (messesData) => {
                let filteredMesses = messesData;
                // Client-side filter to handle legacy messes gracefully
                if (selectedDistrict) {
                    filteredMesses = messesData.filter(m => 
                        m.district === selectedDistrict || (!m.district && selectedDistrict === 'balasore')
                    );
                }
                setMesses(filteredMesses);
            }
        );

        // Fetch Rooms using messService (retrieve all rooms to handle legacy room documents gracefully)
        const unsubscribeRooms = watchRooms(
            null,
            (roomsData) => {
                setRooms(roomsData);
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

