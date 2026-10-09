/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

// ─── Static Fallback Config (used if Firestore doc doesn't exist yet) ────────
// This is the original hardcoded config. It is ALWAYS available as a safety net.
// The dynamic Firestore config merges on top of this.
export const STATIC_DISTRICTS_CONFIG = {
    balasore: {
        id: "balasore",
        name: "Balasore",
        active: true,
        order: 1,
        heroTitle: "Find Your Comfortable Stay in Balasore",
        heroSubtitle: "Mess Dhundo, Ghar Baithe",
        gpsCenter: { lat: 21.4934, lng: 86.9294 },
        cities: [
            { id: "baleshwar", name: "Baleshwar (Balasore City)", busStand: { lat: 21.4950, lng: 86.9427, name: "Sahadevkhunta Bus Stand" } },
            { id: "remuna", name: "Remuna", busStand: { lat: 21.5265, lng: 86.8712, name: "Remuna Bus Stand" } }
        ],
        // Static fallback localities used while Firestore loads
        landmarks: [
            { name: 'Mansingh Bazar', type: 'locality' },
            { name: 'Fakir Mohan Golei', type: 'locality' },
            { name: 'Station Square', type: 'locality' },
            { name: 'Remuna', type: 'locality' },
            { name: 'Sahadev Khuntha', type: 'locality' },
            { name: 'Azimabad', type: 'locality' },
            { name: 'ITB', type: 'locality' },
            { name: 'Balasore', type: 'locality' }
        ]
    },
    bhadrak: {
        id: "bhadrak",
        name: "Bhadrak",
        active: true,
        order: 2,
        heroTitle: "Find Your Comfortable Stay in Bhadrak",
        heroSubtitle: "Mess Dhundo, Ghar Baithe",
        gpsCenter: { lat: 21.0672, lng: 86.4886 },
        cities: [
            { id: "bhadrak", name: "Bhadrak", busStand: { lat: 21.0733, lng: 86.5022, name: "Bhadrak Bus Stand" } },
            { id: "basudevpur", name: "Basudevpur", busStand: { lat: 21.1400, lng: 86.7200, name: "Basudevpur Bus Stand" } }
        ],
        landmarks: [
            { name: 'Bhadrak Station', type: 'locality' },
            { name: 'Charampa', type: 'locality' },
            { name: 'Bhadrak College', type: 'locality' },
            { name: 'By Pass', type: 'locality' },
            { name: 'Dakshinakali', type: 'locality' },
            { name: 'Bhadrak', type: 'locality' }
        ]
    },
    mayurbhanj: {
        id: "mayurbhanj",
        name: "Mayurbhanj",
        active: true,
        order: 3,
        heroTitle: "Find Your Comfortable Stay in Mayurbhanj",
        heroSubtitle: "Mess Dhundo, Ghar Baithe",
        gpsCenter: { lat: 21.9320, lng: 86.7513 },
        cities: [
            { id: "baripada", name: "Baripada", busStand: { lat: 21.9380, lng: 86.7450, name: "Baripada Bus Stand" } }
        ],
        landmarks: [
            { name: 'Baripada Station', type: 'locality' },
            { name: 'Lal Bazar', type: 'locality' },
            { name: 'Palbani', type: 'locality' },
            { name: 'Baghra Road', type: 'locality' },
            { name: 'MKC High School', type: 'locality' },
            { name: 'Baripada', type: 'locality' }
        ]
    },
    jajpur: {
        id: "jajpur",
        name: "Jajpur",
        active: true,
        order: 4,
        heroTitle: "Find Your Comfortable Stay in Jajpur",
        heroSubtitle: "Mess Dhundo, Ghar Baithe",
        gpsCenter: { lat: 20.8502, lng: 86.3361 },
        cities: [
            { id: "jajpur_road", name: "Jajpur Road (Vyasanagar)", busStand: { lat: 20.9525, lng: 86.1367, name: "Jajpur Road Bus Stand" } },
            { id: "jajpur_town", name: "Jajpur Town", busStand: { lat: 20.8502, lng: 86.3361, name: "Jajpur Town Bus Stand" } }
        ],
        landmarks: [
            { name: 'Jajpur Road', type: 'locality' },
            { name: 'Vyasanagar', type: 'locality' },
            { name: 'Chorda Bypass', type: 'locality' },
            { name: 'NC College Road', type: 'locality' },
            { name: 'Biraja Temple', type: 'locality' },
            { name: 'Jajpur Town', type: 'locality' },
            { name: 'Jajpur', type: 'locality' }
        ]
    },
    khorda: {
        id: "khorda",
        name: "Khorda",
        active: true,
        order: 5,
        heroTitle: "Find Your Comfortable Stay in Bhubaneswar & Khorda",
        heroSubtitle: "Mess Dhundo, Ghar Baithe",
        gpsCenter: { lat: 20.2961, lng: 85.8245 },
        cities: [
            { 
                id: "bhubaneswar", 
                name: "Bhubaneswar", 
                busStand: { lat: 20.2785, lng: 85.7946, name: "Baramunda ISBT Bus Stand" },
                landmarks: [
                    'Patia', 'Khandagiri', 'Jayadev Vihar', 'Saheed Nagar', 'Nayapalli',
                    'Chandrasekharpur', 'Master Canteen', 'Baramunda', 'Acharya Vihar',
                    'Rasulgarh', 'Infocity', 'Kalinga Nagar', 'Vani Vihar', 'Old Town',
                    'Bhubaneswar'
                ]
            },
            { 
                id: "khordha_town", 
                name: "Khordha Town", 
                busStand: { lat: 20.1813, lng: 85.6178, name: "Khorda New Bus Stand" },
                landmarks: [
                    'Khorda New Bus Stand', 'Khorda Old Bus Stand', 'Gurujang',
                    'Collectorate Road', 'Khordha Road Junction', 'Khorda Town'
                ]
            }
        ],
        landmarks: [
            { name: 'Patia', type: 'locality' },
            { name: 'Khandagiri', type: 'locality' },
            { name: 'Jayadev Vihar', type: 'locality' },
            { name: 'Saheed Nagar', type: 'locality' },
            { name: 'Nayapalli', type: 'locality' },
            { name: 'Chandrasekharpur', type: 'locality' },
            { name: 'Master Canteen', type: 'locality' },
            { name: 'Baramunda', type: 'locality' },
            { name: 'Acharya Vihar', type: 'locality' },
            { name: 'Rasulgarh', type: 'locality' },
            { name: 'Infocity', type: 'locality' },
            { name: 'Kalinga Nagar', type: 'locality' },
            { name: 'Vani Vihar', type: 'locality' },
            { name: 'Old Town', type: 'locality' },
            { name: 'Bhubaneswar', type: 'locality' },
            { name: 'Khorda New Bus Stand', type: 'locality' },
            { name: 'Gurujang', type: 'locality' },
            { name: 'Khorda Town', type: 'locality' }
        ]
    }
};

