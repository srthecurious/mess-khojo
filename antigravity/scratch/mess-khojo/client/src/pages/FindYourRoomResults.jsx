import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { ArrowLeft, ArrowRight, BedDouble, MapPin, CheckCircle, XCircle, Home, Search, Users, User, Banknote, AlertCircle, History } from 'lucide-react';
import { getSuggestions } from '../utils/suggestionEngine';
import { toMessSlug } from '../utils/slugify';
import { getCleanOccupancy } from '../utils/occupancy';
import { usePageSEO } from '../hooks/usePageSEO';
import { DISTRICTS_CONFIG } from '../context/DistrictContext';
import PastSuggestionsModal from '../components/PastSuggestionsModal';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatCityName = (cityId) => {
    if (!cityId) return '';
    if (cityId === 'baleshwar') return 'Balasore';
    return cityId.charAt(0).toUpperCase() + cityId.slice(1);
};

const formatOccupancy = (occ) => {
    const clean = getCleanOccupancy(occ);
    if (clean === '4') return '4+ Seater';
    if (clean) return `${clean}-Seater`;
    return occ;
};

/** Parse query params → inquiry-like object */
const paramsToInquiry = (params) => ({
    city:      params.get('city')     || '',
    gender:    params.get('gender')   || '',
    occupancy: params.get('occupancy')|| '',
    budget:    params.get('budget')   || '',
    location:  params.get('location') || '',
    name:      params.get('name')     || '',
});

/** Build URL query string from an inquiry object */
const _inquiryToParams = (inquiry) => {
    const p = new URLSearchParams();
    if (inquiry.city)     p.set('city',     inquiry.city);
    if (inquiry.gender)   p.set('gender',   inquiry.gender);
    if (inquiry.occupancy)p.set('occupancy',inquiry.occupancy);
    if (inquiry.budget)   p.set('budget',   inquiry.budget);
    if (inquiry.location) p.set('location', inquiry.location);
    if (inquiry.name)     p.set('name',     inquiry.name);
    return p.toString();
};

// ---------------------------------------------------------------------------
// Skeleton Card
// ---------------------------------------------------------------------------
const SkeletonCard = () => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
        <div className="h-40 bg-gray-200" />
        <div className="p-5 space-y-3">
            <div className="h-5 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded w-1/2" />
            <div className="h-4 bg-gray-100 rounded w-2/3" />
            <div className="h-10 bg-gray-100 rounded-xl mt-4" />
        </div>
    </div>
);

