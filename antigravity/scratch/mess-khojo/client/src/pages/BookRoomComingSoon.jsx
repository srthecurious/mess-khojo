import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, CheckCircle, BedDouble, MapPin, Phone, User, Banknote, Users, CalendarDays, ChevronRight, MessageSquareText, Building2, Clock, History, ArrowRight } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { usePageSEO } from '../hooks/usePageSEO';
import { DISTRICTS_CONFIG, useDistrict } from '../context/DistrictContext';
import PastSuggestionsModal from '../components/PastSuggestionsModal';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';


const WhatsAppIcon = ({ size = 18, className = "" }) => (
    <svg 
        viewBox="0 0 24 24" 
        width={size} 
        height={size} 
        fill="currentColor" 
        className={className}
    >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.705 1.456h.008c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
);

const BookRoomComingSoon = () => {
    usePageSEO({
        title: 'Find Your Room - Tell Us What You Need | MessKhojo',
        description: 'Share your room requirements and our team will manually find the best mess, PG or hostel for you in Odisha. No broker, no hassle.',
        canonicalUrl: 'https://messkhojo.com/find-your-room',
    });
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const stepParam = parseInt(searchParams.get('step'));
    const step = !isNaN(stepParam) && stepParam >= 1 && stepParam <= 3 ? stepParam : 1;
    const [sliderMin, setSliderMin] = useState(500);
    const [sliderMax, setSliderMax] = useState(7000);
    const [activeThumb, setActiveThumb] = useState('');
    const trackRef = useRef(null);

    const handleTrackInteraction = (clientX) => {
        if (!trackRef.current) return;
        const rect = trackRef.current.getBoundingClientRect();
        const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const clickedValue = Math.round((500 + percentage * (7000 - 500)) / 100) * 100;
        
        const distMin = Math.abs(clickedValue - sliderMin);
        const distMax = Math.abs(clickedValue - sliderMax);
        
        if (distMin < distMax) {
            const val = Math.min(clickedValue, sliderMax - 200);
            setSliderMin(val);
            setActiveThumb('min');
        } else {
            const val = Math.max(clickedValue, sliderMin + 200);
            setSliderMax(val);
            setActiveThumb('max');
        }
    };

    const handleMouseDown = (e) => {
        if (e.target.tagName === 'INPUT' || e.target.closest('input')) {
            return;
        }
        handleTrackInteraction(e.clientX);
    };

    const handleTouchStart = (e) => {
        if (e.target.tagName === 'INPUT' || e.target.closest('input')) {
            return;
        }
        if (e.touches && e.touches[0]) {
            handleTrackInteraction(e.touches[0].clientX);
        }
    };
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        whatsapp: '',
        sameAsPhone: true,
        city: searchParams.get('city') || '',
        location: '',
        budget: '500-7000+',
        gender: 'boys',
        occupancy: '1-seater',
        expectedMoveIn: 'immediately',
        requirements: '',
        consent: false
    });

    useEffect(() => {
        const maxValStr = sliderMax === 7000 ? '7000+' : String(sliderMax);
        setFormData(prev => ({
            ...prev,
            budget: `${sliderMin}-${maxValStr}`
        }));
    }, [sliderMin, sliderMax]);
    const [allMessesData, setAllMessesData] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, _setIsSuccess] = useState(false);
    const [error, setError] = useState('');
    const [phoneError, setPhoneError] = useState('');

    // ---- localStorage rate-limit state & past suggestions ----
    const LS_KEY = 'mk_last_inquiry';
    const [alreadySubmittedToday, setAlreadySubmittedToday] = useState(false);
    const [pastInquiries, setPastInquiries] = useState([]);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    useBodyScrollLock(isHistoryModalOpen);

    useEffect(() => {
        try {
            const rawLast = localStorage.getItem(LS_KEY);
            if (rawLast) {
                const parsed = JSON.parse(rawLast);
                if (parsed.submittedAt) {
                    const storedDate = new Date(parsed.submittedAt).toDateString();
                    const todayDate  = new Date().toDateString();
                    if (storedDate === todayDate) {
                        setAlreadySubmittedToday(true);
                    }
                }
            }

            const rawPast = localStorage.getItem('mk_past_inquiries');
            if (rawPast) {
                const parsed = JSON.parse(rawPast);
                if (Array.isArray(parsed)) {
                    setPastInquiries(parsed);
                }
            } else if (rawLast) {
                const parsed = JSON.parse(rawLast);
                if (parsed.inquiry) {
                    const initialPast = [{
                        submittedAt: parsed.submittedAt || new Date().toISOString(),
                        inquiry: parsed.inquiry
                    }];
                    setPastInquiries(initialPast);
                    localStorage.setItem('mk_past_inquiries', JSON.stringify(initialPast));
                }
            }
        } catch {
            // ignore corrupt localStorage
        }
    }, []);

    const handleClearAllHistory = () => {
        if (window.confirm("Are you sure you want to clear all your search history?")) {
            try {
                localStorage.removeItem('mk_past_inquiries');
                localStorage.removeItem(LS_KEY);
                setPastInquiries([]);
                setAlreadySubmittedToday(false);
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
                localStorage.removeItem(LS_KEY);
                setAlreadySubmittedToday(false);
            } else {
                localStorage.setItem(LS_KEY, JSON.stringify(updatedPast[0]));
                
                const storedDate = new Date(updatedPast[0].submittedAt).toDateString();
                const todayDate  = new Date().toDateString();
                setAlreadySubmittedToday(storedDate === todayDate);
            }
        } catch (err) {
            console.error("Error deleting history item", err);
        }
    };

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [step]);

    useEffect(() => {
        const fetchMesses = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "messes"));
                const messesData = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (!data.hidden) {
                        messesData.push({
                            city: data.city ? data.city.trim().toLowerCase() : '',
                            locality: (data.locality || data.landmark || '').trim()
                        });
                    }
                });
                setAllMessesData(messesData);
            } catch (err) {
                console.error("Error fetching messes for landmarks:", err);
            }
        };
        fetchMesses();
    }, []);

    // Get available localities for the selected city — loads from localitiesConfig first (instant)
    const { localitiesConfig, getLocalitiesForCity } = useDistrict();
    const availableLocalities = React.useMemo(() => {
        if (!formData.city) return [];

        const cityId = formData.city.toLowerCase();
        // Primary: official locality list from operator-configured Firestore data
        const officialLocalities = getLocalitiesForCity(cityId, localitiesConfig);

        // Safety net: also include any locality/landmark values from messes that
        // aren't already in the official list (handles legacy free-text data)
        const localitySet = new Set(officialLocalities);
        allMessesData.forEach(mess => {
            if (mess.city === cityId && mess.locality) {
                localitySet.add(mess.locality);
            }
        });

        return Array.from(localitySet).sort((a, b) => a.localeCompare(b));
    }, [formData.city, allMessesData, localitiesConfig, getLocalitiesForCity]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updated = {
                ...prev,
                [name]: value
            };
            if (name === 'phone' && prev.sameAsPhone) {
                updated.whatsapp = value;
            }
            // Clear location if city changes
            if (name === 'city') {
                updated.location = '';
            }
            return updated;
        });
        
        // Clear errors when typing
        if (name === 'phone') setPhoneError('');
        setError('');
    };

    const nextStep = () => {
        // Validation for step 1
        if (step === 1) {
            if (!formData.city || !formData.location || !formData.budget) {
                setError('Please select your preferred city, area and budget to continue.');
                return;
            }
        }
        setError('');
        setSearchParams({ step: step + 1 });
    };

    const prevStep = () => {
        setError('');
        setSearchParams({ step: step - 1 });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.phone.length < 10) {
            setPhoneError('Please enter a valid 10-digit phone number.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const calculatedWhatsapp = formData.sameAsPhone ? formData.phone : formData.whatsapp;
            const inquiryData = {
                name: formData.name,
                phone: formData.phone,
                whatsapp: calculatedWhatsapp,
                city: formData.city,
                location: formData.location,
                budget: formData.budget,
                gender: formData.gender,
                occupancy: formData.occupancy,
                expectedMoveIn: formData.expectedMoveIn,
                requirements: formData.requirements,
                consent: formData.consent,
                createdAt: serverTimestamp(),
                status: 'new'
            };

            await addDoc(collection(db, "room_inquiries"), inquiryData);

            // Send Telegram Notification
            import('../utils/telegramNotifier').then(({ sendTelegramNotification, telegramTemplates }) => {
                sendTelegramNotification(telegramTemplates.newRoomInquiry(inquiryData));
            });

            // Save to localStorage for rate-limiting + "View Past Suggestions"
            try {
                const inquiryEntry = {
                    submittedAt: new Date().toISOString(),
                    inquiry: inquiryData
                };
                localStorage.setItem(LS_KEY, JSON.stringify(inquiryEntry));

                const rawPast = localStorage.getItem('mk_past_inquiries');
                let pastList = [];
                if (rawPast) {
                    try {
                        const parsed = JSON.parse(rawPast);
                        if (Array.isArray(parsed)) {
                            pastList = parsed;
                        }
                    } catch (err) {
                        console.error('Failed to parse past inquiries:', err);
                    }
                }
                pastList.unshift(inquiryEntry);
                pastList = pastList.slice(0, 15);
                localStorage.setItem('mk_past_inquiries', JSON.stringify(pastList));
                setPastInquiries(pastList);
            } catch (err) {
                // ignore localStorage errors (e.g. private browsing)
                console.warn('LocalStorage error:', err);
            }

            // Navigate to results page, passing the inquiry as route state
            navigate('/find-your-room/results', { state: { inquiry: inquiryData } });
        } catch (err) {
            console.error("Error submitting inquiry:", err);
            setError("Something went wrong. Please try again or contact us directly on WhatsApp.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderRadioCard = (name, value, label, icon, currentValue) => {
        const isSelected = currentValue === value;
        return (
            <button
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setFormData(prev => ({ ...prev, [name]: value }))}
                className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col items-center justify-center gap-2 ${
                    isSelected 
                        ? 'border-brand-primary bg-brand-primary/5 text-brand-primary' 
                        : 'border-gray-200 bg-white text-gray-500 hover:border-brand-primary/30 hover:bg-gray-50'
                }`}
            >
                {icon}
                <span className="font-semibold text-sm">{label}</span>
            </button>
        );
    };

    return (
        <div className="min-h-screen bg-brand-secondary pb-20">
            {/* Header */}
            <div className="bg-brand-primary p-4 sticky top-0 z-10 shadow-md">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="text-white/80 hover:text-white transition-colors">
                            <ArrowLeft size={24} />
                        </Link>
                        <h1 className="text-xl font-bold text-white">Find Your Room</h1>
                    </div>
                    {/* View Past Suggestions button — only shown if a prior inquiry exists */}
                    {pastInquiries.length > 0 && (
                        <button
                            onClick={() => setIsHistoryModalOpen(true)}
                            className="flex items-center gap-1.5 text-white/80 hover:text-white text-xs font-semibold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-all border border-white/20"
                        >
                            <History size={13} />
                            Past Suggestions ({pastInquiries.length})
                        </button>
                    )}
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-4 sm:py-8">

                {/* ── Already Submitted Today (rate-limit gate) ─────────── */}
                {alreadySubmittedToday ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center mt-6"
                    >
                        <div className="w-20 h-20 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-5">
                            <Clock size={36} />
                        </div>
                        <h2 className="text-2xl font-bold text-brand-text-dark mb-2">Already Submitted Today</h2>
                        <p className="text-brand-text-gray text-sm max-w-xs mx-auto mb-1">
                            You've already submitted a Find Your Room request today. You can submit again tomorrow.
                        </p>
                        <p className="text-xs text-gray-400 mb-8">
                            Resets at midnight · One request per device per day
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={() => setIsHistoryModalOpen(true)}
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-primary text-white font-bold rounded-xl text-sm hover:bg-brand-primary-hover transition-colors shadow-md shadow-brand-primary/20"
                            >
                                <History size={15} />
                                View Past Suggestions ({pastInquiries.length})
                            </button>
                            <Link
                                to="/"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl text-sm hover:bg-gray-200 transition-colors"
                            >
                                Back to Home
                            </Link>
                        </div>

                        {/* Choosable list on the rate-limit screen */}
                        {pastInquiries.length > 0 && (
                            <div className="mt-8 pt-6 border-t border-gray-100 text-left">
                                <h3 className="text-sm font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                                    <History size={16} className="text-brand-primary" />
                                    Choose from your past searches:
                                </h3>
                                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                                    {pastInquiries.map((item, idx) => {
                                        const { inquiry, submittedAt } = item;
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => navigate('/find-your-room/results', { state: { inquiry } })}
                                                className="w-full flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 hover:border-brand-primary rounded-xl text-left transition-all hover:bg-white hover:shadow-sm"
                                            >
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-gray-800">
                                                            {inquiry.city === 'baleshwar' ? 'Balasore' : inquiry.city.charAt(0).toUpperCase() + inquiry.city.slice(1)}
                                                            {inquiry.location ? `, ${inquiry.location}` : ''}
                                                        </span>
                                                        <span className="text-[10px] bg-brand-primary/10 text-brand-primary px-1.5 py-0.5 rounded font-bold capitalize">
                                                            {inquiry.gender}
                                                        </span>
                                                    </div>
                                                    <div className="text-[10px] text-gray-500 font-medium flex items-center gap-3">
                                                        <span>{inquiry.occupancy.replace('-seater', ' Seater')}</span>
                                                        <span>•</span>
                                                        <span>₹{inquiry.budget}/mo</span>
                                                        <span>•</span>
                                                        <span>{new Date(submittedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
                                                    </div>
                                                </div>
                                                <ArrowRight size={16} className="text-brand-primary" />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </motion.div>
                ) : (
                <>

                {/* Hero section */}
                {!isSuccess && step === 1 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-5 sm:mb-8"
                    >
                        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-brand-accent-green/10 rounded-full mb-2 sm:mb-3">
                            <BedDouble size={28} className="text-brand-accent-green sm:w-8 sm:h-8" />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-brand-text-dark mb-2">Let's find your perfect room!</h2>
                        <p className="text-brand-text-gray text-sm sm:text-base max-w-lg mx-auto">
                            Answer a few quick questions, and our team will manually hunt down the best options for you.
                        </p>
                    </motion.div>
                )}

                {/* Progress Bar */}
                {!isSuccess && (
                    <div className="w-full bg-gray-200 h-2 rounded-full mb-5 sm:mb-8 overflow-hidden">
                        <motion.div 
                            className="h-full bg-brand-primary rounded-full"
                            initial={{ width: `${((step - 1) / 3) * 100}%` }}
                            animate={{ width: `${(step / 3) * 100}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                )}

                {/* Main Form Box */}
                {isSuccess ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-green-50 border border-green-200 rounded-3xl p-8 text-center shadow-sm mt-8"
                    >
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle size={40} />
                        </div>
                        <h3 className="text-2xl font-bold text-brand-text-dark mb-3">Requirements Received!</h3>
                        <p className="text-brand-text-gray mb-8 text-lg">
                            We've got everything we need. Our team will contact you shortly with the best available rooms matching your criteria.
                        </p>
                        <Link
                            to="/"
                            className="inline-flex items-center justify-center px-8 py-3 bg-brand-primary text-white font-semibold rounded-xl hover:bg-brand-primary-hover transition-colors shadow-lg shadow-brand-primary/20"
                        >
                            Back to Home
                        </Link>
                    </motion.div>
                ) : (
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden relative">
                        {/* Error Message */}
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }} 
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-red-50 text-red-600 text-sm p-4 text-center font-medium border-b border-red-100"
                            >
                                {error}
                            </motion.div>
                        )}
                        
                        <div className="p-6 sm:p-8">
                            <AnimatePresence mode="wait">
                                {/* STEP 1: NEEDS */}
                                {step === 1 && (
                                    <motion.div
                                        key="step1"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-6"
                                    >
                                        <h3 className="text-xl font-bold text-brand-text-dark flex items-center gap-2 mb-6">
                                            <span className="w-1 h-6 bg-brand-primary rounded-full"></span>
                                            What are you looking for?
                                        </h3>

                                        {/* Gender Selection */}
                                        <div className="space-y-3">
                                            <label className="text-sm font-semibold text-brand-text-dark flex items-center gap-2">
                                                <User size={16} className="text-brand-primary" />
                                                Accommodation Type
                                            </label>
                                            <div className="grid grid-cols-2 gap-3" role="radiogroup">
                                                {renderRadioCard("gender", "boys", "Boys", <User size={20} />, formData.gender)}
                                                {renderRadioCard("gender", "girls", "Girls", <User size={20} />, formData.gender)}
                                            </div>
                                        </div>

                                         {/* Preferred City */}
                                         <div className="space-y-3">
                                             <label className="text-sm font-semibold text-brand-text-dark flex items-center gap-2">
                                                 <Building2 size={16} className="text-brand-primary" />
                                                 Preferred City
                                             </label>
                                             <select
                                                 name="city"
                                                 required
                                                 value={formData.city}
                                                 onChange={handleChange}
                                                 className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                                             >
                                                 <option value="">Select your city</option>
                                                 {Object.values(DISTRICTS_CONFIG).flatMap(dist => dist.cities || []).map(city => (
                                                     <option key={city.id} value={city.id}>{city.name}</option>
                                                 ))}
                                             </select>
                                         </div>

                                        {/* Location */}
                                        <div className="space-y-3">
                                            <label className="text-sm font-semibold text-brand-text-dark flex items-center gap-2">
                                                <MapPin size={16} className="text-brand-primary" />
                                                Preferred Area
                                            </label>
                                            <select
                                                name="location"
                                                required
                                                value={formData.location}
                                                onChange={handleChange}
                                                disabled={!formData.city}
                                                className="w-full px-4 py-3 bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                                            >
                                                <option value="">
                                                    {!formData.city 
                                                        ? "Select preferred city first" 
                                                        : availableLocalities.length === 0 
                                                            ? "No areas available in this city" 
                                                            : "Select preferred area"}
                                                </option>
                                                {availableLocalities.map((area, idx) => (
                                                    <option key={idx} value={area}>
                                                        {area}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Budget */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-semibold text-brand-text-dark flex items-center gap-2">
                                                    <Banknote size={16} className="text-brand-primary" />
                                                    Rental Budget (monthly)
                                                </label>
                                                <span className="text-xs font-bold text-brand-primary bg-brand-primary/10 px-2.5 py-1 rounded-full">
                                                    ₹{sliderMin} - {sliderMax === 7000 ? '₹7000+' : `₹${sliderMax}`}
                                                </span>
                                            </div>
                                            
                                            <div 
                                                ref={trackRef}
                                                className="relative w-full py-4 cursor-pointer select-none"
                                                onMouseDown={handleMouseDown}
                                                onTouchStart={handleTouchStart}
                                            >
                                                {/* Background Track */}
                                                <div className="h-2 bg-gray-200 rounded-full w-full absolute top-1/2 -translate-y-1/2"></div>
                                                {/* Range Highlight Track */}
                                                <div 
                                                    className="h-2 bg-brand-primary rounded-full absolute top-1/2 -translate-y-1/2"
                                                    style={{
                                                        left: `${((sliderMin - 500) / (7000 - 500)) * 100}%`,
                                                        width: `${((sliderMax - sliderMin) / (7000 - 500)) * 100}%`
                                                    }}
                                                ></div>

                                                {/* Min Slider */}
                                                <input
                                                    type="range"
                                                    min="500"
                                                    max="7000"
                                                    step="100"
                                                    value={sliderMin}
                                                    onChange={(e) => {
                                                        const val = Math.min(Number(e.target.value), sliderMax - 200);
                                                        setSliderMin(val);
                                                    }}
                                                    onMouseDown={() => setActiveThumb('min')}
                                                    onTouchStart={() => setActiveThumb('min')}
                                                    className={`absolute w-full h-2 top-1/2 -translate-y-1/2 left-0 appearance-none bg-transparent pointer-events-none outline-none
                                                                [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-primary [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none
                                                                [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-brand-primary [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer
                                                                ${activeThumb === 'min' ? 'z-40' : 'z-30'}`}
                                                />

                                                {/* Max Slider */}
                                                <input
                                                    type="range"
                                                    min="500"
                                                    max="7000"
                                                    step="100"
                                                    value={sliderMax}
                                                    onChange={(e) => {
                                                        const val = Math.max(Number(e.target.value), sliderMin + 200);
                                                        setSliderMax(val);
                                                    }}
                                                    onMouseDown={() => setActiveThumb('max')}
                                                    onTouchStart={() => setActiveThumb('max')}
                                                    className={`absolute w-full h-2 top-1/2 -translate-y-1/2 left-0 appearance-none bg-transparent pointer-events-none outline-none
                                                                [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-primary [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none
                                                                [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-brand-primary [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer
                                                                ${activeThumb === 'max' ? 'z-40' : 'z-30'}`}
                                                />
                                            </div>
                                            
                                            <div className="flex justify-between text-xs text-gray-400 px-1">
                                                <span>₹500</span>
                                                <span>₹7000+</span>
                                            </div>
                                        </div>
                                        
                                        <button 
                                            onClick={nextStep}
                                            className="w-full mt-4 py-4 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary-hover shadow-lg shadow-brand-primary/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                        >
                                            Next Step
                                            <ChevronRight size={18} />
                                        </button>
                                    </motion.div>
                                )}

                                {/* STEP 2: ROOM DETAILS */}
                                {step === 2 && (
                                    <motion.div
                                        key="step2"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-6"
                                    >
                                        <h3 className="text-xl font-bold text-brand-text-dark flex items-center gap-2 mb-6">
                                            <span className="w-1 h-6 bg-brand-primary rounded-full"></span>
                                            Room Details
                                        </h3>

                                        {/* Occupancy */}
                                        <div className="space-y-3">
                                            <label className="text-sm font-semibold text-brand-text-dark flex items-center gap-2">
                                                <Users size={16} className="text-brand-primary" />
                                                Occupancy Preference
                                            </label>
                                            <div className="grid grid-cols-2 gap-3" role="radiogroup">
                                                {renderRadioCard("occupancy", "1-seater", "1 Seater", <User size={20} />, formData.occupancy)}
                                                {renderRadioCard("occupancy", "2-seater", "2 Seater", <Users size={20} />, formData.occupancy)}
                                                {renderRadioCard("occupancy", "3-seater", "3 Seater", <Users size={20} />, formData.occupancy)}
                                                {renderRadioCard("occupancy", "4-seater", "4+ Seater", <BedDouble size={20} />, formData.occupancy)}
                                            </div>
                                        </div>

                                        {/* Move-in Date */}
                                        <div className="space-y-3">
                                            <label className="text-sm font-semibold text-brand-text-dark flex items-center gap-2">
                                                <CalendarDays size={16} className="text-brand-primary" />
                                                Expected Move-In
                                            </label>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="radiogroup">
                                                {renderRadioCard("expectedMoveIn", "immediately", "Immediately", <CalendarDays size={20}/>, formData.expectedMoveIn)}
                                                {renderRadioCard("expectedMoveIn", "within-15-days", "Within 15 Days", <CalendarDays size={20}/>, formData.expectedMoveIn)}
                                                {renderRadioCard("expectedMoveIn", "next-month", "Next Month", <CalendarDays size={20}/>, formData.expectedMoveIn)}
                                            </div>
                                        </div>

                                        {/* Requirements */}
                                        <div className="space-y-3">
                                            <label className="text-sm font-semibold text-brand-text-dark flex items-center gap-2">
                                                Any specific needs? <span className="text-xs text-gray-400 font-normal">(Optional)</span>
                                            </label>
                                            <textarea
                                                name="requirements"
                                                value={formData.requirements}
                                                onChange={handleChange}
                                                rows="3"
                                                placeholder="e.g. Need attached washroom, ground floor, specific cooking rules..."
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all resize-none"
                                            ></textarea>
                                        </div>

                                        <div className="flex gap-4 mt-4">
                                            <button 
                                                onClick={prevStep}
                                                className="w-1/3 py-4 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all active:scale-[0.98]"
                                            >
                                                Back
                                            </button>
                                            <button 
                                                onClick={nextStep}
                                                className="w-2/3 py-4 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary-hover shadow-lg shadow-brand-primary/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                            >
                                                Next Step
                                                <ChevronRight size={18} />
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* STEP 3: CONTACT & SUBMIT */}
                                {step === 3 && (
                                    <motion.div
                                        key="step3"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-6"
                                    >
                                        <h3 className="text-xl font-bold text-brand-text-dark flex items-center gap-2 mb-6">
                                            <span className="w-1 h-6 bg-brand-primary rounded-full"></span>
                                            How can we reach you?
                                        </h3>

                                        <form onSubmit={handleSubmit} className="space-y-5">
                                            {/* Name */}
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-brand-text-dark flex items-center gap-2">
                                                    <User size={16} className="text-brand-primary" />
                                                    Full Name
                                                </label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    required
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    placeholder="e.g. Rahul Sharma"
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                                                />
                                            </div>

                                            {/* Phone */}
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-brand-text-dark flex items-center gap-2">
                                                    <Phone size={16} className="text-brand-primary" />
                                                    Phone Number
                                                </label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">+91</span>
                                                    <input
                                                        type="tel"
                                                        name="phone"
                                                        required
                                                        value={formData.phone}
                                                        maxLength="10"
                                                        onChange={(e) => {
                                                            e.target.value = e.target.value.replace(/\D/g, '');
                                                            handleChange(e);
                                                        }}
                                                        placeholder="10 digit mobile number"
                                                        className={`w-full pl-12 pr-4 py-3 bg-gray-50 border rounded-xl outline-none transition-all focus:ring-2 ${
                                                            formData.phone.length === 10 ? 'border-green-400 focus:ring-green-400/20' : 
                                                            phoneError ? 'border-red-400 focus:ring-red-400/20' : 'border-gray-200 focus:ring-brand-primary/20 focus:border-brand-primary'
                                                        }`}
                                                    />
                                                    {formData.phone.length === 10 && (
                                                        <CheckCircle size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" />
                                                    )}
                                                </div>
                                                {phoneError && <p className="text-xs text-red-500 font-medium">{phoneError}</p>}
                                            </div>

                                            {/* WhatsApp */}
                                            <div className="space-y-2 pt-1">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-sm font-semibold text-brand-text-dark flex items-center gap-2">
                                                        <WhatsAppIcon size={16} className="text-green-600" />
                                                        WhatsApp Number <span className="text-xs text-gray-400 font-normal">(Optional)</span>
                                                    </label>
                                                    <div className="flex items-center gap-1.5">
                                                        <input
                                                            type="checkbox"
                                                            id="same-as-whatsapp"
                                                            checked={formData.sameAsPhone}
                                                            onChange={(e) => {
                                                                const checked = e.target.checked;
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    sameAsPhone: checked,
                                                                    whatsapp: checked ? prev.phone : ''
                                                                }));
                                                            }}
                                                            className="w-3.5 h-3.5 accent-brand-primary cursor-pointer rounded"
                                                        />
                                                        <label htmlFor="same-as-whatsapp" className="text-xs text-gray-500 cursor-pointer select-none">
                                                            Same as WhatsApp number
                                                        </label>
                                                    </div>
                                                </div>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">+91</span>
                                                    <input
                                                        type="tel"
                                                        name="whatsapp"
                                                        disabled={formData.sameAsPhone}
                                                        value={formData.sameAsPhone ? formData.phone : formData.whatsapp}
                                                        maxLength="10"
                                                        onChange={(e) => {
                                                            const val = e.target.value.replace(/\D/g, '');
                                                            setFormData(prev => ({ ...prev, whatsapp: val }));
                                                        }}
                                                        placeholder={formData.sameAsPhone ? "Same as phone number" : "10 digit WhatsApp number"}
                                                        className={`w-full pl-12 pr-4 py-3 bg-gray-50 border rounded-xl outline-none transition-all ${
                                                            formData.sameAsPhone 
                                                                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                                                                : 'focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary border-gray-200'
                                                        }`}
                                                    />
                                                </div>
                                            </div>

                                            { /* Consent Checkbox */}
                                            <div className="flex items-start gap-2 pt-2">
                                                <input
                                                    type="checkbox"
                                                    id="book-consent"
                                                    checked={formData.consent}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, consent: e.target.checked }))}
                                                    className="w-4 h-4 accent-brand-primary mt-1 cursor-pointer"
                                                />
                                                <label htmlFor="book-consent" className="text-xs text-gray-500 cursor-pointer text-left leading-tight">
                                                    I agree to the <a href="/terms-and-conditions" target="_blank" rel="noopener noreferrer" className="text-brand-primary font-bold hover:underline">Terms & Conditions</a> and <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-brand-primary font-bold hover:underline">Privacy Policy</a>.
                                                </label>
                                            </div>

                                            <div className="flex gap-4 mt-6">
                                                <button 
                                                    type="button"
                                                    onClick={prevStep}
                                                    disabled={isSubmitting}
                                                    className="w-1/3 py-4 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all active:scale-[0.98] disabled:opacity-50"
                                                >
                                                    Back
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={isSubmitting || !formData.consent}
                                                    className="w-2/3 py-4 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary-hover shadow-lg shadow-brand-primary/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                >
                                                    {isSubmitting ? (
                                                        <>
                                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                            Submitting...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Send size={18} />
                                                            Submit Request
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </form>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                )}

                {/* Past Suggestions Quick Access (below the form box) */}
                {!isSuccess && step === 1 && !alreadySubmittedToday && pastInquiries.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 bg-white rounded-3xl p-6 shadow-sm border border-gray-150"
                    >
                        <h3 className="text-sm font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                            <History size={16} className="text-brand-primary" />
                            Recent Match Requests
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {pastInquiries.slice(0, 4).map((item, idx) => {
                                const { inquiry } = item;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => navigate('/find-your-room/results', { state: { inquiry } })}
                                        className="flex items-center justify-between p-3 bg-gray-50 border border-gray-150 hover:border-brand-primary rounded-2xl text-left transition-all hover:bg-white hover:shadow-sm"
                                    >
                                        <div className="space-y-1 min-w-0">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <span className="text-xs font-bold text-gray-800 truncate">
                                                    {inquiry.city === 'baleshwar' ? 'Balasore' : inquiry.city.charAt(0).toUpperCase() + inquiry.city.slice(1)}
                                                    {inquiry.location ? `, ${inquiry.location}` : ''}
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-gray-500 flex items-center gap-1.5 font-medium">
                                                <span className="capitalize">{inquiry.gender}</span>
                                                <span>•</span>
                                                <span>₹{inquiry.budget}/mo</span>
                                            </div>
                                        </div>
                                        <ArrowRight size={14} className="text-brand-primary shrink-0 ml-2" />
                                    </button>
                                );
                            })}
                        </div>
                        {pastInquiries.length > 4 && (
                            <button
                                onClick={() => setIsHistoryModalOpen(true)}
                                className="mt-4 w-full py-2.5 text-center text-xs font-bold text-brand-primary hover:text-brand-primary-hover bg-brand-primary/5 hover:bg-brand-primary/10 rounded-xl transition-all"
                            >
                                View All {pastInquiries.length} Past Requests
                            </button>
                        )}
                    </motion.div>
                )}
            </>) /* end alreadySubmittedToday false-branch */}
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

export default BookRoomComingSoon;
