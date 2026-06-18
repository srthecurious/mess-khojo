const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

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

async function checkRooms() {
    console.log("Checking rooms mess mapping...");
    const messSnap = await getDocs(collection(db, 'messes'));
    const messes = messSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    console.log(`Total messes: ${messes.length}`);

    const roomSnap = await getDocs(collection(db, 'rooms'));
    const rooms = roomSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    console.log(`Total rooms: ${rooms.length}`);

    let missingMessInMesses = 0;
    rooms.forEach(r => {
        const mess = messes.find(m => m.id === r.messId);
        if (!mess) {
            missingMessInMesses++;
        }
    });

    console.log(`Rooms with messId NOT found in messes: ${missingMessInMesses}`);
}

checkRooms()
    .then(() => process.exit(0))
    .catch(err => {
        console.error("Check failed:", err);
        process.exit(1);
    });
