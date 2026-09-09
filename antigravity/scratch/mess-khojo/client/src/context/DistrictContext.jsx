/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export const DISTRICTS_CONFIG = {
    balasore: {
        id: "balasore",
        name: "Balasore",
        active: true,
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

/**
 * Build a static fallback localitiesConfig from DISTRICTS_CONFIG.
 * Shape: { cityId: ['Locality A', 'Locality B', ...] }
 * For districts where multiple cities share the same landmark pool,
 * we assign all district landmarks to every city in that district unless
 * city-specific landmarks are explicitly specified.
 */
const buildFallbackLocalities = () => {
    const map = {};
    Object.values(DISTRICTS_CONFIG).forEach(district => {
        const districtLandmarks = (district.landmarks || []).map(l => l.name);
        district.cities.forEach(city => {
            if (city.landmarks && Array.isArray(city.landmarks)) {
                map[city.id] = city.landmarks.map(l => typeof l === 'string' ? l : l.name);
            } else {
                map[city.id] = districtLandmarks;
            }
        });
    });
    return map;
};

export const FALLBACK_LOCALITIES = buildFallbackLocalities();

export const getCitiesForDistrict = (districtId) => {
    return DISTRICTS_CONFIG[districtId]?.cities || [];
};

/**
 * Get localities for a city, given a localitiesConfig map.
 * Falls back to the static config if nothing is in Firestore yet.
 */
export const getLocalitiesForCity = (cityId, localitiesConfig) => {
    if (localitiesConfig && localitiesConfig[cityId] && localitiesConfig[cityId].length > 0) {
        return localitiesConfig[cityId];
    }
    return FALLBACK_LOCALITIES[cityId] || [];
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
                    // Merge with fallback so cities not yet in Firestore still work
                    setLocalitiesConfig({ ...FALLBACK_LOCALITIES, ...data });
                } else {
                    // Doc doesn't exist yet — keep fallback values
                    setLocalitiesConfig(FALLBACK_LOCALITIES);
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
    }, []);
    // ─────────────────────────────────────────────────────────────────────────

    const setSelectedDistrict = (districtId) => {
        if (DISTRICTS_CONFIG[districtId]) {
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


    const districtConfig = selectedDistrict ? DISTRICTS_CONFIG[selectedDistrict] : null;
    const availableDistricts = Object.values(DISTRICTS_CONFIG);

    const value = {
        selectedDistrict,
        setSelectedDistrict,
        districtConfig,
        availableDistricts,
        isDistrictSelectorOpen,
        setIsDistrictSelectorOpen,
        // ── Localities API ──────────────────────────────────────────────────
        localitiesConfig,       // { cityId: string[] }
        localitiesLoading,      // true while Firestore first loads
        getLocalitiesForCity,   // helper: getLocalitiesForCity(cityId, localitiesConfig)
    };

    return (
        <DistrictContext.Provider value={value}>
            {children}
        </DistrictContext.Provider>
    );
};