// ─── Backward-compat alias ───────────────────────────────────────────────────
// Many files still import DISTRICTS_CONFIG directly. This is the dynamic value
// that gets updated at runtime. For SSR/initial render it starts as the static
// fallback. The DistrictProvider patches it on mount.
// NOTE: This mutable export is intentional to support imports outside of React
// component trees (e.g. utility functions, service files). The DistrictProvider
// keeps it in sync with Firestore.
export let DISTRICTS_CONFIG = { ...STATIC_DISTRICTS_CONFIG };

/**
 * Build a static fallback localitiesConfig from DISTRICTS_CONFIG.
 * Shape: { cityId: ['Locality A', 'Locality B', ...] }
 * For districts where multiple cities share the same landmark pool,
 * we assign all district landmarks to every city in that district unless
 * city-specific landmarks are explicitly specified.
 */
const buildFallbackLocalities = (config) => {
    const map = {};
    Object.values(config || STATIC_DISTRICTS_CONFIG).forEach(district => {
        const districtLandmarks = (district.landmarks || []).map(l => typeof l === 'string' ? l : l.name);
        (district.cities || []).forEach(city => {
            if (city.landmarks && Array.isArray(city.landmarks)) {
                map[city.id] = city.landmarks.map(l => typeof l === 'string' ? l : l.name);
            } else {
                map[city.id] = districtLandmarks;
            }
        });
    });
    return map;
};

