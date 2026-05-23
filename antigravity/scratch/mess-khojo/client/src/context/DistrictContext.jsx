/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';

export const DISTRICTS_CONFIG = {
    balasore: {
        id: "balasore",
        name: "Balasore",
        active: true,
        heroTitle: "Find Your Comfortable Stay in Balasore",
        heroSubtitle: "Mess Dhundo, Ghar Baithe",
        gpsCenter: { lat: 21.4934, lng: 86.9294 },
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
        landmarks: [
            { name: 'Bhadrak Station', type: 'landmark' },
            { name: 'Charampa', type: 'landmark' },
            { name: 'Bhadrak College', type: 'landmark' },
            { name: 'By Pass', type: 'landmark' },
            { name: 'Dakshinakali', type: 'landmark' },
            { name: 'Bhadrak', type: 'landmark' }
        ]
    }
};

const DistrictContext = createContext();

export const useDistrict = () => {
    return useContext(DistrictContext);
};

export const DistrictProvider = ({ children }) => {
    const [selectedDistrict, setSelectedDistrictState] = useState(() => {
        // Try to load from localStorage on initial render
        if (typeof window !== 'undefined') {
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
        } else if (districtId === null) {
            setSelectedDistrictState(null);
            localStorage.removeItem('selectedDistrict');
            setIsDistrictSelectorOpen(true);
        }
    };

    // If no district is selected on mount, open the selector
    useEffect(() => {
        if (!selectedDistrict) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsDistrictSelectorOpen(true);
        }
    }, [selectedDistrict]);

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
