import { useEffect } from 'react';

/**
 * SEO Component - Updates document title and meta tags dynamically
 * Works with React 19 without external dependencies
 */
export function usePageSEO({
    title,
    description,
    canonicalUrl,
    ogImage,
    ogType = 'website',
    noindex = false
}) {
    useEffect(() => {
        // Update document title
        if (title) {
            document.title = title.includes('MessKhojo')
                ? title
                : `${title} | MessKhojo`;
        }

        // Helper to update or create meta tag
        const updateMetaTag = (selector, attribute, content) => {
            let element = document.querySelector(selector);
            if (element) {
                element.setAttribute(attribute, content);
            }
        };

        // Update meta description
        if (description) {
            updateMetaTag('meta[name="description"]', 'content', description);
            updateMetaTag('meta[property="og:description"]', 'content', description);
            updateMetaTag('meta[name="twitter:description"]', 'content', description);
        }

        // Update title meta tags
        if (title) {
            updateMetaTag('meta[name="title"]', 'content', title);
            updateMetaTag('meta[property="og:title"]', 'content', title);
            updateMetaTag('meta[name="twitter:title"]', 'content', title);
        }

        // Update canonical URL
        if (canonicalUrl) {
            let canonical = document.querySelector('link[rel="canonical"]');
            if (canonical) {
                canonical.setAttribute('href', canonicalUrl);
            }
            updateMetaTag('meta[property="og:url"]', 'content', canonicalUrl);
            updateMetaTag('meta[name="twitter:url"]', 'content', canonicalUrl);
        }

        // Update OG image
        if (ogImage) {
            updateMetaTag('meta[property="og:image"]', 'content', ogImage);
            updateMetaTag('meta[name="twitter:image"]', 'content', ogImage);
        }

        // Update OG type
        updateMetaTag('meta[property="og:type"]', 'content', ogType);

        // Handle noindex for private pages
        if (noindex) {
            updateMetaTag('meta[name="robots"]', 'content', 'noindex, nofollow');
        } else {
            updateMetaTag('meta[name="robots"]', 'content', 'index, follow');
        }

        // Cleanup - restore defaults on unmount
        return () => {
            document.title = 'MessKhojo - Find Best Mess, PG & Hostel in Balasore | Affordable Student Stays';
        };
    }, [title, description, canonicalUrl, ogImage, ogType, noindex]);
}

/**
 * Generate structured data for a Mess listing
 */
export function generateMessSchema(mess) {
    if (!mess) return null;

    return {
        "@context": "https://schema.org",
        "@type": "LodgingBusiness",
        "name": mess.name,
        "description": mess.description || `${mess.name} - ${mess.type} accommodation in ${mess.address || 'Balasore'}`,
        "url": `https://messkhojo.com/mess/${mess.id}`,
        "image": mess.posterUrl || mess.images?.[0] || "https://messkhojo.com/logo.png",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": mess.address || "",
            "addressLocality": "Balasore",
            "addressRegion": "Odisha",
            "addressCountry": "IN"
        },
        "priceRange": mess.minRent && mess.maxRent
            ? `₹${mess.minRent} - ₹${mess.maxRent}`
            : mess.rent ? `₹${mess.rent}` : "Contact for price",
        "amenityFeature": mess.amenities
            ? Object.entries(mess.amenities)
                .filter(([_, value]) => value === true)
                .map(([key]) => ({
                    "@type": "LocationFeatureSpecification",
                    "name": key.charAt(0).toUpperCase() + key.slice(1) // Capitalize first letter
                }))
            : [],
        ...(mess.rating && {
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": mess.rating,
                "bestRating": "5"
            }
        })
    };
}

export default usePageSEO;