export const FALLBACK_LOCALITIES = buildFallbackLocalities(STATIC_DISTRICTS_CONFIG);

export const getCitiesForDistrict = (districtId) => {
    return DISTRICTS_CONFIG[districtId]?.cities || [];
};

/**
 * Normalize any city alias or slug to its standard canonical city ID
 * e.g. 'balasore', 'Balasore City', 'baleswar' -> 'baleshwar'
 *      'khorda', 'khordha' -> 'khordha_town'
 *      'vyasanagar', 'jajpur road' -> 'jajpur_road'
 *      'jajpur', 'jajpur town' -> 'jajpur_town'
 */
export const normalizeCityId = (cityId) => {
    if (!cityId) return '';
    const c = String(cityId).trim().toLowerCase();
    if (['baleshwar', 'balasore', 'balasore city', 'baleswar', 'balesore'].includes(c)) return 'baleshwar';
    if (['khordha_town', 'khordha', 'khorda', 'khorda town', 'khordha town'].includes(c)) return 'khordha_town';
    if (['jajpur_town', 'jajpur town', 'jajpur'].includes(c)) return 'jajpur_town';
    if (['jajpur_road', 'jajpur road', 'vyasanagar', 'chorda'].includes(c)) return 'jajpur_road';
    return c;
};

/**
 * Check if a mess belongs to a requested city, supporting aliases,
 * case insensitivity, and legacy district fallbacks.
 */
export const isMessInCity = (mess, cityId) => {
    if (!mess) return false;
    const target = normalizeCityId(cityId);
    if (!target) return true;

    const messCity = normalizeCityId(mess.city);
    const messDist = (mess.district || '').trim().toLowerCase();
    const messLoc = (mess.locality || mess.landmark || '').trim().toLowerCase();

    // 1. Direct normalized city match
    if (messCity && messCity === target) return true;

    // 2. Balasore / Baleshwar fallback
    if (target === 'baleshwar') {
        if (messCity === 'baleshwar') return true;
        // If mess has no explicit city, but is in Balasore district (or has no district) and not in Remuna
        if ((!messCity || messCity === 'other') && (!messDist || messDist === 'balasore') && !messLoc.includes('remuna')) {
            return true;
        }
    }

    // 3. Remuna
    if (target === 'remuna') {
        if (messCity === 'remuna' || messLoc.includes('remuna')) return true;
    }

    // 4. Bhadrak
    if (target === 'bhadrak') {
        if (messCity === 'bhadrak') return true;
        if ((!messCity || messCity === 'other') && messDist === 'bhadrak' && !messLoc.includes('basudevpur')) return true;
    }

    // 5. Basudevpur
    if (target === 'basudevpur') {
        if (messCity === 'basudevpur' || messLoc.includes('basudevpur')) return true;
    }

    // 6. Baripada
    if (target === 'baripada') {
        if (messCity === 'baripada') return true;
        if ((!messCity || messCity === 'other') && messDist === 'mayurbhanj') return true;
    }

    // 7. Bhubaneswar
    if (target === 'bhubaneswar') {
        if (messCity === 'bhubaneswar') return true;
        if ((!messCity || messCity === 'other') && messDist === 'khorda') return true;
    }

    // 8. Khordha Town
    if (target === 'khordha_town') {
        if (messCity === 'khordha_town') return true;
    }

    // 9. Jajpur Town
    if (target === 'jajpur_town') {
        if (messCity === 'jajpur_town') return true;
        if ((!messCity || messCity === 'other') && messDist === 'jajpur' && !messLoc.includes('vyasanagar') && !messLoc.includes('road')) return true;
    }

    // 10. Jajpur Road
    if (target === 'jajpur_road') {
        if (messCity === 'jajpur_road' || messLoc.includes('vyasanagar') || messLoc.includes('road')) return true;
    }

    // 11. Slug fallback (e.g. spaces/underscores/hyphens)
    const cleanTarget = target.replace(/[_\s-]+/g, '');
    const cleanMess = (mess.city || '').trim().toLowerCase().replace(/[_\s-]+/g, '');
    if (cleanTarget && cleanTarget === cleanMess) return true;

    return false;
};

