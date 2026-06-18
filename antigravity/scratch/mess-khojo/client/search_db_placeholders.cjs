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
    console.log("Searching messes...");
    const messesCol = collection(db, 'messes');
    const messesSnap = await getDocs(messesCol);
    messesSnap.docs.forEach(doc => {
        const data = doc.data();
        if (data.posterUrl && data.posterUrl.includes('placeholder')) {
            console.log(`Mess: ${doc.id} posterUrl: ${data.posterUrl}`);
        }
        if (data.galleryUrls) {
            data.galleryUrls.forEach(url => {
                if (url && url.includes('placeholder')) {
                    console.log(`Mess: ${doc.id} gallery: ${url}`);
                }
            });
        }
    });

    console.log("Searching rooms...");
    const roomsCol = collection(db, 'rooms');
    const roomsSnap = await getDocs(roomsCol);
    roomsSnap.docs.forEach(doc => {
        const data = doc.data();
        if (data.imageUrl && data.imageUrl.includes('placeholder')) {
            console.log(`Room: ${doc.id} imageUrl: ${data.imageUrl}`);
        }
        if (data.imageUrls) {
            data.imageUrls.forEach(url => {
                if (url && url.includes('placeholder')) {
                    console.log(`Room: ${doc.id} imageUrls: ${url}`);
                }
            });
        }
    });

    console.log("Done.");
    process.exit(0);
}

run().catch(console.error);
