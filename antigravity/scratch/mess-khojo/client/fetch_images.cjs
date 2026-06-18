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

async function run() {
    console.log("Fetching messes...");
    const messesCol = collection(db, 'messes');
    const messesSnap = await getDocs(messesCol);
    console.log(`Found ${messesSnap.docs.length} messes.`);
    messesSnap.docs.forEach(doc => {
        const data = doc.data();
        if (data.posterUrl) {
            console.log(`Mess: ${data.name}, Poster: ${data.posterUrl}`);
        }
    });

    console.log("Fetching rooms...");
    const roomsCol = collection(db, 'rooms');
    const roomsSnap = await getDocs(roomsCol);
    console.log(`Found ${roomsSnap.docs.length} rooms.`);
    roomsSnap.docs.forEach(doc => {
        const data = doc.data();
        console.log(`Room: ${doc.id}, occupancy: ${data.occupancy}, imageUrls: ${JSON.stringify(data.imageUrls)}, imageUrl: ${data.imageUrl}`);
    });

    process.exit(0);
}

run().catch(console.error);
