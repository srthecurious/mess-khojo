const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const fs = require('fs');
const path = require('path');

const firebaseConfig = {
    apiKey: "AIzaSyBAG3Sqh_W8IMy7FAuq-MKHCJANF3An9Fw",
    authDomain: "mess-khojo-ag.firebaseapp.com",
    projectId: "mess-khojo-ag",
    storageBucket: "mess-khojo-ag.firebasestorage.app",
    messagingSenderId: "746163731012",
    appId: "1:746163731012:web:f6b8f2f3a8b0c8c2161a11",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);

async function run() {
    const email = `temp_uploader_${Date.now()}@example.com`;
    const password = "TemporaryPassword123!";

    console.log(`Creating temporary user: ${email}...`);
    let userCredential;
    try {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log("Temporary user created and signed in.");
    } catch (e) {
        console.log("Create user failed, attempting login directly:", e.message);
        userCredential = await signInWithEmailAndPassword(auth, email, password);
    }

    const filePath = path.join(__dirname, 'public', 'default-room.jpg');
    console.log(`Reading file: ${filePath}...`);
    const fileBuffer = fs.readFileSync(filePath);

    console.log("Uploading file to Firebase Storage as 'default-room.jpg'...");
    const storageRef = ref(storage, 'default-room.jpg');
    
    // Metadata is required to specify content type
    const metadata = {
        contentType: 'image/jpeg',
    };

    const snapshot = await uploadBytes(storageRef, fileBuffer, metadata);
    console.log("Upload completed successfully!");

    const downloadUrl = await getDownloadURL(snapshot.ref);
    console.log(`Placeholder URL: ${downloadUrl}`);

    console.log("Logging out...");
    await auth.signOut();
    console.log("Done.");
    process.exit(0);
}

run().catch(e => {
    console.error("Upload error:", e);
    process.exit(1);
});
