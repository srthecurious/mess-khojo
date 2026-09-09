const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, writeBatch } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: "AIzaSyBAG3Sqh_W8IMy7FAuq-MKHCJANF3An9Fw",
    authDomain: "mess-khojo-ag.firebaseapp.com",
    projectId: "mess-khojo-ag",
    storageBucket: "mess-khojo-ag.firebasestorage.app",
    messagingSenderId: "746163731012",
    appId: "1:746163731012:web:f6b8f2f3a8b0c8c2161a11",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const isDryRun = process.argv.includes('--dry-run');

function determineManagedBy(data) {
    if (data.managedBy) {
        return data.managedBy;
    }
    
    if (data.foodFacility) {
        const ff = data.foodFacility.toLowerCase();
        if (ff.includes('student')) return 'Students';
        if (ff.includes('warden')) return 'Warden';
        if (ff.includes('owner') || ff.includes('canteen') || ff.includes('fssai') || ff.includes('rent')) return 'Owner';
        if (ff.includes('no food') || ff.includes('not available')) return 'None';
    }
    
    if (data.foodAvailability === 'No Food') return 'None';
    if (data.foodAvailability === 'Self Cook') return 'Students';
    
    return 'Owner';
}

async function run() {
    console.log(`Starting backfill... [Mode: ${isDryRun ? 'DRY-RUN (No writes)' : 'LIVE EXECUTION'}]`);
    const snap = await getDocs(collection(db, 'messes'));
    console.log(`Total mess documents in Firestore: ${snap.size}`);
    
    const updates = [];
    const counts = {};
    
    snap.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (!data.managedBy) {
            const calculated = determineManagedBy(data);
            updates.push({
                id: docSnap.id,
                name: data.name,
                foodFacility: data.foodFacility,
                managedBy: calculated
            });
            counts[calculated] = (counts[calculated] || 0) + 1;
        }
    });

    console.log(`Messes requiring backfill: ${updates.length}`);
    console.log('Planned assignments by category:', counts);
    console.log('Sample updates (first 5):', JSON.stringify(updates.slice(0, 5), null, 2));

    if (isDryRun) {
        console.log('Dry run complete. No changes made to Firestore.');
        process.exit(0);
    }

    if (updates.length === 0) {
        console.log('No updates required.');
        process.exit(0);
    }

    // Batch write in chunks of 400 (Firestore allows up to 500 per batch)
    const chunkSize = 400;
    for (let i = 0; i < updates.length; i += chunkSize) {
        const chunk = updates.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        chunk.forEach(item => {
            const ref = doc(db, 'messes', item.id);
            batch.update(ref, { managedBy: item.managedBy });
        });
        await batch.commit();
        console.log(`Committed batch of ${chunk.length} updates.`);
    }

    console.log('Successfully backfilled all mess documents!');
    process.exit(0);
}

run().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