/**
 * Get formatted display name for a city ID across all loaded districts.
 * Returns city.name if configured (e.g. 'Cuttack' for 'cuttack_city'),
 * or cleans up slug (e.g. 'cuttack_city' -> 'Cuttack City').
 */
export const getCityDisplayName = (cityId, config = DISTRICTS_CONFIG) => {
    if (!cityId) return '';
    const norm = normalizeCityId(cityId);
    if (norm === 'baleshwar') return 'Balasore';
    if (norm === 'other') return 'Other Localities';
    const cfg = config || DISTRICTS_CONFIG;
    for (const district of Object.values(cfg)) {
        const found = (district?.cities || []).find(c => c.id === norm || c.id === cityId);
        if (found) return found.name;
    }
    // Clean fallback: replace underscores with spaces and capitalize words
    return norm
        .split('_')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
};

/**
 * Get localities for a city, given a localitiesConfig map.
 * Falls back to the static config if nothing is in Firestore yet.
 */
export const getLocalitiesForCity = (cityId, localitiesConfig) => {
    if (localitiesConfig && localitiesConfig[cityId] && localitiesConfig[cityId].length > 0) {
        return localitiesConfig[cityId];
    }
    // Try dynamic DISTRICTS_CONFIG fallback
    const dynamicFallback = buildFallbackLocalities(DISTRICTS_CONFIG);
    return dynamicFallback[cityId] || FALLBACK_LOCALITIES[cityId] || [];
};

const DistrictContext = createContext();

export const useDistrict = () => {
    return useContext(DistrictContext);
};

