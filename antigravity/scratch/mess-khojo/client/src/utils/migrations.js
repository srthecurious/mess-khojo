import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export const backfillRoomDistricts = async () => {
    try {
        console.log('Starting Room District Backfill...');
        // 1. Fetch all messes
        const messesSnap = await getDocs(collection(db, 'messes'));
        const messDistricts = {};
        messesSnap.forEach(snap => {
            const data = snap.data();
            // Default to balasore if missing, based on legacy logic
            messDistricts[snap.id] = data.district || 'balasore';
        });

        // 2. Fetch all rooms
        const roomsSnap = await getDocs(collection(db, 'rooms'));
        let updatedCount = 0;

        // 3. Update rooms that are missing the district or have the wrong one
        const updatePromises = [];
        roomsSnap.forEach(snap => {
            const roomData = snap.data();
            const messId = roomData.messId;
            const correctDistrict = messDistricts[messId];

            if (correctDistrict && roomData.district !== correctDistrict) {
                const roomRef = doc(db, 'rooms', snap.id);
                updatePromises.push(
                    updateDoc(roomRef, { district: correctDistrict })
                );
                updatedCount++;
            }
        });

        await Promise.all(updatePromises);
        console.log(`Backfill complete. Updated ${updatedCount} rooms.`);
        return { success: true, count: updatedCount };
    } catch (error) {
        console.error('Error in backfillRoomDistricts:', error);
        return { success: false, error };
    }
};
