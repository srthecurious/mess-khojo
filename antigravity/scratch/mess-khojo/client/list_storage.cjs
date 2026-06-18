const { initializeApp } = require('firebase/app');
const { getStorage, ref, listAll } = require('firebase/storage');

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

async function listDir(dirPath) {
    const dirRef = ref(storage, dirPath);
    console.log(`Listing directory: "${dirPath}"`);
    try {
        const res = await listAll(dirRef);
        res.prefixes.forEach((folderRef) => {
            console.log(`  Folder: ${folderRef.fullPath}`);
        });
        res.items.forEach((itemRef) => {
            console.log(`  File: ${itemRef.fullPath}`);
        });
        
        // Recursively list folders
        for (const folderRef of res.prefixes) {
            await listDir(folderRef.fullPath);
        }
    } catch (e) {
        console.error(`Error listing "${dirPath}": ${e.message}`);
    }
}

async function run() {
    await listDir('');
    process.exit(0);
}

run().catch(console.error);