export const DistrictProvider = ({ children }) => {
    const [selectedDistrict, setSelectedDistrictState] = useState(() => {
        // Try to load from URL param first (for SEO / direct linking)
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const districtParam = params.get('district')?.toLowerCase();
            if (districtParam && DISTRICTS_CONFIG[districtParam]?.active) {
                localStorage.setItem('selectedDistrict', districtParam);
                return districtParam;
            }

            // Try to load from localStorage on initial render
            const saved = localStorage.getItem('selectedDistrict');
            if (saved && DISTRICTS_CONFIG[saved] && DISTRICTS_CONFIG[saved].active) {
                return saved;
            }
        }
        return null; // Will trigger selector
    });

    const [isDistrictSelectorOpen, setIsDistrictSelectorOpen] = useState(false);

    // ── Dynamic Districts from Firestore ──────────────────────────────────────
    const [dynamicDistrictsConfig, setDynamicDistrictsConfig] = useState(STATIC_DISTRICTS_CONFIG);
    const [districtsLoading, setDistrictsLoading] = useState(true);

    useEffect(() => {
        const unsub = onSnapshot(
            doc(db, 'app_config', 'districts'),
            (snap) => {
                if (snap.exists() && snap.data()?.districts) {
                    const raw = snap.data().districts;
                    // Merge with static fallback so nothing breaks
                    const merged = { ...STATIC_DISTRICTS_CONFIG };
                    Object.entries(raw).forEach(([key, val]) => {
                        merged[key] = {
                            ...merged[key],
                            ...val,
                            id: key,
                            cities: Array.isArray(val.cities) ? val.cities : (merged[key]?.cities || []),
                            landmarks: Array.isArray(val.landmarks) ? val.landmarks : (merged[key]?.landmarks || []),
                        };
                    });
                    // Also include NEW districts that only exist in Firestore
                    Object.entries(raw).forEach(([key, val]) => {
                        if (!merged[key]) {
                            merged[key] = {
                                id: key,
                                name: val.name || key,
                                active: val.active ?? true,
                                order: val.order ?? 99,
                                heroTitle: val.heroTitle || '',
                                heroSubtitle: val.heroSubtitle || '',
                                gpsCenter: val.gpsCenter || { lat: 0, lng: 0 },
                                cities: Array.isArray(val.cities) ? val.cities : [],
                                landmarks: Array.isArray(val.landmarks) ? val.landmarks : [],
                            };
                        }
                    });
                    setDynamicDistrictsConfig(merged);
                    // Update the mutable export so non-React imports stay current
                    DISTRICTS_CONFIG = merged;
                    // Cache to localStorage for faster initial loads
                    try {
                        localStorage.setItem('_mk_districts_cache', JSON.stringify(merged));
                    } catch { /* quota exceeded — ignore */ }
                } else {
                    setDynamicDistrictsConfig(STATIC_DISTRICTS_CONFIG);
                    DISTRICTS_CONFIG = { ...STATIC_DISTRICTS_CONFIG };
                }
                setDistrictsLoading(false);
            },
            (err) => {
                console.warn('[DistrictContext] Could not load districts config:', err.message);
                // Try localStorage cache
                try {
                    const cached = localStorage.getItem('_mk_districts_cache');
                    if (cached) {
                        const parsed = JSON.parse(cached);
                        setDynamicDistrictsConfig(parsed);
                        DISTRICTS_CONFIG = parsed;
                    }
                } catch { /* ignore */ }
                setDistrictsLoading(false);
            }
        );
        return () => unsub();
    }, []);

    // ── Localities from Firestore ─────────────────────────────────────────────
    // Shape: { cityId: ['Locality A', 'Locality B', ...] }
    const [localitiesConfig, setLocalitiesConfig] = useState(FALLBACK_LOCALITIES);
    const [localitiesLoading, setLocalitiesLoading] = useState(true);

    useEffect(() => {
        const unsub = onSnapshot(
            doc(db, 'app_config', 'localities'),
            (snap) => {
                if (snap.exists()) {
                    const data = snap.data();
                    // Build dynamic fallback from latest districts config
                    const dynamicFallback = buildFallbackLocalities(dynamicDistrictsConfig);
                    // Merge with fallback so cities not yet in Firestore still work
                    setLocalitiesConfig({ ...FALLBACK_LOCALITIES, ...dynamicFallback, ...data });
                } else {
                    // Doc doesn't exist yet — keep fallback values
                    setLocalitiesConfig({ ...FALLBACK_LOCALITIES, ...buildFallbackLocalities(dynamicDistrictsConfig) });
                }
                setLocalitiesLoading(false);
            },
            (err) => {
                console.warn('[DistrictContext] Could not load localities config:', err.message);
                // Keep fallback — no visible disruption to users
                setLocalitiesLoading(false);
            }
        );
        return () => unsub();
    }, [dynamicDistrictsConfig]);
    // ─────────────────────────────────────────────────────────────────────────

    const setSelectedDistrict = (districtId) => {
        if (dynamicDistrictsConfig[districtId]) {
            setSelectedDistrictState(districtId);
            localStorage.setItem('selectedDistrict', districtId);
            setIsDistrictSelectorOpen(false);

            // Sync URL parameter
            if (typeof window !== 'undefined') {
                const url = new URL(window.location.href);
                url.searchParams.set('district', districtId);
                window.history.replaceState({}, '', url.toString());
            }
        } else if (districtId === null) {
            setSelectedDistrictState(null);
            localStorage.removeItem('selectedDistrict');
            setIsDistrictSelectorOpen(true);

            // Remove URL parameter
            if (typeof window !== 'undefined') {
                const url = new URL(window.location.href);
                url.searchParams.delete('district');
                window.history.replaceState({}, '', url.toString());
            }
        }
    };


    const districtConfig = selectedDistrict ? dynamicDistrictsConfig[selectedDistrict] : null;
    const availableDistricts = Object.values(dynamicDistrictsConfig).sort((a, b) => (a.order || 99) - (b.order || 99));

    const value = {
        selectedDistrict,
        setSelectedDistrict,
        districtConfig,
        availableDistricts,
        isDistrictSelectorOpen,
        setIsDistrictSelectorOpen,
        // ── Dynamic Districts Config ─────────────────────────────────────────
        districtsConfig: dynamicDistrictsConfig,  // full dynamic config object
        districtsLoading,                          // true while Firestore first loads
        // ── Localities API ──────────────────────────────────────────────────
        localitiesConfig,       // { cityId: string[] }
        localitiesLoading,      // true while Firestore first loads
        getLocalitiesForCity,   // helper: getLocalitiesForCity(cityId, localitiesConfig)
        getCityDisplayName: (cityId) => getCityDisplayName(cityId, dynamicDistrictsConfig),
        normalizeCityId,
        isMessInCity,
    };

    return (
        <DistrictContext.Provider value={value}>
            {children}
        </DistrictContext.Provider>
    );
};
