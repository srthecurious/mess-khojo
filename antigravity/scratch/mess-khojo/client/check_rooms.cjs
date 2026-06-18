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
    console.log("Checking rooms...");
    const roomSnap = await getDocs(collection(db, 'rooms'));
    console.log(`Total room docs in Firestore: ${roomSnap.size}`);
    
    let missingMessId = 0;
    let missingDistrict = 0;
    let otherProblems = 0;
    const districts = {};
    
    roomSnap.docs.forEach(doc => {
        const data = doc.data();
        if (!data.messId) missingMessId++;
        if (!data.district) missingDistrict++;
        if (data.district) {
            districts[data.district] = (districts[data.district] || 0) + 1;
        }
    });

    console.log("Stats:");
    console.log(`- Missing messId: ${missingMessId}`);
    console.log(`- Missing district: ${missingDistrict}`);
    console.log("- District distribution of room documents:", districts);
}

checkRooms()
    .then(() => process.exit(0))
    .catch(err => {
        console.error("Check failed:", err);
        process.exit(1);
    });
