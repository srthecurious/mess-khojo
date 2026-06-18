const { initializeApp } = require('firebase/app');
const { getStorage, ref, getDownloadURL } = require('firebase/storage');

const firebaseConfig = {
    apiKey: "AIzaSyBAG3Sqh_W8IMy7FAuq-MKHCJANF3An9Fw",
    authDomain: "mess-khojo-ag.firebaseapp.com",
    projectId: "mess-khojo-ag",
    storageBucket: "mess-khojo-ag.firebasestorage.app",
    messagingSenderId: "746163731012",
    appId: "1:746163731012:web:f6b8f2f3a8b0c8c2161a11",
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

const candidates = [
    'default-room.jpg',
    '/default-room.jpg',
    'placeholder.jpg',
    'placeholder.png',
    'default.jpg',
    'default.png',
    'rooms/default-room.jpg',
    'rooms/placeholder.png',
    'messes/placeholder.png'
];

async function check() {
    for (const path of candidates) {
        try {
            const fileRef = ref(storage, path);
            const url = await getDownloadURL(fileRef);
            console.log(`✅ FOUND: "${path}" -> ${url}`);
        } catch (e) {
            console.log(`❌ NOT FOUND: "${path}" (${e.message})`);
        }
    }
    process.exit(0);
}

check().catch(console.error);
