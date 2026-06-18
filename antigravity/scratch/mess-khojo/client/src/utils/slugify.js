/**
 * URL Slug Utilities — MessKhojo SEO
 *
 * Converts mess/room names into SEO-friendly URL slugs.
 * The first 4 characters of the Firestore document ID are embedded
 * as a suffix to guarantee uniqueness while keeping the URL readable.
 *
 * Examples:
 *   toMessSlug("Aryan Boys Mess", "ABC123xyz") → "aryan-boys-mess-abc1"
 *   toRoomSlug("Double", "DEF456ab") → "double-seater-def4"
 *   idSuffixFromSlug("aryan-boys-mess-abc1") → "abc1"
 */

/**
 * Converts a mess name + Firestore document ID into a URL-safe slug.
 * @param {string} name - The mess name (e.g. "Aryan Boys Mess")
 * @param {string} id   - The Firestore document ID
 * @returns {string}    - URL slug (e.g. "aryan-boys-mess-a3f9")
 */
export function toMessSlug(name, id) {
    if (!name || !id) return id || '';
    const base = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')  // strip special chars (keep alphanumeric, spaces, hyphens)
        .trim()
        .replace(/\s+/g, '-')           // spaces → hyphens
        .replace(/-{2,}/g, '-');        // collapse multiple hyphens
    const suffix = id.slice(0, 4);      // first 4 chars of Firestore ID (for indexing)
    return `${base}-${suffix}`;
}

/**
 * Converts a room occupancy + Firestore document ID into a URL-safe slug.
 * @param {string} occupancy - Room occupancy label (e.g. "Double", "Triple")
 * @param {string} id        - The Firestore document ID
 * @returns {string}         - URL slug (e.g. "double-seater-56ab")
 */
export function toRoomSlug(occupancy, id) {
    if (!occupancy || !id) return id || '';
    const base = (occupancy || 'room')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
    const suffix = id.slice(0, 4);      // first 4 chars of Firestore ID (for indexing)
    return `${base}-seater-${suffix}`;
}

/**
 * Extracts the Firestore ID suffix (last 4 chars) embedded in a slug.
 * Used to look up the full document when a slug URL is loaded.
 * @param {string} slug - The URL slug
 * @returns {string}    - 4-character Firestore ID suffix
 */
export function idSuffixFromSlug(slug) {
    if (!slug) return '';
    const parts = slug.split('-');
    return parts[parts.length - 1] || '';
}

/**
 * Determines if a string looks like a slug (contains hyphens) vs a raw Firestore ID.
 * Firestore auto-generated IDs are 20 alphanumeric chars with no hyphens.
 * @param {string} param - URL param to check
 * @returns {boolean}
 */
export function isSlug(param) {
    return typeof param === 'string' && param.includes('-');
}
