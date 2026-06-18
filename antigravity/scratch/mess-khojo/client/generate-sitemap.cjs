const fs = require('fs');
const path = require('path');
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

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const BASE_URL = 'https://messkhojo.com';

function toMessSlug(name, id) {
    if (!name || !id) return id || '';
    const base = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-{2,}/g, '-');
    const suffix = id.slice(0, 4);
    return `${base}-${suffix}`;
}

function toRoomSlug(occupancy, id) {
    if (!occupancy || !id) return id || '';
    const base = (occupancy || 'room')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
    const suffix = id.slice(0, 4);
    return `${base}-seater-${suffix}`;
}

function escapeXml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function formatDate(date) {
    if (!date) return new Date().toISOString().split('T')[0];
    if (date.toDate) {
        return date.toDate().toISOString().split('T')[0];
    }
    return new Date(date).toISOString().split('T')[0];
}

function generateUrlEntry(loc, lastmod, changefreq, priority) {
    return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>\n`;
}

function getTieredPriorityAndFreq(lastmodStr, baseHigh, baseLow) {
    try {
        const lastmodDate = new Date(lastmodStr);
        if (isNaN(lastmodDate.getTime())) {
            return { priority: baseHigh, changefreq: 'weekly' };
        }
        const days = (Date.now() - lastmodDate.getTime()) / 86400000;
        if (days < 30) {
            return { priority: baseHigh, changefreq: 'weekly' };
        }
        if (days > 90) {
            return { priority: baseLow, changefreq: 'monthly' };
        }
        // Between 30 and 90 days, middle priority
        const mid = ((parseFloat(baseHigh) + parseFloat(baseLow)) / 2).toFixed(1);
        return { priority: mid, changefreq: 'weekly' };
    } catch (e) {
        return { priority: baseHigh, changefreq: 'weekly' };
    }
}

async function generateSitemap() {
    console.log("Generating split sitemaps...");
    const today = new Date().toISOString().split('T')[0];

    // 1. Generate sitemap-static.xml
    let staticXml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    staticXml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    staticXml += '  <!-- City Landing Page & Static Pages -->\n';

    const staticPages = [
        { path: '/', priority: '1.0', changefreq: 'daily' }, // City Landing Page
        { path: '/register-mess', priority: '0.8', changefreq: 'monthly' },
        { path: '/find-your-room', priority: '0.8', changefreq: 'monthly' },
        { path: '/explorer', priority: '0.9', changefreq: 'weekly' },
        { path: '/about-us', priority: '0.7', changefreq: 'yearly' },
        { path: '/wishlist', priority: '0.8', changefreq: 'monthly' },
        { path: '/privacy-policy', priority: '0.7', changefreq: 'yearly' },
        { path: '/terms-and-conditions', priority: '0.7', changefreq: 'yearly' },
    ];


    staticPages.forEach(page => {
        staticXml += generateUrlEntry(`${BASE_URL}${page.path}`, today, page.changefreq, page.priority);
    });
    staticXml += '</urlset>\n';

    const staticPath = path.join(__dirname, 'public', 'sitemap-static.xml');
    fs.writeFileSync(staticPath, staticXml, 'utf8');
    console.log(`Static sitemap written to ${staticPath}`);

    // 2. Generate sitemap-cities.xml
    let citiesXml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    citiesXml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    citiesXml += '  <!-- City Pages -->\n';

    const cities = [
        { path: '/district/balasore/city/baleshwar', priority: '0.9', changefreq: 'daily' },
        { path: '/district/balasore/city/remuna', priority: '0.9', changefreq: 'daily' },
        { path: '/district/bhadrak/city/bhadrak', priority: '0.9', changefreq: 'daily' },
        { path: '/district/bhadrak/city/basudevpur', priority: '0.9', changefreq: 'daily' },
        { path: '/district/mayurbhanj/city/baripada', priority: '0.9', changefreq: 'daily' },
    ];

    cities.forEach(city => {
        citiesXml += generateUrlEntry(`${BASE_URL}${city.path}`, today, city.changefreq, city.priority);
    });
    citiesXml += '</urlset>\n';

    const citiesPath = path.join(__dirname, 'public', 'sitemap-cities.xml');
    fs.writeFileSync(citiesPath, citiesXml, 'utf8');
    console.log(`Cities sitemap written to ${citiesPath}`);

    // 3. Fetch messes and rooms
    const messMap = new Map();
    let messXmlContent = '';
    let roomXmlContent = '';
    let latestMessDate = today;
    let latestRoomDate = today;

    try {
        console.log("Fetching messes from Firestore...");
        const messSnap = await getDocs(collection(db, 'messes'));
        messSnap.docs.forEach(doc => {
            const data = doc.data();
            
            // Name guard
            if (!data.name || data.name.trim() === '') {
                console.warn(`Skipping mess ${doc.id} — missing name`);
                return;
            }

            messMap.set(doc.id, { id: doc.id, name: data.name });
            const lastmod = formatDate(data.updatedAt || data.createdAt);
            if (lastmod > latestMessDate) {
                latestMessDate = lastmod;
            }

            const slug = toMessSlug(data.name, doc.id);
            const tiered = getTieredPriorityAndFreq(lastmod, '0.9', '0.7');
            messXmlContent += generateUrlEntry(`${BASE_URL}/mess/${slug}`, lastmod, tiered.changefreq, tiered.priority);
        });
        console.log(`Loaded ${messSnap.size} messes.`);
    } catch (err) {
        console.error("Error fetching messes:", err);
    }

    try {
        console.log("Fetching rooms from Firestore...");
        const roomSnap = await getDocs(collection(db, 'rooms'));
        roomSnap.docs.forEach(doc => {
            const data = doc.data();
            const mess = messMap.get(data.messId);
            
            // Mess guard
            if (!mess || !mess.name) {
                console.warn(`Skipping room ${doc.id} — parent mess not found or missing name`);
                return;
            }

            const lastmod = formatDate(data.updatedAt || data.createdAt);
            if (lastmod > latestRoomDate) {
                latestRoomDate = lastmod;
            }

            const messSlug = toMessSlug(mess.name, mess.id);
            const roomSlug = toRoomSlug(data.occupancy, doc.id);
            const tiered = getTieredPriorityAndFreq(lastmod, '0.8', '0.6');
            
            roomXmlContent += generateUrlEntry(`${BASE_URL}/room/${messSlug}/${roomSlug}`, lastmod, tiered.changefreq, tiered.priority);
        });
        console.log(`Loaded ${roomSnap.size} rooms.`);
    } catch (err) {
        console.error("Error fetching rooms:", err);
    }

    // 4. Generate sitemap-messes.xml
    let messXml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    messXml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    messXml += '  <!-- Mess Detail Pages -->\n';
    messXml += messXmlContent;
    messXml += '</urlset>\n';

    const messesPath = path.join(__dirname, 'public', 'sitemap-messes.xml');
    fs.writeFileSync(messesPath, messXml, 'utf8');
    console.log(`Messes sitemap written to ${messesPath}`);

    // 5. Generate sitemap-rooms.xml
    let roomXml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    roomXml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    roomXml += '  <!-- Room Detail Pages -->\n';
    roomXml += roomXmlContent;
    roomXml += '</urlset>\n';

    const roomsPath = path.join(__dirname, 'public', 'sitemap-rooms.xml');
    fs.writeFileSync(roomsPath, roomXml, 'utf8');
    console.log(`Rooms sitemap written to ${roomsPath}`);

    // 6. Generate sitemap.xml (Sitemap Index)
    let indexXml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    indexXml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    indexXml += `  <sitemap>
    <loc>${BASE_URL}/sitemap-static.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>\n`;

    indexXml += `  <sitemap>
    <loc>${BASE_URL}/sitemap-cities.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>\n`;

    indexXml += `  <sitemap>
    <loc>${BASE_URL}/sitemap-messes.xml</loc>
    <lastmod>${latestMessDate}</lastmod>
  </sitemap>\n`;

    indexXml += `  <sitemap>
    <loc>${BASE_URL}/sitemap-rooms.xml</loc>
    <lastmod>${latestRoomDate}</lastmod>
  </sitemap>\n`;

    indexXml += '</sitemapindex>\n';

    const indexPath = path.join(__dirname, 'public', 'sitemap.xml');
    fs.writeFileSync(indexPath, indexXml, 'utf8');
    console.log(`Sitemap index written to ${indexPath}`);
}

generateSitemap()
    .then(() => process.exit(0))
    .catch(err => {
        console.error("Sitemap generation failed:", err);
        process.exit(1);
    });
