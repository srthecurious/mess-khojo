/**
 * suggestionEngine.js
 *
 * Shared algorithm for "Find Your Room" suggestions.
 * Used by:
 *   - FindYourRoomResults.jsx  (user-facing results page)
 *   - RoomInquiriesTab.jsx     (operational dashboard)
 *
 * Serial filter priority:
 *   1. City   — exact match (hard filter)
 *   2. Gender — mess type must accommodate user gender (hard filter)
 *   3. Occupancy — match preference; if no results, try +1 seater, then +2, etc.
 *                  "4+" means try 4, 5, 6, 7, 8 in order.
 *   4. Budget — price ≤ max budget (max cap only, no min enforcement)
 *   5. Area   — preferred landmark tried first; if no matches, fall back to rest
 *               of city (area is a soft score, never a hard exclusion)
 *
 * Post-filter sort:
 *   - Messes with available rooms (availableCount > 0) come first
 *   - Within same availability group, sorted by highest matched room price (desc)
 *   - Capped at 6 suggestions
 */

import { getCleanOccupancy } from './occupancy';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse the max budget value from the budget string.
 * Formats: "500-3000", "500-7000+", "<2000", "3000+"
 * Returns Infinity if no upper cap (7000+ or ends with +).
 */
export const parseMaxBudget = (budgetStr) => {
    if (!budgetStr) return Infinity;
    const clean = String(budgetStr).replace(/\s/g, '').replace(/₹/g, '');

    // "<2000"
    if (clean.startsWith('<')) {
        return parseFloat(clean.slice(1));
    }

    // "3000+"  or  "500-7000+"
    if (clean.endsWith('+')) {
        // If it's a range like "500-7000+", take the part after the dash
        if (clean.includes('-')) {
            const parts = clean.split('-');
            const _maxPart = parts[parts.length - 1];
            // "7000+" → Infinity
            return Infinity;
        }
        // "3000+" → Infinity
        return Infinity;
    }

    // "500-3000"
    if (clean.includes('-')) {
        const parts = clean.split('-');
        return parseFloat(parts[parts.length - 1]);
    }

    // Plain number
    const val = parseFloat(clean);
    return isNaN(val) ? Infinity : val;
};

/**
 * Returns true if the mess type accommodates the requested gender.
 */
export const matchesGender = (messType, pref) => {
    if (!pref) return true;
    const p = pref.toLowerCase();
    const types = Array.isArray(messType)
        ? messType
        : messType ? [messType] : [];
    const lowerTypes = types.map(t => String(t).toLowerCase());
    if (p === 'boys')  return lowerTypes.includes('boys')  || lowerTypes.includes('both') || lowerTypes.includes('coed');
    if (p === 'girls') return lowerTypes.includes('girls') || lowerTypes.includes('both') || lowerTypes.includes('coed');
    return true;
};

/**
 * Build the ordered list of occupancy values to try, starting from the
 * user's preference and going +1 each step up to 8-seater.
 * "4+" starts at 4 and climbs.
 */
export const getOccupancyLadder = (occupancyPref) => {
    const clean = getCleanOccupancy(occupancyPref);
    const startNum = parseInt(clean, 10);
    if (isNaN(startNum)) return null; // null = no occupancy filter (shouldn't happen with current form)
    const ladder = [];
    for (let n = startNum; n <= 8; n++) {
        ladder.push(String(n));
    }
    return ladder;
};

/**
 * Score a mess by how well its area/landmark matches the inquiry location.
 * Higher = better area match.
 */
const areaScore = (mess, location) => {
    if (!location) return 0;
    const loc       = location.toLowerCase().trim();
    const landmark  = (mess.locality || mess.landmark  || '').toLowerCase().trim();
    const address   = (mess.address   || '').toLowerCase().trim();
    const name      = (mess.name      || '').toLowerCase().trim();

    if (landmark === loc) return 10;
    if (landmark.includes(loc) || loc.includes(landmark)) return 5;
    if (address.includes(loc)) return 3;
    if (name.includes(loc)) return 1;
    return 0;
};

// ---------------------------------------------------------------------------
/**
 * Map rooms of a mess to adjust yearly prices if necessary.
 */
const getAdjustedRoomsForMess = (mess, roomsList) => {
    return roomsList
        .filter(room => room.messId === mess.id)
        .map(room => {
            const isYearly = mess.rentCycle === 'yearly' || room.rentCycle === 'yearly';
            if (isYearly) {
                const originalPrice = parseFloat(room.price);
                if (!isNaN(originalPrice)) {
                    return {
                        ...room,
                        price: String(originalPrice / 10),
                        isPriceAdjustedYearly: true,
                        originalPrice: room.price
                    };
                }
            }
            return room;
        });
};

