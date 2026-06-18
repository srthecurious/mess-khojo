/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from 'react';

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
        landmarks: [
            { name: 'Mansingh Bazar', type: 'landmark' },
            { name: 'Fakir Mohan Golei', type: 'landmark' },
            { name: 'Station Square', type: 'landmark' },
            { name: 'Remuna', type: 'landmark' },
            { name: 'Sahadev Khuntha', type: 'landmark' },
            { name: 'Azimabad', type: 'landmark' },
            { name: 'ITB', type: 'landmark' },
            { name: 'Balasore', type: 'landmark' }
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
            { name: 'Bhadrak Station', type: 'landmark' },
            { name: 'Charampa', type: 'landmark' },
            { name: 'Bhadrak College', type: 'landmark' },
            { name: 'By Pass', type: 'landmark' },
            { name: 'Dakshinakali', type: 'landmark' },
            { name: 'Bhadrak', type: 'landmark' }
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
            { name: 'Baripada Station', type: 'landmark' },
            { name: 'Lal Bazar', type: 'landmark' },
            { name: 'Palbani', type: 'landmark' },
            { name: 'Baghra Road', type: 'landmark' },
            { name: 'MKC High School', type: 'landmark' },
            { name: 'Baripada', type: 'landmark' }
        ]
    }
};

export const getCitiesForDistrict = (districtId) => {
    return DISTRICTS_CONFIG[districtId]?.cities || [];
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
        setIsDistrictSelectorOpen
    };

    return (
        <DistrictContext.Provider value={value}>
            {children}
        </DistrictContext.Provider>
    );
};