// ---------------------------------------------------------------------------
// Mess Card
// ---------------------------------------------------------------------------
const MessCard = ({ mess, index }) => {
    const slug = toMessSlug(mess.name, mess.id);
    const minPrice = Math.min(...mess.matchedRooms.map(r => parseFloat(r.price) || 0));
    const maxPrice = Math.max(...mess.matchedRooms.map(r => parseFloat(r.price) || 0));
    const priceLabel = minPrice === maxPrice ? `₹${minPrice}/mo` : `₹${minPrice}–₹${maxPrice}/mo`;

    const occupancies = [...new Set(mess.matchedRooms.map(r => r.occupancy))].join(', ');

    return (
        <div
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
            style={{ animationDelay: `${index * 60}ms` }}
        >
            {/* Thumbnail */}
            <div className="relative h-44 bg-gray-100 overflow-hidden">
                {mess.posterUrl ? (
                    <img
                        src={mess.posterUrl}
                        alt={mess.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
                        <BedDouble size={40} className="text-indigo-200" />
                    </div>
                )}

                {/* Availability badge */}
                <div className={`absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm ${
                    mess.hasAvailability
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-800/80 text-gray-200'
                }`}>
                    {mess.hasAvailability ? (
                        <><CheckCircle size={10} /> Rooms Available</>
                    ) : (
                        <><XCircle size={10} /> Check with Owner</>
                    )}
                </div>

                {/* Rank badge */}
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-brand-primary text-white text-sm font-black flex items-center justify-center shadow-md">
                    {index + 1}
                </div>
            </div>

            {/* Info */}
            <div className="p-5 flex flex-col flex-grow">
                <h3 className="text-base font-bold text-gray-900 leading-tight mb-1 line-clamp-2">
                    {mess.name}
                </h3>

                {(mess.locality || mess.landmark) && (
                    <p className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                        <MapPin size={12} className="text-brand-primary shrink-0" />
                        {mess.locality || mess.landmark}
                    </p>
                )}

                <div className="grid grid-cols-2 gap-2 mt-auto">
                    <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                        <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">Price</p>
                        <p className="text-sm font-bold text-emerald-600">{priceLabel}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                        <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">Room Type</p>
                        <p className="text-sm font-bold text-gray-700 capitalize">{occupancies}</p>
                    </div>
                </div>

                <Link
                    to={`/mess/${slug}`}
                    className="mt-4 w-full py-3 bg-brand-primary text-white font-bold rounded-xl text-sm flex items-center justify-center gap-1.5 hover:bg-brand-primary-hover transition-colors active:scale-[0.98]"
                >
                    View Mess Details
                    <ArrowRight size={14} />
                </Link>
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
const FindYourRoomResults = () => {
    const location  = useLocation();
    const navigate  = useNavigate();
    const [searchParams] = useSearchParams();

    usePageSEO({
        title: 'Your Matched Messes | MessKhojo — Find Your Room',
        description: 'Here are the best messes matching your room preferences on MessKhojo.',
        noindex: true,
    });

    // ---- Resolve inquiry: prefer location.state, fallback to URL params ----
    const inquiry = useMemo(() => {
        if (location.state?.inquiry) return location.state.inquiry;
        const fromParams = paramsToInquiry(searchParams);
        // Only use params if at least city is present
        if (fromParams.city) return fromParams;
        return null;
    }, [location.state, searchParams]);

    // ---- Firestore data ----
    const [messes, setMesses]   = useState([]);
    const [rooms, setRooms]     = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);

    // ---- Past Suggestions History State ----
    const [pastInquiries, setPastInquiries] = useState([]);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    useBodyScrollLock(isHistoryModalOpen);

    useEffect(() => {
        try {
            const rawPast = localStorage.getItem('mk_past_inquiries');
            if (rawPast) {
                const parsed = JSON.parse(rawPast);
                if (Array.isArray(parsed)) {
                    setPastInquiries(parsed);
                }
            }
        } catch {
            // ignore localStorage errors
        }
    }, [location.state]);

    const handleClearAllHistory = () => {
        if (window.confirm("Are you sure you want to clear all your search history?")) {
            try {
                localStorage.removeItem('mk_past_inquiries');
                localStorage.removeItem('mk_last_inquiry');
                setPastInquiries([]);
                setIsHistoryModalOpen(false);
            } catch (err) {
                console.error("Error clearing history", err);
            }
        }
    };

    const handleDeleteHistoryItem = (indexToDelete) => {
        try {
            const updatedPast = pastInquiries.filter((_, idx) => idx !== indexToDelete);
            setPastInquiries(updatedPast);
            localStorage.setItem('mk_past_inquiries', JSON.stringify(updatedPast));
            
            if (updatedPast.length === 0) {
                localStorage.removeItem('mk_last_inquiry');
            } else {
                localStorage.setItem('mk_last_inquiry', JSON.stringify(updatedPast[0]));
            }
        } catch (err) {
            console.error("Error deleting history item", err);
        }
    };

    useEffect(() => {
        if (!inquiry) {
            navigate('/find-your-room', { replace: true });
            return;
        }

        let cancelled = false;
        const fetchData = async () => {
            try {
                const [messSnap, roomSnap] = await Promise.all([
                    getDocs(collection(db, 'messes')),
                    getDocs(collection(db, 'rooms')),
                ]);
                if (cancelled) return;
                setMesses(messSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                setRooms(roomSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (err) {
                console.error('Error fetching suggestions data:', err);
                if (!cancelled) setFetchError(true);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchData();
        return () => { cancelled = true; };
    }, [inquiry, navigate]);

    // ---- Compute suggestions ----
    const suggestions = useMemo(() => {
        if (!inquiry || loading || messes.length === 0) return [];
        return getSuggestions(inquiry, messes, rooms);
    }, [inquiry, messes, rooms, loading]);

    // ---- Occupancy fallback note ----
    const occupancyFallback = suggestions.length > 0 ? suggestions[0].occupancyFallback : 0;
    const preferredOccupancyLabel = formatOccupancy(inquiry?.occupancy || '');
    const actualOccupancyLabel = suggestions.length > 0
        ? formatOccupancy(suggestions[0].matchedRooms[0]?.occupancy || '')
        : '';

    if (!inquiry) return null;

    // ---- Readable summary of preferences ----
    const cityName = formatCityName(inquiry.city);
    const budgetLabel = inquiry.budget ? `₹${inquiry.budget.replace(/-/g, '–').replace('7000+', '7000+')}` : '';

    return (
        <div className="min-h-screen bg-brand-secondary pb-20">
            {/* Header */}
            <div className="bg-brand-primary sticky top-0 z-10 shadow-md">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Link to="/find-your-room" className="text-white/80 hover:text-white transition-colors shrink-0">
                        <ArrowLeft size={24} />
                    </Link>
                    <div className="flex-grow min-w-0">
                        <h1 className="text-lg font-bold text-white leading-tight">Your Matched Messes</h1>
                        <p className="text-white/70 text-xs truncate">
                            {cityName}{inquiry.location ? ` · ${inquiry.location}` : ''}{inquiry.gender ? ` · ${inquiry.gender.charAt(0).toUpperCase() + inquiry.gender.slice(1)}` : ''}
                        </p>
                    </div>
                    
                    {pastInquiries.length > 0 && (
                        <button
                            onClick={() => setIsHistoryModalOpen(true)}
                            className="flex items-center gap-1.5 text-white/85 hover:text-white text-xs font-semibold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-all border border-white/15"
                            title="View other past searches"
                        >
                            <History size={13} />
                            <span className="hidden sm:inline">Past Suggestions</span> ({pastInquiries.length})
                        </button>
                    )}
                    
                    <Link
                        to="/"
                        className="shrink-0 text-white/80 hover:text-white transition-colors"
                        title="Go home"
                    >
                        <Home size={20} />
                    </Link>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-6">

                {/* Preferences Summary Pill Bar */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {inquiry.city && (
                        <span className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-700 shadow-sm">
                            <MapPin size={11} className="text-brand-primary" /> {cityName}
                        </span>
                    )}
                    {inquiry.gender && (
                        <span className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-700 shadow-sm">
                            <User size={11} className="text-brand-primary" /> {inquiry.gender.charAt(0).toUpperCase() + inquiry.gender.slice(1)}
                        </span>
                    )}
                    {inquiry.occupancy && (
                        <span className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-700 shadow-sm">
                            <Users size={11} className="text-brand-primary" /> {preferredOccupancyLabel}
                        </span>
                    )}
                    {budgetLabel && (
                        <span className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-700 shadow-sm">
                            <Banknote size={11} className="text-brand-primary" /> {budgetLabel}/mo
                        </span>
                    )}
                    {inquiry.location && (
                        <span className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-700 shadow-sm">
                            <MapPin size={11} className="text-indigo-500" /> {inquiry.location}
                        </span>
                    )}
                </div>

                {/* Occupancy Fallback Notice */}
                {!loading && occupancyFallback > 0 && suggestions.length > 0 && (
                    <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm mb-5">
                        <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-500" />
                        <p>
                            No {preferredOccupancyLabel} rooms found for your preferences.
                            Showing <strong>{actualOccupancyLabel}</strong> options instead.
                        </p>
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <>
                        <div className="h-6 w-48 bg-gray-200 rounded mb-5 animate-pulse" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                        </div>
                    </>
                )}

                {/* Fetch Error */}
                {!loading && fetchError && (
                    <div className="text-center py-16">
                        <XCircle size={40} className="text-red-400 mx-auto mb-3" />
                        <p className="text-gray-600 font-medium">Something went wrong while fetching suggestions.</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 px-6 py-2.5 bg-brand-primary text-white font-bold rounded-xl text-sm hover:bg-brand-primary-hover transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* Results */}
                {!loading && !fetchError && (
                    <>
                        {/* Header */}
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-xl font-bold text-gray-900">
                                {suggestions.length > 0
                                    ? `${suggestions.length} Best Match${suggestions.length > 1 ? 'es' : ''} Found`
                                    : 'No Messes Found'}
                            </h2>
                            {suggestions.length > 0 && (
                                <span className="text-xs text-gray-400 font-medium">
                                    Showing up to 6
                                </span>
                            )}
                        </div>

                        {/* No results */}
                        {suggestions.length === 0 && (
                            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Search size={28} className="text-gray-400" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-700 mb-2">No matching messes found</h3>
                                <p className="text-gray-400 text-sm max-w-xs mx-auto mb-6">
                                    We couldn't find a mess matching all your preferences right now. Try adjusting your requirements.
                                </p>
                                <Link
                                    to="/find-your-room"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary text-white font-bold rounded-xl text-sm hover:bg-brand-primary-hover transition-colors shadow-md shadow-brand-primary/20"
                                >
                                    <Search size={15} /> Modify Preferences
                                </Link>
                            </div>
                        )}

                        {/* Cards Grid */}
                        {suggestions.length > 0 && (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {suggestions.map((mess, idx) => (
                                        <MessCard
                                            key={mess.id}
                                            mess={mess}
                                            inquiry={inquiry}
                                            index={idx}
                                        />
                                    ))}
                                </div>

                                {/* Footer CTA */}
                                <div className="mt-10 bg-white border border-gray-100 rounded-2xl p-6 text-center shadow-sm">
                                    <p className="text-gray-500 text-sm mb-4">
                                        Not satisfied with these options? Try submitting another request tomorrow by changing some preferences to find a better match.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                        <Link
                                            to="/find-your-room"
                                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-primary text-white font-bold rounded-xl text-sm hover:bg-brand-primary-hover transition-colors shadow-md shadow-brand-primary/20"
                                        >
                                            <Search size={15} /> Submit Another Request
                                        </Link>
                                        <Link
                                            to="/"
                                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl text-sm hover:bg-gray-200 transition-colors"
                                        >
                                            <Home size={15} /> Go to Home
                                        </Link>
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
            
            <PastSuggestionsModal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                pastInquiries={pastInquiries}
                onClearAll={handleClearAllHistory}
                onDeleteItem={handleDeleteHistoryItem}
            />
        </div>
    );
};

export default FindYourRoomResults;
