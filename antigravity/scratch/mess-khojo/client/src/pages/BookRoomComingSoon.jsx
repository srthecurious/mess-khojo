import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send, CheckCircle, BedDouble, MapPin, Phone, User, Banknote, Users, CalendarDays, ChevronRight, MessageSquareText, Building2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { usePageSEO } from '../hooks/usePageSEO';
import { DISTRICTS_CONFIG } from '../context/DistrictContext';

const PREDEFINED_CITY_LANDMARKS = {
    baleshwar: [
        'Mansingh Bazar',
        'Fakir Mohan Golei',
        'Station Square',
        'Sahadev Khuntha',
        'Azimabad',
        'ITB',
        'Balasore'
    ],
    remuna: [
        'Remuna'
    ],
    bhadrak: [
        'Bhadrak Station',
        'Charampa',
        'Bhadrak College',
        'By Pass',
        'Dakshinakali',
        'Bhadrak'
    ],
    basudevpur: [],
    baripada: [
        'Baripada Station',
        'Lal Bazar',
        'Palbani',
        'Baghra Road',
        'MKC High School',
        'Baripada'
    ]
};

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
    const [searchParams, setSearchParams] = useSearchParams();
    const stepParam = parseInt(searchParams.get('step'));
    const step = !isNaN(stepParam) && stepParam >= 1 && stepParam <= 3 ? stepParam : 1;
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        contactMethod: 'whatsapp',
        city: searchParams.get('city') || '',
        location: '',
        budget: '',
        gender: 'boys',
        occupancy: '1-seater',
        expectedMoveIn: 'immediately',
        requirements: '',
        consent: false
    });
    const [allMessesData, setAllMessesData] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');
    const [phoneError, setPhoneError] = useState('');

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
                            landmark: data.landmark ? data.landmark.trim() : ''
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

    // Get available landmarks for the selected city
    const availableLandmarks = React.useMemo(() => {
        if (!formData.city) return [];

        const cityId = formData.city.toLowerCase();
        const landmarkSet = new Set();

        // 1. Add predefined landmarks for this city
        const predefined = PREDEFINED_CITY_LANDMARKS[cityId] || [];
        predefined.forEach(lm => landmarkSet.add(lm.trim()));

        // 2. Add dynamic landmarks from active messes in this city
        allMessesData.forEach(mess => {
            if (mess.city === cityId && mess.landmark) {
                landmarkSet.add(mess.landmark.trim());
            }
        });

        return Array.from(landmarkSet).sort((a, b) => a.localeCompare(b));
    }, [formData.city, allMessesData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updated = {
                ...prev,
                [name]: value
            };
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
            const inquiryData = {
                ...formData,
                createdAt: serverTimestamp(),
                status: 'new'
            };

            await addDoc(collection(db, "room_inquiries"), inquiryData);

            // Send Telegram Notification
            import('../utils/telegramNotifier').then(({ sendTelegramNotification, telegramTemplates }) => {
                sendTelegramNotification(telegramTemplates.newRoomInquiry(inquiryData));
            });
            
            setIsSuccess(true);
            setFormData({
                name: '', phone: '', contactMethod: 'whatsapp',
                city: '', location: '', budget: '', gender: 'boys',
                occupancy: 'single', expectedMoveIn: 'immediately',
                requirements: '', consent: false
            });
            setSearchParams({}, { replace: true });
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
                    {/* Step indicator */}
                    {!isSuccess && (
                        <div className="text-white/80 text-sm font-medium">
                            Step {step} of 3
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-4 sm:py-8">
                
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
                                            <input
                                                type="text"
                                                name="location"
                                                required
                                                list="popular-areas"
                                                value={formData.location}
                                                onChange={handleChange}
                                                disabled={!formData.city}
                                                placeholder={formData.city ? "e.g. Mansingh Bazar..." : "Select preferred city first"}
                                                className="w-full px-4 py-3 bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                                            />
                                            <datalist id="popular-areas">
                                                {availableLandmarks.map((area, idx) => (
                                                    <option key={idx} value={area} />
                                                ))}
                                            </datalist>
                                        </div>

                                        {/* Budget */}
                                        <div className="space-y-3">
                                            <label className="text-sm font-semibold text-brand-text-dark flex items-center gap-2">
                                                <Banknote size={16} className="text-brand-primary" />
                                                Rental Budget (monthly)
                                            </label>
                                            <select
                                                name="budget"
                                                required
                                                value={formData.budget}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                                            >
                                                <option value="">Select your maximum budget</option>
                                                <option value="<2000">Below ₹2000/mo</option>
                                                <option value="2000-3000">₹2000 - ₹3000/mo</option>
                                                <option value="3000-5000">₹3000 - ₹5000/mo</option>
                                                <option value="5000+">Above ₹5000/mo</option>
                                            </select>
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
                                                {renderRadioCard("occupancy", "any", "Any", <BedDouble size={20} />, formData.occupancy)}
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

                                            {/* Contact Method */}
                                            <div className="space-y-3 pt-2">
                                                <label className="text-sm font-semibold text-brand-text-dark">Preferred Contact Method</label>
                                                <div className="grid grid-cols-2 gap-3" role="radiogroup">
                                                    <button
                                                        type="button"
                                                        role="radio"
                                                        aria-checked={formData.contactMethod === 'whatsapp'}
                                                        onClick={() => setFormData(prev => ({ ...prev, contactMethod: 'whatsapp' }))}
                                                        className={`py-3 px-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${
                                                            formData.contactMethod === 'whatsapp' 
                                                                ? 'bg-green-50 border-green-500 text-green-700 font-semibold' 
                                                                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        <WhatsAppIcon size={18} className={formData.contactMethod === 'whatsapp' ? 'text-green-500' : 'text-gray-400'} />
                                                        WhatsApp
                                                    </button>
                                                    <button
                                                        type="button"
                                                        role="radio"
                                                        aria-checked={formData.contactMethod === 'call'}
                                                        onClick={() => setFormData(prev => ({ ...prev, contactMethod: 'call' }))}
                                                        className={`py-3 px-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${
                                                            formData.contactMethod === 'call' 
                                                                ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold' 
                                                                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        <Phone size={18} className={formData.contactMethod === 'call' ? 'text-blue-500' : ''} />
                                                        Phone Call
                                                    </button>
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
            </div>
        </div>
    );
};

export default BookRoomComingSoon;
