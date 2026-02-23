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
    noindex = false,
    keywords,
    structuredData
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

        // Update keywords if provided
        if (keywords) {
            updateMetaTag('meta[name="keywords"]', 'content', keywords);
        }

        // Inject structured data (JSON-LD) if provided
        let structuredDataScript = null;
        if (structuredData) {
            // Remove existing structured data script if any
            const existingScript = document.querySelector('script[data-schema="mess"]');
            if (existingScript) {
                existingScript.remove();
            }

            // Create new script tag
            structuredDataScript = document.createElement('script');
            structuredDataScript.setAttribute('type', 'application/ld+json');
            structuredDataScript.setAttribute('data-schema', 'mess');
            structuredDataScript.textContent = JSON.stringify(structuredData);
            document.head.appendChild(structuredDataScript);
        }

        // Cleanup - restore defaults on unmount
        return () => {
            document.title = 'MessKhojo - Find Best Mess, PG & Hostel in Balasore | Affordable Student Stays';
            // Remove structured data script
            const script = document.querySelector('script[data-schema="mess"]');
            if (script) {
                script.remove();
            }
        };
    }, [title, description, canonicalUrl, ogImage, ogType, noindex, keywords, structuredData]);
}

/**
 * Generate structured data for a Mess listing
 */
export function generateMessSchema(mess) {
    if (!mess) return null;

    const amenityFeatures = [];

    // 1. Boolean Amenities (WiFi, Food, Inverter)
    if (mess.amenities) {
        Object.entries(mess.amenities).forEach(([key, value]) => {
            if (value === true) {
                amenityFeatures.push({
                    "@type": "LocationFeatureSpecification",
                    "name": key.charAt(0).toUpperCase() + key.slice(1)
                });
            }
        });
    }

    // 2. Custom Text Facilities (Security, Appliances)
    if (mess.security) {
        amenityFeatures.push({
            "@type": "LocationFeatureSpecification",
            "name": `Security: ${mess.security}`
        });
    }
    if (mess.extraAppliances) {
        amenityFeatures.push({
            "@type": "LocationFeatureSpecification",
            "name": `Appliances: ${mess.extraAppliances}`
        });
    }

    const schema = {
        "@context": "https://schema.org",
        "@type": "Hostel",
        "name": mess.name,
        "description": mess.description || `${mess.name} is a ${mess.messType || 'premium'} accommodation in ${mess.address || 'Balasore'}. Hygienic food, safe environment, no broker.`,
        "url": `https://messkhojo.com/mess/${mess.id}`,
        "image": mess.posterUrl || mess.images?.[0] || "https://messkhojo.com/logo.png",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": mess.address || "",
            "addressLocality": "Balasore",
            "addressRegion": "Odisha",
            "addressCountry": "IN"
        },
        "priceRange": mess.minPrice && mess.maxPrice
            ? `₹${mess.minPrice} - ₹${mess.maxPrice}`
            : mess.rent ? `₹${mess.rent}` : "Contact for price",
        "amenityFeature": amenityFeatures
    };

    // Add telephone if available AND not hidden
    if (mess.contact && !mess.hideContact) {
        schema.telephone = mess.contact;
    }

    // Add geo coordinates if available
    if (mess.latitude && mess.longitude) {
        schema.geo = {
            "@type": "GeoCoordinates",
            "latitude": mess.latitude.toString(),
            "longitude": mess.longitude.toString()
        };
    }

    // Add pricing offers if available
    if (mess.minPrice) {
        schema.offers = {
            "@type": "Offer",
            "priceCurrency": "INR",
            "price": mess.minPrice,
            "availability": "https://schema.org/InStock",
            "validFrom": new Date().toISOString().split('T')[0]
        };
    }

    // Add keywords for better discovery
    const keywords = [
        mess.name,
        `${mess.name} balasore`,
        `${mess.name} contact`,
        mess.messType,
        mess.address
    ].filter(Boolean);

    schema.keywords = keywords.join(', ');

    // Add rating if available
    if (mess.rating) {
        schema.aggregateRating = {
            "@type": "AggregateRating",
            "ratingValue": mess.rating,
            "bestRating": "5"
        };
    }

    return schema;
}

export default usePageSEO;
