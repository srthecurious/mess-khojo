import React, { useMemo, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import useMesses from '../hooks/useMesses';
import { DISTRICTS_CONFIG } from '../context/DistrictContext';
import { usePageSEO } from '../hooks/usePageSEO';

const MessExplorerMap = React.lazy(() => import('../components/MessExplorerMap'));

const CITY_NAMES = Object.values(DISTRICTS_CONFIG).reduce((acc, district) => {
    (district.cities || []).forEach(city => {
        acc[city.id] = city.name;
    });
    return acc;
}, { other: "Other Localities" });

const CityExplorerPage = () => {
    const { cityId, districtId: routeDistrictId } = useParams();
    const navigate = useNavigate();

    // 1. Resolve district for this city (prefer route param, fall back to config lookup)
    const resolvedDistrictId = useMemo(() => {
        if (routeDistrictId && DISTRICTS_CONFIG[routeDistrictId]) return routeDistrictId;
        for (const distId in DISTRICTS_CONFIG) {
            const cities = DISTRICTS_CONFIG[distId].cities || [];
            if (cities.some(c => c.id === cityId)) return distId;
        }
        return 'balasore'; // default fallback
    }, [cityId, routeDistrictId]);

    const cityName = CITY_NAMES[cityId] || cityId.charAt(0).toUpperCase() + cityId.slice(1);

    // 2. SEO setup
    usePageSEO({
        title: `Interactive Map of Messes in ${cityName} | MessKhojo`,
        description: `Explore the interactive map of verified boys and girls messes, PGs, and hostels in ${cityName}. Locate near your college or workplace, check rooms, rent, and amenities.`,
        keywords: `map of messes in ${cityName}, interactive mess map ${cityName}, messes in ${cityName}, PGs in ${cityName}, student hostels ${cityName}, messkhojo map`,
        canonicalUrl: `https://messkhojo.com/district/${resolvedDistrictId}/city/${cityId}/explorer`,
    });

    // 3. Load data for this district
    const { messes, rooms, loading } = useMesses(resolvedDistrictId);

    // 4. Retrieve user location from session storage if available
    const userLocation = useMemo(() => {
        try {
            const stored = sessionStorage.getItem('messkhojo_userLocation');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    }, []);

    // 5. Enrich messes with price data and filter by city
    const validMesses = useMemo(() => {
        if (loading || !messes) return [];
        let filtered = messes.filter(
            mess => !mess.hidden && mess.latitude && mess.longitude &&
                !isNaN(mess.latitude) && !isNaN(mess.longitude)
        );
        if (cityId) {
            filtered = filtered.filter(mess => {
                const mCity = mess.city ? mess.city.trim().toLowerCase() : 'other';
                return mCity === cityId.toLowerCase();
            });
        }
        return filtered.map(mess => {
            const messRooms = rooms ? rooms.filter(room => room.messId === mess.id) : [];
            const prices = messRooms.map(r => Number(r.price || r.rent)).filter(p => !isNaN(p) && p > 0);
            const minPrice = prices.length ? Math.min(...prices) : null;
            const maxPrice = prices.length ? Math.max(...prices) : null;
            return { ...mess, minPrice, maxPrice, messRooms };
        });
    }, [messes, rooms, cityId, loading]);

    const handleClose = () => {
        // Navigate back to the city details page
        navigate(`/district/${resolvedDistrictId}/city/${cityId}`);
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-brand-secondary flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
                    <MapPin size={28} className="text-brand-primary animate-bounce" />
                </div>
                <div className="text-center">
                    <p className="font-bold text-brand-text-dark">Loading Explorer...</p>
                    <p className="text-sm text-brand-text-gray mt-1">Hang tight, preparing the map for {cityName}</p>
                </div>
            </div>
        );
    }

    return (
        <Suspense fallback={
            <div className="fixed inset-0 bg-brand-secondary flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
                    <MapPin size={28} className="text-brand-primary animate-bounce" />
                </div>
                <div className="text-center">
                    <p className="font-bold text-brand-text-dark">Loading Map...</p>
                    <p className="text-sm text-brand-text-gray mt-1">Drawing markers and loading interactive explorer</p>
                </div>
            </div>
        }>
            <MessExplorerMap
                validMesses={validMesses}
                userLocation={userLocation}
                onClose={handleClose}
            />
        </Suspense>
    );
};

export default CityExplorerPage;
