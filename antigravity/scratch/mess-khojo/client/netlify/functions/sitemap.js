// Dynamic Sitemap Generator - Netlify Function
// Fetches all mess listings and room listings from Firestore and generates a complete sitemap

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin (only once)
if (!getApps().length) {
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
    if (projectId) {
        initializeApp({
            projectId: projectId,
        });
    }
}

const BASE_URL = 'https://messkhojo.com';

const STATIC_PAGES = [
    { path: '/', priority: '1.0', changefreq: 'daily' }, // City Landing Page
    { path: '/register-mess', priority: '0.8', changefreq: 'monthly' },
    { path: '/find-your-room', priority: '0.8', changefreq: 'monthly' },
    { path: '/explorer', priority: '0.9', changefreq: 'weekly' },
    { path: '/about-us', priority: '0.7', changefreq: 'yearly' },
    { path: '/wishlist', priority: '0.8', changefreq: 'monthly' },
    { path: '/privacy-policy', priority: '0.7', changefreq: 'yearly' },
    { path: '/terms-and-conditions', priority: '0.7', changefreq: 'yearly' },
];

const CITY_PAGES = [
    { path: '/district/balasore/city/baleshwar', priority: '0.9', changefreq: 'daily' },
    { path: '/district/balasore/city/remuna', priority: '0.9', changefreq: 'daily' },
    { path: '/district/bhadrak/city/bhadrak', priority: '0.9', changefreq: 'daily' },
    { path: '/district/bhadrak/city/basudevpur', priority: '0.9', changefreq: 'daily' },
    { path: '/district/mayurbhanj/city/baripada', priority: '0.9', changefreq: 'daily' },
];

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
    return `
  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
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
        const mid = ((parseFloat(baseHigh) + parseFloat(baseLow)) / 2).toFixed(1);
        return { priority: mid, changefreq: 'weekly' };
    } catch (e) {
        return { priority: baseHigh, changefreq: 'weekly' };
    }
}

export async function handler(event, context) {
    const today = new Date().toISOString().split('T')[0];
    
    // Get sitemap part from query parameters (defaults to sitemap index)
    const type = (event.queryStringParameters && event.queryStringParameters.type) || 'index';
    
    const headers = {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    };

    if (type === 'static') {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- City Landing Page & Static Pages -->${STATIC_PAGES.map(page =>
            generateUrlEntry(`${BASE_URL}${page.path}`, today, page.changefreq, page.priority)
        ).join('')}
</urlset>`;
        return { statusCode: 200, headers, body: xml };
    }

    if (type === 'cities') {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- City Pages -->${CITY_PAGES.map(city =>
            generateUrlEntry(`${BASE_URL}${city.path}`, today, city.changefreq, city.priority)
        ).join('')}
</urlset>`;
        return { statusCode: 200, headers, body: xml };
    }

    if (type === 'messes') {
        let messUrls = '';
        try {
            const db = getFirestore();
            const snapshot = await db.collection('messes').get();
            snapshot.forEach((doc) => {
                const mess = doc.data();
                if (!mess.name || mess.name.trim() === '') return;
                
                const lastmod = formatDate(mess.updatedAt || mess.createdAt);
                const slug = toMessSlug(mess.name, doc.id);
                const tiered = getTieredPriorityAndFreq(lastmod, '0.9', '0.7');
                messUrls += generateUrlEntry(`${BASE_URL}/mess/${slug}`, lastmod, tiered.changefreq, tiered.priority);
            });
        } catch (error) {
            console.error('Error fetching messes:', error.message);
        }
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Dynamic Mess Pages -->${messUrls}
</urlset>`;
        return { statusCode: 200, headers, body: xml };
    }

    if (type === 'rooms') {
        let roomUrls = '';
        try {
            const db = getFirestore();
            const messesSnapshot = await db.collection('messes').get();
            const messMap = new Map();
            messesSnapshot.forEach((doc) => {
                const mess = doc.data();
                if (mess.name && mess.name.trim() !== '') {
                    messMap.set(doc.id, { id: doc.id, name: mess.name });
                }
            });

            const roomsSnapshot = await db.collection('rooms').get();
            roomsSnapshot.forEach((doc) => {
                const room = doc.data();
                const mess = messMap.get(room.messId);
                if (mess) {
                    const lastmod = formatDate(room.updatedAt || room.createdAt);
                    const messSlug = toMessSlug(mess.name, mess.id);
                    const roomSlug = toRoomSlug(room.occupancy, doc.id);
                    const tiered = getTieredPriorityAndFreq(lastmod, '0.8', '0.6');
                    roomUrls += generateUrlEntry(`${BASE_URL}/room/${messSlug}/${roomSlug}`, lastmod, tiered.changefreq, tiered.priority);
                }
            });
        } catch (error) {
            console.error('Error fetching rooms:', error.message);
        }
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Dynamic Room Pages -->${roomUrls}
</urlset>`;
        return { statusCode: 200, headers, body: xml };
    }

    // Default to 'index' (Sitemap Index)
    let latestMessDate = today;
    let latestRoomDate = today;
    try {
        const db = getFirestore();
        const messSnap = await db.collection('messes').select('updatedAt', 'createdAt').get();
        messSnap.forEach((doc) => {
            const mess = doc.data();
            const lastmod = formatDate(mess.updatedAt || mess.createdAt);
            if (lastmod > latestMessDate) {
                latestMessDate = lastmod;
            }
        });
        
        const roomSnap = await db.collection('rooms').select('updatedAt', 'createdAt').get();
        roomSnap.forEach((doc) => {
            const room = doc.data();
            const lastmod = formatDate(room.updatedAt || room.createdAt);
            if (lastmod > latestRoomDate) {
                latestRoomDate = lastmod;
            }
        });
    } catch (error) {
        console.error('Error calculating latest dates for index:', error.message);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${BASE_URL}/sitemap-static.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-cities.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-messes.xml</loc>
    <lastmod>${latestMessDate}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-rooms.xml</loc>
    <lastmod>${latestRoomDate}</lastmod>
  </sitemap>
</sitemapindex>`;

    return { statusCode: 200, headers, body: xml };
}
