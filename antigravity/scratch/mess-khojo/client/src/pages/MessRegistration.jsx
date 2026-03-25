import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Check, Building2, Users, BedDouble, MapPin, Wifi, Phone, Send } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { trackMessRegistration } from '../analytics';
import usePageSEO from '../hooks/usePageSEO';

const MessRegistration = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        messName: '',
        messType: [],
        roomTypes: [],
        rentInfo: {},
        includedInRent: [],
        advancePayment: { type: '', customAmount: '' },
        maintenanceCharge: { taken: false, amount: '', frequency: 'Per Year' },
        vacantRooms: [],
        landmark: '',
        facilities: [],
        phoneNumber: '',
        consent: false
    });

    const totalSteps = 8;

    usePageSEO({
        title: 'Register Your Mess | MessKhojo',
        description: 'Register your boys or ladies mess in Balasore on MessKhojo. Increase zero-broker visibility and get direct student bookings.',
        keywords: 'register mess balasore, list mess online, mess owners balasore, pg registration balasore'
    });

    // Track when user starts registration
    useEffect(() => {
        trackMessRegistration(true);
    }, []);

    const handleNext = () => {
        if (step < totalSteps) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleCheckboxChange = (field, value) => {
        setFormData(prev => {
            const current = prev[field];
            const updated = current.includes(value)
                ? current.filter(item => item !== value)
                : [...current, value];
            return { ...prev, [field]: updated };
        });
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        if (!formData.phoneNumber) {
            alert("Phone number is mandatory!");
            return;
        }

        setLoading(true);
        try {
            const registrationData = {
                ...formData,
                createdAt: serverTimestamp(),
                status: 'pending' // pending operator review
            };

            const docRef = await addDoc(collection(db, 'mess_registrations'), registrationData);

            // Send Telegram Notification
            import('../utils/telegramNotifier').then(({ sendTelegramNotification, telegramTemplates }) => {
                sendTelegramNotification(telegramTemplates.newRegistration(registrationData));
            });

            // Track successful registration
            trackMessRegistration(false, docRef.id);

            setStep(9); // Success step
        } catch (error) {
            console.error("Error submitting registration:", error);
            alert("Failed to submit. Please try again.");
        } finally {
            setLoading(false);
        }
    };



    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-6">
                        <div className="text-center space-y-3">
                            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-[28px] shadow-inner flex items-center justify-center mx-auto mb-2 relative group">
                                <Building2 size={36} className="text-purple-600 group-hover:scale-110 transition-transform" />
                                <div className="absolute -top-2 -right-6 bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] font-extrabold px-3 py-1 rounded-full shadow-lg shadow-red-500/30 animate-pulse transform rotate-12">
                                    100% FREE
                                </div>
                            </div>
                            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 leading-tight">
                                List Your Mess on MessKhojo
                            </h1>
                            <p className="text-gray-500 font-medium">Step 1: What is the name of your mess?</p>
                        </div>
                        <input
                            type="text"
                            value={formData.messName}
                            onChange={(e) => handleChange('messName', e.target.value)}
                            placeholder="Enter mess name..."
                            className="w-full text-xl p-4 border-2 border-purple-100 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all text-center placeholder:text-gray-300"
                            autoFocus
                        />
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users size={32} className="text-blue-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800">Who is it for?</h2>
                            <p className="text-gray-500">Select all that apply</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {['Boys', 'Girls'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => handleCheckboxChange('messType', type)}
                                    className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${formData.messType.includes(type)
                                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-lg shadow-blue-500/10'
                                        : 'border-gray-100 bg-white hover:border-blue-200 text-gray-600'
                                        }`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${formData.messType.includes(type) ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
                                        {formData.messType.includes(type) && <Check size={16} />}
                                    </div>
                                    <span className="font-bold text-lg">{type}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <BedDouble size={32} className="text-emerald-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800">Room Types Available</h2>
                            <p className="text-gray-500">What kind of sharing is available?</p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {['1 Seater', '2 Seater', '3 Seater', '4 Seater', '5 Seater', '6 Seater', '7 Seater'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => handleCheckboxChange('roomTypes', type)}
                                    className={`p-4 rounded-xl border-2 transition-all text-sm font-bold ${formData.roomTypes.includes(type)
                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                        : 'border-gray-100 bg-white hover:border-emerald-200 text-gray-600'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Building2 size={32} className="text-blue-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800">Rooms & Rent Details</h2>
                            <p className="text-gray-500">How much is the monthly rent?</p>
                        </div>
                        <div className="space-y-4">
                            {formData.roomTypes.map(room => (
                                <div key={room} className="flex flex-col gap-2 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                    <label className="font-bold text-gray-700">{room} Rent (₹/month)</label>
                                    <input
                                        type="number"
                                        value={formData.rentInfo[room] || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, rentInfo: { ...prev.rentInfo, [room]: e.target.value } }))}
                                        placeholder={`e.g. ${room.includes('1') ? '5000' : '3000'}`}
                                        className="w-full text-lg p-3 border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <h3 className="font-bold text-gray-800 mb-3">Which rooms are currently vacant? <span className="text-xs text-gray-400 font-normal">(Optional)</span></h3>
                            <div className="flex flex-wrap gap-2">
                                {formData.roomTypes.map(room => (
                                    <button
                                        key={room}
                                        onClick={() => handleCheckboxChange('vacantRooms', room)}
                                        className={`px-4 py-2 rounded-xl border-2 transition-all text-sm font-bold ${formData.vacantRooms.includes(room)
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-100 bg-white hover:border-blue-200 text-gray-600'
                                            }`}
                                    >
                                        {room}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 5:
                return (
                    <div className="space-y-6 max-h-[60vh] overflow-y-auto px-1 pb-4">
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold text-gray-800">Payment & Inclusions</h2>
                            <p className="text-gray-500">What extra charges apply?</p>
                        </div>

                        {/* Included in Rent */}
                        <div className="space-y-3">
                            <h3 className="font-bold text-gray-800">What is included in rent?</h3>
                            <div className="flex flex-wrap gap-2">
                                {['Food Charges', 'Electricity Bills', 'Cleaning Charges'].map(item => (
                                    <button
                                        key={item}
                                        onClick={() => handleCheckboxChange('includedInRent', item)}
                                        className={`px-4 py-2 rounded-xl border-2 transition-all text-sm font-bold flex items-center gap-2 ${formData.includedInRent.includes(item)
                                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                                            : 'border-gray-100 bg-white hover:border-purple-200 text-gray-600'
                                            }`}
                                    >
                                        {formData.includedInRent.includes(item) && <Check size={14} />} {item}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Advance Payment */}
                        <div className="space-y-3 pt-4 border-t border-gray-100">
                            <h3 className="font-bold text-gray-800">Advance Payment Required</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {['1 Month', '2 Months', '3 Months', '4 Months', '5 Months', '6 Months', 'Custom Amount'].map(adv => (
                                    <button
                                        key={adv}
                                        onClick={() => setFormData(prev => ({ ...prev, advancePayment: { ...prev.advancePayment, type: adv } }))}
                                        className={`px-3 py-2 rounded-xl border-2 transition-all text-sm font-bold text-center ${formData.advancePayment.type === adv
                                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                                            : 'border-gray-100 bg-white hover:border-purple-200 text-gray-600'
                                            }`}
                                    >
                                        {adv}
                                    </button>
                                ))}
                            </div>
                            {formData.advancePayment.type === 'Custom Amount' && (
                                <input
                                    type="number"
                                    value={formData.advancePayment.customAmount}
                                    onChange={(e) => setFormData(prev => ({ ...prev, advancePayment: { ...prev.advancePayment, customAmount: e.target.value } }))}
                                    placeholder="Enter advance amount (₹)"
                                    className="w-full text-md p-3 border-2 border-purple-100 rounded-xl focus:border-purple-500 outline-none transition-all mt-2"
                                />
                            )}
                        </div>

                        {/* Maintenance */}
                        <div className="space-y-3 pt-4 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-gray-800">Extra Maintenance Charge?</h3>
                                <div className="flex bg-gray-100 rounded-lg p-1">
                                    <button
                                        onClick={() => setFormData(prev => ({ ...prev, maintenanceCharge: { ...prev.maintenanceCharge, taken: true } }))}
                                        className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${formData.maintenanceCharge.taken ? 'bg-white shadow text-purple-700' : 'text-gray-500'}`}
                                    >
                                        Yes
                                    </button>
                                    <button
                                        onClick={() => setFormData(prev => ({ ...prev, maintenanceCharge: { ...prev.maintenanceCharge, taken: false } }))}
                                        className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${!formData.maintenanceCharge.taken ? 'bg-white shadow text-gray-700' : 'text-gray-500'}`}
                                    >
                                        No
                                    </button>
                                </div>
                            </div>

                            {formData.maintenanceCharge.taken && (
                                <div className="flex gap-2 mt-2">
                                    <input
                                        type="number"
                                        value={formData.maintenanceCharge.amount}
                                        onChange={(e) => setFormData(prev => ({ ...prev, maintenanceCharge: { ...prev.maintenanceCharge, amount: e.target.value } }))}
                                        placeholder="Amount (₹)"
                                        className="flex-1 text-md p-3 border-2 border-purple-100 rounded-xl focus:border-purple-500 outline-none transition-all"
                                    />
                                    <select
                                        value={formData.maintenanceCharge.frequency}
                                        onChange={(e) => setFormData(prev => ({ ...prev, maintenanceCharge: { ...prev.maintenanceCharge, frequency: e.target.value } }))}
                                        className="w-[120px] text-md p-3 border-2 border-purple-100 rounded-xl focus:border-purple-500 outline-none transition-all cursor-pointer bg-white"
                                    >
                                        <option value="Per Year">Per Year</option>
                                        <option value="Per Month">Per Month</option>
                                        <option value="One Time">One Time</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 6:
                return (
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MapPin size={32} className="text-amber-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800">Where is it located?</h2>
                            <p className="text-gray-500">Provide a nearby landmark</p>
                        </div>
                        <input
                            type="text"
                            value={formData.landmark}
                            onChange={(e) => handleChange('landmark', e.target.value)}
                            placeholder="e.g., Near City College Main Gate"
                            className="w-full text-lg p-4 border-2 border-amber-100 rounded-2xl focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all text-center placeholder:text-gray-300"
                            autoFocus
                        />
                    </div>
                );
            case 7:
                return (
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Wifi size={32} className="text-indigo-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800">Facilities Available</h2>
                            <p className="text-gray-500">Select all amenities properly</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {['Wifi', 'AC', 'Food Facility', 'InverterPower'].map(facility => (
                                <button
                                    key={facility}
                                    onClick={() => handleCheckboxChange('facilities', facility)}
                                    className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${formData.facilities.includes(facility)
                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                        : 'border-gray-100 bg-white hover:border-indigo-200 text-gray-600'
                                        }`}
                                >
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${formData.facilities.includes(facility) ? 'bg-indigo-500 text-white' : 'bg-gray-100'}`}>
                                        {formData.facilities.includes(facility) && <Check size={12} />}
                                    </div>
                                    <span className="font-bold">{facility === 'InverterPower' ? 'Inverter' : facility}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 8:
                return (
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Phone size={32} className="text-rose-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800">Contact Number</h2>
                            <p className="text-gray-500">So we can reach out to you</p>
                        </div>
                        <input
                            type="tel"
                            value={formData.phoneNumber}
                            onChange={(e) => handleChange('phoneNumber', e.target.value.replace(/\D/g, '').slice(0, 10))}
                            placeholder="Enter 10-digit number"
                            maxLength="10"
                            className="w-full text-2xl p-4 border-2 border-rose-100 rounded-2xl focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all text-center placeholder:text-gray-300 font-mono tracking-widest"
                            autoFocus
                        />
                        <p className="text-center text-xs text-gray-400">
                            We will verify this number before listing.
                        </p>

                        <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-gray-100 mt-2">
                            <input
                                type="checkbox"
                                id="consent"
                                checked={formData.consent}
                                onChange={(e) => handleChange('consent', e.target.checked)}
                                className="w-5 h-5 accent-brand-primary mt-0.5 cursor-pointer"
                            />
                            <label htmlFor="consent" className="text-sm text-gray-600 cursor-pointer text-left leading-tight">
                                I agree to the <a href="/terms-and-conditions" target="_blank" rel="noopener noreferrer" className="text-brand-primary font-bold hover:underline">Terms & Conditions</a> and <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-brand-primary font-bold hover:underline">Privacy Policy</a>.
                            </label>
                        </div>
                    </div>
                );
            case 9:
                return (
                    <div className="text-center py-12 px-6">
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                            <Check size={48} className="text-green-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-800 mb-4">Submission Received!</h2>
                        <p className="text-gray-600 mb-8 max-w-sm mx-auto">
                            Thank you for registering your mess. Our team will verify the details and contact you at <span className="font-bold text-gray-800">{formData.phoneNumber}</span> shortly.
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors"
                        >
                            Back to Home
                        </button>
                    </div>
                );
            default:
                return null;
        }
    };

    const isStepValid = () => {
        switch (step) {
            case 1: return formData.messName.trim().length > 0;
            case 2: return formData.messType.length > 0;
            case 3: return formData.roomTypes.length > 0;
            case 4:
                return formData.roomTypes.length > 0 && formData.roomTypes.every(room => formData.rentInfo[room] && formData.rentInfo[room].trim().length > 0);
            case 5:
                if (!formData.advancePayment.type) return false;
                if (formData.advancePayment.type === 'Custom Amount' && (!formData.advancePayment.customAmount || formData.advancePayment.customAmount.trim().length === 0)) return false;
                if (formData.maintenanceCharge.taken && (!formData.maintenanceCharge.amount || formData.maintenanceCharge.amount.trim().length === 0)) return false;
                return true;
            case 6: return formData.landmark.trim().length > 0;
            case 7: return formData.facilities.length > 0;
            case 8: return formData.phoneNumber.length === 10 && formData.consent;
            default: return true;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden min-h-[500px] flex flex-col relative">

                {/* Progress Bar */}
                {step < 9 && (
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-100">
                        <div
                            className="h-full bg-brand-primary transition-all duration-300 ease-out"
                            style={{ width: `${(step / 8) * 100}%` }}
                        />
                    </div>
                )}

                {/* Content Area */}
                <div className="flex-1 p-8 flex flex-col justify-center">
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={step}
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="w-full"
                        >
                            {renderStep()}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Navigation Buttons */}
                {step < 9 && (
                    <div className="p-6 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <button
                            onClick={handleBack}
                            disabled={step === 1}
                            className="p-3 text-gray-500 hover:bg-gray-100 rounded-xl disabled:opacity-0 transition-all font-medium flex items-center gap-2"
                        >
                            <ChevronLeft size={20} /> Back
                        </button>

                        {step < 8 ? (
                            <button
                                onClick={handleNext}
                                disabled={!isStepValid()}
                                className="px-6 py-3 bg-brand-primary text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-primary-hover transition-all shadow-lg shadow-brand-primary/20"
                            >
                                Next <ChevronRight size={20} />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={!isStepValid() || loading}
                                className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition-all shadow-lg shadow-green-600/20"
                            >
                                {loading ? 'Submitting...' : 'Submit Form'} <Send size={20} />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessRegistration;
