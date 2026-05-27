import Fuse from 'fuse.js';

const FUSE_OPTIONS = {
    keys: [
        { name: 'name', weight: 1.0 },
        { name: 'address', weight: 0.8 },
        { name: 'district', weight: 0.5 }
    ],
    threshold: 0.4,
    includeScore: true,
    ignoreLocation: true // Ignore character position of matches for more intuitive search matches
};

/**
 * Creates a new Fuse search index for a given list of messes.
 */
export const createSearchIndex = (items) => {
    return new Fuse(items, FUSE_OPTIONS);
};

/**
 * Performs fuzzy search on the Fuse index.
 * Returns items enriched with a standardized searchScore (0-120 scale to match legacy score ranges).
 */
export const searchMesses = (fuse, query) => {
    if (!query || !query.trim()) return [];
    const results = fuse.search(query);
    
    return results.map(result => {
        // Map Fuse score (0 = perfect match, 1 = no match) to our legacy-compatible score scale (up to 120)
        const similarity = 1 - result.score; // 0 to 1
        const searchScore = similarity * 120;
        
        return {
            ...result.item,
            searchScore
        };
    });
};
