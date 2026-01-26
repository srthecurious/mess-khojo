// Dynamic Sitemap Generator - Netlify Function
// Fetches all mess listings from Firestore and generates a complete sitemap

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin (only once)
if (!getApps().length) {
    // For Netlify, we use environment variables
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID;

    if (projectId) {
        initializeApp({
            projectId: projectId,
        });
    }
}

const BASE_URL = 'https://messkhojo.com';

// Static pages with their priorities and change frequencies
const STATIC_PAGES = [
    { path: '/', priority: '1.0', changefreq: 'daily' },
    { path: '/user-login', priority: '0.7', changefreq: 'monthly' },
    { path: '/user-signup', priority: '0.7', changefreq: 'monthly' },
    { path: '/register-mess', priority: '0.8', changefreq: 'monthly' },
    { path: '/book-room', priority: '0.6', changefreq: 'monthly' },
];

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
        // Firestore Timestamp
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

export async function handler(event, context) {
    const today = new Date().toISOString().split('T')[0];

    let messUrls = '';

    try {
        // Try to fetch mess listings from Firestore
        const db = getFirestore();
        const messesSnapshot = await db.collection('messes').get();

        messesSnapshot.forEach((doc) => {
            const mess = doc.data();
            const lastmod = formatDate(mess.updatedAt || mess.createdAt);

            // Add mess detail page
            messUrls += generateUrlEntry(
                `${BASE_URL}/mess/${doc.id}`,
                lastmod,
                'weekly',
                '0.8'
            );
        });

        console.log(`Generated sitemap with ${messesSnapshot.size} mess listings`);
    } catch (error) {
        console.warn('Could not fetch mess listings from Firestore:', error.message);
        // Continue with just static pages if Firestore fails
    }

    // Build the complete sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Static Pages -->
${STATIC_PAGES.map(page =>
        generateUrlEntry(`${BASE_URL}${page.path}`, today, page.changefreq, page.priority)
    ).join('')}
  
  <!-- Dynamic Mess Pages -->
${messUrls}
</urlset>`;

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        },
        body: sitemap,
    };
}