// Main exported function
// ---------------------------------------------------------------------------

/**
 * Get up to 6 suggested messes for the given inquiry.
 *
 * @param {object}   inquiry    - The room inquiry object (from Firestore or form state)
 * @param {object[]} messesList - All messes (from Firestore)
 * @param {object[]} roomsList  - All rooms (from Firestore)
 * @returns {object[]} Up to 6 mess objects, each extended with:
 *   - matchedRooms      {object[]}  — rooms that satisfied all filters
 *   - hasAvailability   {boolean}   — true if any matched room has availableCount > 0
 *   - occupancyFallback {number}    — how many +1 steps were needed (0 = exact match)
 */
export const getSuggestions = (inquiry, messesList, roomsList) => {
    if (!messesList || !roomsList || !inquiry || !inquiry.city) return [];

    const cityPref     = inquiry.city.toLowerCase().trim();
    const genderPref   = inquiry.gender  || '';
    const locationPref = inquiry.location || '';
    const maxBudget    = parseMaxBudget(inquiry.budget);
    const occupancyLadder = getOccupancyLadder(inquiry.occupancy);

    // ----- Step 1 & 2: Filter messes by city + gender -----
    const cityGenderMesses = messesList.filter(mess => {
        if (mess.hidden) return false;
        const messCity = (mess.city || '').toLowerCase().trim();
        if (messCity !== cityPref) return false;
        if (!matchesGender(mess.messType, genderPref)) return false;
        return true;
    });

    if (cityGenderMesses.length === 0) return [];

    // ----- Step 3 & 4: Occupancy ladder + budget filter -----
    // Try each occupancy tier until we find at least one matching mess.
    // If occupancyLadder is null (shouldn't happen), skip occupancy filter.
    let candidates = [];
    let _fallbackSteps = 0;

    if (!occupancyLadder) {
        // No occupancy preference — include all rooms within budget
        candidates = cityGenderMesses.map(mess => {
            const messRooms = getAdjustedRoomsForMess(mess, roomsList).filter(room => {
                const price = parseFloat(room.price);
                return !isNaN(price) && price <= maxBudget;
            });
            return messRooms.length > 0 ? { ...mess, matchedRooms: messRooms, occupancyFallback: 0 } : null;
        }).filter(Boolean);
    } else {
        for (let i = 0; i < occupancyLadder.length; i++) {
            const tryOccupancy = occupancyLadder[i];
            const tierCandidates = cityGenderMesses.map(mess => {
                const messRooms = getAdjustedRoomsForMess(mess, roomsList).filter(room => {
                    if (getCleanOccupancy(room.occupancy) !== tryOccupancy) return false;
                    const price = parseFloat(room.price);
                    return !isNaN(price) && price <= maxBudget;
                });
                return messRooms.length > 0 ? { ...mess, matchedRooms: messRooms, occupancyFallback: i } : null;
            }).filter(Boolean);

            if (tierCandidates.length > 0) {
                candidates = tierCandidates;
                _fallbackSteps = i;
                break;
            }
        }
    }

    if (candidates.length === 0) return [];

    // ----- Step 5: Area preference — try preferred area first -----
    // Score each candidate by area match. Those with score > 0 are "preferred area".
    const withScores = candidates.map(mess => ({
        mess,
        score: areaScore(mess, locationPref),
        hasAvailability: mess.matchedRooms.some(
            r => r.availableCount !== undefined && r.availableCount !== null && Number(r.availableCount) > 0
        ),
        maxPrice: Math.max(...mess.matchedRooms.map(r => parseFloat(r.price) || 0))
    }));

    // Sort: available first → then by area score desc → then by highest price desc
    withScores.sort((a, b) => {
        // 1. Availability tiebreaker (available rooms come first)
        if (a.hasAvailability !== b.hasAvailability) return a.hasAvailability ? -1 : 1;
        // 2. Area match (higher score first)
        if (b.score !== a.score) return b.score - a.score;
        // 3. Highest price first (more premium options)
        return b.maxPrice - a.maxPrice;
    });

    // ----- Final: Enrich each mess and cap at 6 -----
    return withScores.slice(0, 6).map(({ mess, hasAvailability }) => ({
        ...mess,
        hasAvailability
    }));
};
