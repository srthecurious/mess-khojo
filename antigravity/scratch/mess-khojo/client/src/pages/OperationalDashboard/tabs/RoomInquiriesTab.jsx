import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { BedDouble, Phone, Trash2, PhoneCall, PhoneOff, Search, SlidersHorizontal, XCircle, Calendar, Image, MapPin, CheckCircle2, Clock, UserCheck, XSquare, AlertCircle, MessageSquare, Home, Building, GraduationCap, Share2 } from 'lucide-react';
import { db, auth } from '../../../firebase';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { toMessSlug } from '../../../utils/slugify';
import ConfirmDeleteModal from '../../../components/ConfirmDeleteModal';
import { getSuggestions } from '../../../utils/suggestionEngine';
import { useBodyScrollLock } from '../../../hooks/useBodyScrollLock';

const getSuggestionsText = (inquiry, suggestions) => {
    let msg = `Hello ${inquiry.name || 'there'},\n\n`;
    msg += `Based on your request on MessKhojo, here are the best rooms matching your preferences in ${inquiry.city ? (inquiry.city === 'baleshwar' ? 'Balasore' : inquiry.city.charAt(0).toUpperCase() + inquiry.city.slice(1)) : ''}:\n\n`;

    suggestions.forEach((mess, idx) => {
        msg += `${idx + 1}. ${mess.name}\n`;
        if (mess.landmark) msg += `📍 Area: ${mess.landmark}\n`;
        msg += `🔗 Link: https://messkhojo.com/mess/${toMessSlug(mess.name, mess.id)}\n\n`;
    });

    msg += `Feel free to contact the mess owner directly or let us know if you need any help!`;
    return msg;
};

// Reusable Suggestions Panel Component
const SuggestionsPanel = ({ inquiry, suggestions, isCompact = false, onOpenFeedback }) => {
    return (
        <div className={`bg-slate-900/60 p-4 rounded-xl border border-slate-700/80 mt-1 space-y-3 ${isCompact ? 'bg-slate-950/80 p-3 mt-2 border-slate-800/80 text-xs' : ''}`}>
            <h4 className="text-xs font-bold text-slate-350 uppercase tracking-wider flex items-center justify-between">
                <span>Suggested Messes</span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-bold">
                    {suggestions.length} Matches
                </span>
            </h4>

            {suggestions.length === 0 ? (
                <p className="text-xs text-slate-500 italic font-medium">No matching messes found for this request.</p>
            ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {suggestions.map((mess) => (
                        <div key={mess.id} className="text-xs p-2 bg-slate-800/80 border border-slate-700/50 rounded-lg flex gap-3 items-center text-left">
                            {mess.posterUrl ? (
                                <img
                                    src={mess.posterUrl}
                                    alt={mess.name}
                                    className="w-12 h-12 rounded object-cover border border-slate-700 shrink-0"
                                />
                            ) : (
                                <div className="w-12 h-12 bg-slate-900 border border-slate-700 rounded flex items-center justify-center shrink-0 text-slate-650">
                                    <Image size={16} />
                                </div>
                            )}
                            <div className="flex-grow min-w-0">
                                <div className="flex justify-between items-start gap-2">
                                    <a
                                        href={`/mess/${toMessSlug(mess.name, mess.id)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline line-clamp-1"
                                    >
                                        {mess.name}
                                    </a>
                                    <span className="text-[9px] bg-slate-900 text-slate-400 px-1 py-0.5 rounded shrink-0 font-medium">
                                        {mess.landmark || 'No Landmark'}
                                    </span>
                                </div>
                                <div className="text-[9px] text-slate-400 flex flex-wrap gap-x-2 mt-0.5">
                                    {mess.matchedRooms.map((r, rIdx) => (
                                        <span key={r.id}>
                                            {r.occupancy} (₹{r.price}/mo)
                                            {rIdx < mess.matchedRooms.length - 1 ? ' | ' : ''}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="pt-2 border-t border-slate-800/30 flex flex-col gap-2">
                <div className="flex gap-2">
                    <a
                        href={`tel:${inquiry.phone}`}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                    >
                        <Phone size={14} />
                        Call User
                    </a>
                    {onOpenFeedback && (
                        <button
                            onClick={onOpenFeedback}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                        >
                            <MessageSquare size={14} />
                            Log Feedback
                        </button>
                    )}
                </div>

                {suggestions.length > 0 && (
                    <button
                        onClick={() => {
                            const text = getSuggestionsText(inquiry, suggestions);
                            navigator.clipboard.writeText(text);
                            alert('Suggestions text copied to clipboard!');
                        }}
                        className="w-full bg-slate-800 hover:bg-slate-750 active:scale-95 text-slate-350 border border-slate-700 py-1.5 px-3 rounded-lg text-[10px] font-bold transition-all"
                    >
                        Copy Suggestions Text
                    </button>
                )}
            </div>
        </div>
    );
};

const RoomInquiriesTab = ({ roomInquiries, messes, rooms }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [calledFilter, setCalledFilter] = useState('all'); // 'all', 'not_called', 'joined_messkhojo', 'still_searching', 'found_elsewhere', 'no_answer', 'callback'
    const [cityFilter, setCityFilter] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [datePreset, setDatePreset] = useState('all');
    const [visibleCount, setVisibleCount] = useState(10);
    const [expandedInquiryId, setExpandedInquiryId] = useState(null);
    const [expandedHistoryId, setExpandedHistoryId] = useState(null);
    const [expandedHistoryInquiryId, setExpandedHistoryInquiryId] = useState(null);

    // Call Feedback Modal State
    const [feedbackModalGroup, setFeedbackModalGroup] = useState(null);
    const [callStatus, setCallStatus] = useState('connected'); // 'connected', 'no_answer', 'busy_switched_off', 'invalid_number'
    const [feedbackStatus, setFeedbackStatus] = useState('still_searching'); // 'joined_messkhojo', 'still_searching', 'found_elsewhere', 'cancelled', 'callback'
    const [currentStaying, setCurrentStaying] = useState('home'); // 'home', 'mess', 'other'
    const [userCategory, setUserCategory] = useState(''); // 'college', 'competitive_exams', 'job_aspirant', 'others'
    const [userCategoryDetail, setUserCategoryDetail] = useState(''); // detail text for college, custom reason for others, or exam/job info
    const [discoverySource, setDiscoverySource] = useState(''); // 'search_engine', 'mess_owner', 'instagram', 'friends', 'posters_banners', 'others'
    const [discoverySourceDetail, setDiscoverySourceDetail] = useState(''); // detail text if others
    const [joinedMessId, setJoinedMessId] = useState('');
    const [isUnlistedMess, setIsUnlistedMess] = useState(false);
    const [unlistedMessName, setUnlistedMessName] = useState('');
    const [showAllCitiesMesses, setShowAllCitiesMesses] = useState(false);
    const [feedbackNotes, setFeedbackNotes] = useState('');
    const [followUpDate, setFollowUpDate] = useState('');
    const [messSearchQuery, setMessSearchQuery] = useState('');
    const [isSavingFeedback, setIsSavingFeedback] = useState(false);
    const [deletingFeedbackGroup, setDeletingFeedbackGroup] = useState(null);
    const [isDeletingFeedback, setIsDeletingFeedback] = useState(false);

    // Reset pagination when user changes a filter
    const [prevFilter, setPrevFilter] = useState({ searchQuery, calledFilter, cityFilter, startDate, endDate });
    if (
        prevFilter.searchQuery !== searchQuery ||
        prevFilter.calledFilter !== calledFilter ||
        prevFilter.cityFilter !== cityFilter ||
        prevFilter.startDate !== startDate ||
        prevFilter.endDate !== endDate
    ) {
        setPrevFilter({ searchQuery, calledFilter, cityFilter, startDate, endDate });
        setVisibleCount(10);
    }

    useBodyScrollLock(!!feedbackModalGroup);

    // Extract unique cities from inquiries
    const uniqueCities = Array.from(
        new Set(
            roomInquiries
                .map(inquiry => (inquiry.city || '').trim().toLowerCase())
                .filter(Boolean)
        )
    ).sort();

    const getLocalDateString = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handlePresetChange = (e) => {
        const preset = e.target.value;
        setDatePreset(preset);

        const today = new Date();
        if (preset === 'all') {
            setStartDate('');
            setEndDate('');
        } else if (preset === 'today') {
            const todayStr = getLocalDateString(today);
            setStartDate(todayStr);
            setEndDate(todayStr);
        } else if (preset === 'yesterday') {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = getLocalDateString(yesterday);
            setStartDate(yesterdayStr);
            setEndDate(yesterdayStr);
        } else if (preset === '7days') {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(today.getDate() - 6);
            setStartDate(getLocalDateString(sevenDaysAgo));
            setEndDate(getLocalDateString(today));
        } else if (preset === '30days') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(today.getDate() - 29);
            setStartDate(getLocalDateString(thirtyDaysAgo));
            setEndDate(getLocalDateString(today));
        }
    };

    const handleDateInputChange = (start, end) => {
        setStartDate(start);
        setEndDate(end);

        const today = new Date();
        const todayStr = getLocalDateString(today);

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = getLocalDateString(yesterday);

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 6);
        const sevenDaysAgoStr = getLocalDateString(sevenDaysAgo);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 29);
        const thirtyDaysAgoStr = getLocalDateString(thirtyDaysAgo);

        if (!start && !end) {
            setDatePreset('all');
        } else if (start === todayStr && end === todayStr) {
            setDatePreset('today');
        } else if (start === yesterdayStr && end === yesterdayStr) {
            setDatePreset('yesterday');
        } else if (start === sevenDaysAgoStr && end === todayStr) {
            setDatePreset('7days');
        } else if (start === thirtyDaysAgoStr && end === todayStr) {
            setDatePreset('30days');
        } else {
            setDatePreset('custom');
        }
    };

    // Open Feedback Modal for a group
    const handleOpenFeedbackModal = (group) => {
        const latestInq = group.latest;
        setFeedbackModalGroup(group);
        setCallStatus(latestInq.callStatus || 'connected');
        setFeedbackStatus(latestInq.feedbackStatus || 'still_searching');
        setCurrentStaying(latestInq.currentStaying || 'home');
        setUserCategory(latestInq.userCategory || '');
        setUserCategoryDetail(latestInq.userCategoryDetail || '');
        setDiscoverySource(latestInq.discoverySource || '');
        setDiscoverySourceDetail(latestInq.discoverySourceDetail || '');
        setJoinedMessId(latestInq.joinedMessId || '');
        setIsUnlistedMess(!!latestInq.isUnlistedMess);
        setUnlistedMessName(latestInq.unlistedMessName || '');
        setFeedbackNotes(latestInq.feedbackNotes || '');
        setFollowUpDate(latestInq.followUpDate || '');
        setMessSearchQuery('');
        setShowAllCitiesMesses(false);
    };

    // Save Call Feedback to Firestore
    const handleSaveFeedback = async () => {
        if (!feedbackModalGroup) return;
        setIsSavingFeedback(true);
        try {
            let finalJoinedMessName = null;
            let finalJoinedMessId = null;

            if (callStatus === 'connected') {
                if (isUnlistedMess && unlistedMessName.trim()) {
                    finalJoinedMessName = `${unlistedMessName.trim()} (Not Listed)`;
                    finalJoinedMessId = null;
                } else if (joinedMessId) {
                    const selectedMess = messes.find(m => m.id === joinedMessId);
                    finalJoinedMessName = selectedMess ? selectedMess.name : (feedbackModalGroup.latest.joinedMessName || null);
                    finalJoinedMessId = joinedMessId;
                }
            }

            const updateData = {
                called: true,
                calledAt: new Date(),
                callStatus,
                feedbackStatus: callStatus === 'connected' ? feedbackStatus : 'no_answer',
                currentStaying: callStatus === 'connected' ? currentStaying : null,
                userCategory: callStatus === 'connected' ? (userCategory || null) : null,
                userCategoryDetail: (callStatus === 'connected' && userCategory) ? (userCategoryDetail.trim() || null) : null,
                discoverySource: callStatus === 'connected' ? (discoverySource || null) : null,
                discoverySourceDetail: (callStatus === 'connected' && discoverySource) ? (discoverySourceDetail.trim() || null) : null,
                isUnlistedMess: (callStatus === 'connected' && isUnlistedMess),
                unlistedMessName: (callStatus === 'connected' && isUnlistedMess) ? unlistedMessName.trim() : null,
                joinedMessId: finalJoinedMessId,
                joinedMessName: finalJoinedMessName,
                feedbackNotes: feedbackNotes || '',
                followUpDate: (callStatus === 'connected' && feedbackStatus === 'callback') ? followUpDate || null : null,
                lastCallOperator: auth.currentUser?.email || 'Operator'
            };

            await Promise.all(feedbackModalGroup.all.map(inq =>
                updateDoc(doc(db, "room_inquiries", inq.id), updateData)
            ));

            setFeedbackModalGroup(null);
        } catch (err) {
            console.error("Failed to save feedback:", err);
            alert("Failed to save feedback");
        } finally {
            setIsSavingFeedback(false);
        }
    };

    // Clear/Delete Call Feedback Log for a group
    const confirmDeleteFeedbackLog = async () => {
        if (!deletingFeedbackGroup) return;
        try {
            setIsDeletingFeedback(true);
            const updateData = {
                called: false,
                calledAt: null,
                callStatus: null,
                feedbackStatus: null,
                currentStaying: null,
                userCategory: null,
                userCategoryDetail: null,
                discoverySource: null,
                discoverySourceDetail: null,
                isUnlistedMess: null,
                unlistedMessName: null,
                joinedMessId: null,
                joinedMessName: null,
                feedbackNotes: null,
                followUpDate: null,
                lastCallOperator: null
            };

            await Promise.all(deletingFeedbackGroup.all.map(inq =>
                updateDoc(doc(db, "room_inquiries", inq.id), updateData)
            ));

            setDeletingFeedbackGroup(null);
            setFeedbackModalGroup(null);
        } catch (err) {
            console.error("Failed to delete feedback log:", err);
            alert("Failed to delete feedback log");
        } finally {
            setIsDeletingFeedback(false);
        }
    };


    // Helper to get messes in the request's city/district
    const getCityMesses = (inquiry, messesList, showAll) => {
        if (showAll || !inquiry) return messesList;
        const rawCity = (inquiry.city || inquiry.district || inquiry.location || '').toLowerCase().trim();
        if (!rawCity) return messesList;

        return messesList.filter(m => {
            const mDist = (m.district || m.city || '').toLowerCase().trim();
            const mAddr = (m.address || '').toLowerCase().trim();
            const mLand = (m.landmark || '').toLowerCase().trim();
            const mName = (m.name || '').toLowerCase().trim();

            // 1. If looking for Balasore / Baleshwar: include all messes except those explicitly belonging to other districts
            if (rawCity === 'baleshwar' || rawCity.includes('balasore') || rawCity.includes('remuna')) {
                if (mDist === 'bhadrak' || mDist === 'mayurbhanj' || mDist === 'cuttack' || mDist === 'bhubaneswar' || mDist === 'puril') {
                    return false;
                }
                return true;
            }

            // 2. If looking for Baripada / Mayurbhanj:
            if (rawCity === 'baripada' || rawCity.includes('mayurbhanj')) {
                return mDist === 'mayurbhanj' || mDist === 'baripada' || mAddr.includes('mayurbhanj') || mAddr.includes('baripada') || mLand.includes('baripada');
            }

            // 3. If looking for Bhadrak / Basudevpur:
            if (rawCity.includes('bhadrak') || rawCity.includes('basudevpur')) {
                return mDist === 'bhadrak' || mDist === 'basudevpur' || mAddr.includes('bhadrak') || mAddr.includes('basudevpur') || mLand.includes('bhadrak');
            }

            // Fallback fuzzy match
            return mDist.includes(rawCity) || mAddr.includes(rawCity) || mLand.includes(rawCity) || mName.includes(rawCity);
        });
    };

    // Filter inquiries based on search and feedback filter
    const filteredInquiries = roomInquiries.filter(inquiry => {
        let matchesCalled = true;
        if (calledFilter === 'not_called') {
            matchesCalled = !inquiry.called;
        } else if (calledFilter === 'joined_messkhojo') {
            matchesCalled = inquiry.called && inquiry.feedbackStatus === 'joined_messkhojo';
        } else if (calledFilter === 'still_searching') {
            matchesCalled = inquiry.called && (inquiry.feedbackStatus === 'still_searching' || !inquiry.feedbackStatus);
        } else if (calledFilter === 'found_elsewhere') {
            matchesCalled = inquiry.called && (inquiry.feedbackStatus === 'found_elsewhere' || inquiry.feedbackStatus === 'cancelled');
        } else if (calledFilter === 'no_answer') {
            matchesCalled = inquiry.called && (inquiry.callStatus === 'no_answer' || inquiry.callStatus === 'busy_switched_off' || inquiry.callStatus === 'invalid_number');
        } else if (calledFilter === 'callback') {
            matchesCalled = inquiry.called && inquiry.feedbackStatus === 'callback';
        }

        const inqCity = (inquiry.city || inquiry.district || '').trim().toLowerCase();
        const normCity = inqCity === 'baleshwar' ? 'balasore' : inqCity;
        const matchesCity = cityFilter === 'all' || normCity === cityFilter || inqCity === cityFilter;

        const q = searchQuery.toLowerCase().trim();
        const matchesSearch = !q ||
            (inquiry.name || '').toLowerCase().includes(q) ||
            (inquiry.phone || '').toLowerCase().includes(q) ||
            (inquiry.city || '').toLowerCase().includes(q) ||
            (inquiry.location || '').toLowerCase().includes(q) ||
            (inquiry.requirements || '').toLowerCase().includes(q) ||
            (inquiry.occupancy || '').toLowerCase().includes(q) ||
            (inquiry.gender || '').toLowerCase().includes(q) ||
            (inquiry.feedbackNotes || '').toLowerCase().includes(q) ||
            (inquiry.userCategory || '').toLowerCase().includes(q) ||
            (inquiry.userCategoryDetail || '').toLowerCase().includes(q) ||
            (inquiry.discoverySource || '').toLowerCase().includes(q) ||
            (inquiry.discoverySourceDetail || '').toLowerCase().includes(q) ||
            (inquiry.joinedMessName || '').toLowerCase().includes(q);

        // Date range filtering
        let matchesDate = true;
        if (startDate || endDate) {
            let inquiryDate = null;
            if (inquiry.createdAt) {
                if (inquiry.createdAt.seconds) {
                    inquiryDate = new Date(inquiry.createdAt.seconds * 1000);
                } else if (inquiry.createdAt.toDate && typeof inquiry.createdAt.toDate === 'function') {
                    inquiryDate = inquiry.createdAt.toDate();
                } else {
                    inquiryDate = new Date(inquiry.createdAt);
                }
            }

            if (!inquiryDate || isNaN(inquiryDate.getTime())) {
                matchesDate = false;
            } else {
                if (startDate) {
                    const start = new Date(startDate + "T00:00:00");
                    if (inquiryDate < start) matchesDate = false;
                }
                if (endDate) {
                    const end = new Date(endDate + "T23:59:59");
                    if (inquiryDate > end) matchesDate = false;
                }
            }
        }

        return matchesCalled && matchesCity && matchesSearch && matchesDate;
    });

    // Group inquiries by phone number (user)
    const groupedMap = new Map();
    filteredInquiries.forEach(inquiry => {
        const phoneKey = (inquiry.phone || '').replace(/\D/g, '') || inquiry.id;
        if (!groupedMap.has(phoneKey)) {
            groupedMap.set(phoneKey, []);
        }
        groupedMap.get(phoneKey).push(inquiry);
    });

    const groupedInquiries = Array.from(groupedMap.entries()).map(([phoneKey, list]) => {
        list.sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
        });
        return {
            id: phoneKey,
            latest: list[0],
            all: list,
            count: list.length
        };
    });

    // Sort grouped user cards by most recent request date
    groupedInquiries.sort((a, b) => {
        const timeA = a.latest.createdAt?.seconds || 0;
        const timeB = b.latest.createdAt?.seconds || 0;
        return timeB - timeA;
    });

    const visibleInquiries = groupedInquiries.slice(0, visibleCount);
    const totalRequestsCount = filteredInquiries.length;

    // Helper for rendering status badge
    const renderFeedbackBadge = (inquiry) => {
        if (!inquiry.called) {
            return (
                <span className="text-[9px] px-2 py-0.5 rounded border font-black bg-slate-900 text-slate-400 border-slate-700 flex items-center gap-1 shrink-0 uppercase tracking-wide">
                    <PhoneOff size={9} /> Not Called
                </span>
            );
        }

        if (inquiry.callStatus && inquiry.callStatus !== 'connected') {
            if (inquiry.callStatus === 'no_answer') {
                return (
                    <span className="text-[9px] px-2 py-0.5 rounded border font-black bg-rose-500/15 text-rose-400 border-rose-500/30 flex items-center gap-1 shrink-0 uppercase tracking-wide">
                        <PhoneCall size={9} /> No Answer
                    </span>
                );
            }
            if (inquiry.callStatus === 'busy_switched_off') {
                return (
                    <span className="text-[9px] px-2 py-0.5 rounded border font-black bg-orange-500/15 text-orange-400 border-orange-500/30 flex items-center gap-1 shrink-0 uppercase tracking-wide">
                        <PhoneOff size={9} /> Busy / Switched Off
                    </span>
                );
            }
            return (
                <span className="text-[9px] px-2 py-0.5 rounded border font-black bg-red-500/15 text-red-400 border-red-500/30 flex items-center gap-1 shrink-0 uppercase tracking-wide">
                    <XSquare size={9} /> Invalid Number
                </span>
            );
        }

        const status = inquiry.feedbackStatus || 'still_searching';
        if (status === 'joined_messkhojo') {
            return (
                <span className="text-[9px] px-2 py-0.5 rounded border font-black bg-emerald-500/15 text-emerald-400 border-emerald-500/30 flex items-center gap-1 shrink-0 uppercase tracking-wide">
                    <CheckCircle2 size={9} /> Joined: {inquiry.joinedMessName || 'MessKhojo'}
                </span>
            );
        }
        if (status === 'found_elsewhere') {
            return (
                <span className="text-[9px] px-2 py-0.5 rounded border font-black bg-blue-500/15 text-blue-400 border-blue-500/30 flex items-center gap-1 shrink-0 uppercase tracking-wide">
                    <UserCheck size={9} /> Found Elsewhere
                </span>
            );
        }
        if (status === 'cancelled') {
            return (
                <span className="text-[9px] px-2 py-0.5 rounded border font-black bg-slate-700 text-slate-350 border-slate-600 flex items-center gap-1 shrink-0 uppercase tracking-wide">
                    <XSquare size={9} /> Request Cancelled
                </span>
            );
        }
        if (status === 'callback') {
            return (
                <span className="text-[9px] px-2 py-0.5 rounded border font-black bg-purple-500/15 text-purple-400 border-purple-500/30 flex items-center gap-1 shrink-0 uppercase tracking-wide">
                    <Clock size={9} /> Callback: {inquiry.followUpDate || 'Scheduled'}
                </span>
            );
        }
        return (
            <span className="text-[9px] px-2 py-0.5 rounded border font-black bg-amber-500/15 text-amber-400 border-amber-500/30 flex items-center gap-1 shrink-0 uppercase tracking-wide">
                <AlertCircle size={9} /> Still Searching
            </span>
        );
    };

    // Calculate city messes for the active feedback modal
    const activeInquiry = feedbackModalGroup?.latest;
    const cityMesses = getCityMesses(activeInquiry, messes, showAllCitiesMesses);
    const filteredCityMesses = cityMesses.filter(m =>
        !messSearchQuery ||
        m.name.toLowerCase().includes(messSearchQuery.toLowerCase()) ||
        (m.landmark || '').toLowerCase().includes(messSearchQuery.toLowerCase()) ||
        (m.address || '').toLowerCase().includes(messSearchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header / Stats Title */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-orange-500/10 text-orange-400 rounded-xl border border-orange-500/20">
                        <BedDouble size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Find Your Room Requests</h2>
                        <p className="text-xs text-slate-400">Student room inquiries & feedback call tracking</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl">
                        {groupedInquiries.length} Users ({totalRequestsCount} Requests)
                    </span>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Search Bar */}
                <div className="flex-1 min-w-[240px] relative">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name, phone, location, occupancy, notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                        >
                            <XCircle size={14} />
                        </button>
                    )}
                </div>

                {/* Date Filter */}
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 shrink-0">
                    <Calendar size={14} className="text-slate-500" />
                    <span className="text-xs font-semibold text-slate-400">Dates:</span>
                    <select
                        value={datePreset}
                        onChange={handlePresetChange}
                        className="bg-transparent text-slate-200 text-sm focus:outline-none cursor-pointer"
                    >
                        <option value="all" style={{ backgroundColor: '#1e293b', color: '#f1f5f9' }}>All Time</option>
                        <option value="today" style={{ backgroundColor: '#1e293b', color: '#f1f5f9' }}>Today</option>
                        <option value="yesterday" style={{ backgroundColor: '#1e293b', color: '#f1f5f9' }}>Yesterday</option>
                        <option value="7days" style={{ backgroundColor: '#1e293b', color: '#f1f5f9' }}>Last 7 Days</option>
                        <option value="30days" style={{ backgroundColor: '#1e293b', color: '#f1f5f9' }}>Last 30 Days</option>
                        <option value="custom" style={{ backgroundColor: '#1e293b', color: '#f1f5f9' }}>Custom Range</option>
                    </select>

                    {datePreset === 'custom' && (
                        <div className="flex items-center gap-1.5 ml-2 border-l border-slate-700 pl-2">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => handleDateInputChange(e.target.value, endDate)}
                                className="bg-slate-800 text-slate-200 text-xs rounded border border-slate-700 px-2 py-1 focus:outline-none focus:border-orange-500"
                            />
                            <span className="text-xs text-slate-500">to</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => handleDateInputChange(startDate, e.target.value)}
                                className="bg-slate-800 text-slate-200 text-xs rounded border border-slate-700 px-2 py-1 focus:outline-none focus:border-orange-500"
                            />
                            {(startDate || endDate) && (
                                <button
                                    onClick={() => {
                                        setStartDate('');
                                        setEndDate('');
                                        setDatePreset('all');
                                    }}
                                    className="text-slate-500 hover:text-white transition-colors ml-1 shrink-0"
                                    title="Clear dates"
                                >
                                    <XCircle size={14} />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Call Track Filter */}
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 shrink-0">
                    <SlidersHorizontal size={14} className="text-slate-500" />
                    <span className="text-xs font-semibold text-slate-400">Call Track:</span>
                    <select
                        value={calledFilter}
                        onChange={(e) => setCalledFilter(e.target.value)}
                        className="bg-transparent text-slate-200 text-sm focus:outline-none cursor-pointer"
                    >
                        <option value="all" style={{ backgroundColor: '#1e293b', color: '#f1f5f9' }}>All Requests</option>
                        <option value="not_called" style={{ backgroundColor: '#1e293b', color: '#f1f5f9' }}>New / Not Called</option>
                        <option value="joined_messkhojo" style={{ backgroundColor: '#1e293b', color: '#f1f5f9' }}>Joined Mess</option>
                        <option value="still_searching" style={{ backgroundColor: '#1e293b', color: '#f1f5f9' }}>Still Searching</option>
                        <option value="callback" style={{ backgroundColor: '#1e293b', color: '#f1f5f9' }}>Follow-up Scheduled</option>
                        <option value="found_elsewhere" style={{ backgroundColor: '#1e293b', color: '#f1f5f9' }}>Found Elsewhere / Cancelled</option>
                        <option value="no_answer" style={{ backgroundColor: '#1e293b', color: '#f1f5f9' }}>No Answer / Busy</option>
                    </select>
                </div>

                {/* City Dropdown */}
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 shrink-0">
                    <MapPin size={14} className="text-slate-500" />
                    <span className="text-xs font-semibold text-slate-400">City:</span>
                    <select
                        value={cityFilter}
                        onChange={(e) => setCityFilter(e.target.value)}
                        className="bg-transparent text-slate-200 text-sm focus:outline-none cursor-pointer"
                    >
                        <option value="all" style={{ backgroundColor: '#1e293b', color: '#f1f5f9' }}>All Cities</option>
                        {uniqueCities.map(cityName => (
                            <option key={cityName} value={cityName} style={{ backgroundColor: '#1e293b', color: '#f1f5f9' }}>
                                {cityName === 'baleshwar' ? 'Balasore' : cityName.charAt(0).toUpperCase() + cityName.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Grid display */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleInquiries.length === 0 ? (
                    <div className="col-span-full text-center py-20 text-slate-500 bg-slate-800/50 rounded-2xl border border-slate-700 border-dashed">
                        No room inquiries found matching your filters.
                    </div>
                ) : (
                    visibleInquiries.map(group => {
                        const inquiry = group.latest;
                        const isExpanded = expandedInquiryId === group.id;
                        const suggestions = isExpanded ? getSuggestions(inquiry, messes, rooms) : [];
                        const cityNameDisplay = inquiry.city ? (inquiry.city === 'baleshwar' ? 'Balasore' : inquiry.city.charAt(0).toUpperCase() + inquiry.city.slice(1)) : '';
                        return (
                            <div key={group.id} className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-sm relative group hover:border-slate-600 transition-colors flex flex-col justify-between">
                                <div>
                                    <button
                                        onClick={async () => {
                                            if (window.confirm(`Delete all ${group.count} requests from this user?`)) {
                                                try {
                                                    await Promise.all(group.all.map(inq => deleteDoc(doc(db, "room_inquiries", inq.id))));
                                                } catch { alert("Delete failed"); }
                                            }
                                        }}
                                        className="absolute top-4 right-4 p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 border border-transparent hover:border-red-500/20"
                                        title="Delete all inquiries"
                                    >
                                        <Trash2 size={16} />
                                    </button>

                                    <div className="mb-4 space-y-2">
                                        <div className="flex items-center justify-between gap-2 pr-6">
                                            <h3 className="text-lg font-bold text-white leading-tight">{inquiry.name}</h3>
                                            {group.count > 1 && (
                                                <span className="text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full font-black shrink-0 animate-pulse">
                                                    {group.count} Requests
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-450">
                                            <Phone size={14} className="text-orange-500 shrink-0" />
                                            <a href={`tel:${inquiry.phone}`} className="text-slate-350 hover:text-emerald-400 font-mono text-xs font-bold">
                                                {inquiry.phone}
                                            </a>

                                            {/* Status Badge */}
                                            {renderFeedbackBadge(inquiry)}
                                        </div>
                                    </div>

                                    <div className="space-y-3 bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 text-sm">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-500">Location</p>
                                                <p className="text-slate-200 font-semibold">
                                                    {cityNameDisplay ? `${cityNameDisplay}, ` : ''}
                                                    {inquiry.location}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-500">Budget</p>
                                                <p className="text-emerald-400 font-bold">{inquiry.budget}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-500">Occupancy</p>
                                                <p className="text-slate-200 capitalize font-medium">{inquiry.occupancy}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-500">Gender</p>
                                                <p className="text-orange-400 capitalize font-bold">
                                                    {inquiry.gender ? (inquiry.gender.charAt(0).toUpperCase() + inquiry.gender.slice(1)) : 'Any'}
                                                </p>
                                            </div>
                                        </div>
                                        {inquiry.requirements && (
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-500">Requirements</p>
                                                <p className="text-slate-400 italic">"{inquiry.requirements}"</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Latest Operator Feedback Note Box */}
                                    {inquiry.called && (inquiry.feedbackNotes || inquiry.lastCallOperator || inquiry.currentStaying || inquiry.joinedMessName || inquiry.userCategory) && (
                                        <div className="mt-3 bg-slate-950/80 p-3 rounded-lg border border-slate-700/70 text-xs space-y-1.5">
                                            <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold border-b border-slate-800 pb-1">
                                                <span>Operator Feedback Log</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-500">{inquiry.lastCallOperator || 'Operator'}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteFeedbackLog(group)}
                                                        className="text-slate-500 hover:text-red-400 p-0.5 rounded transition-colors"
                                                        title="Delete this feedback log"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </div>

                                            {inquiry.userCategory && (
                                                <div className="text-[11px] font-medium flex items-center gap-1.5 text-slate-300">
                                                    <span className="text-amber-400 font-semibold flex items-center gap-1">
                                                        <GraduationCap size={12} /> Purpose:
                                                    </span>
                                                    <span>
                                                        {inquiry.userCategory === 'college' && (
                                                            `College: ${inquiry.userCategoryDetail || 'Looking for College'}`
                                                        )}
                                                        {inquiry.userCategory === 'competitive_exams' && (
                                                            `Competitive Exams${inquiry.userCategoryDetail ? ` (${inquiry.userCategoryDetail})` : ''}`
                                                        )}
                                                        {inquiry.userCategory === 'job_aspirant' && (
                                                            `Job Aspirant${inquiry.userCategoryDetail ? ` (${inquiry.userCategoryDetail})` : ''}`
                                                        )}
                                                        {inquiry.userCategory === 'others' && (
                                                            `${inquiry.userCategoryDetail || 'Others'}`
                                                        )}
                                                    </span>
                                                </div>
                                            )}

                                            {inquiry.discoverySource && (
                                                <div className="text-[11px] font-medium flex items-center gap-1.5 text-slate-300">
                                                    <span className="text-sky-400 font-semibold flex items-center gap-1">
                                                        <Share2 size={12} /> Source:
                                                    </span>
                                                    <span>
                                                        {inquiry.discoverySource === 'search_engine' && 'Google / Search Engine'}
                                                        {inquiry.discoverySource === 'mess_owner' && 'Mess Owner / Hostel'}
                                                        {inquiry.discoverySource === 'instagram' && 'Instagram / Social Media'}
                                                        {inquiry.discoverySource === 'friends' && 'Friends / Word of Mouth'}
                                                        {inquiry.discoverySource === 'posters_banners' && 'Poster / Banner / Pamphlet'}
                                                        {inquiry.discoverySource === 'others' && (inquiry.discoverySourceDetail ? inquiry.discoverySourceDetail : 'Others')}
                                                    </span>
                                                </div>
                                            )}

                                            {inquiry.currentStaying && (
                                                <div className="text-[11px] font-medium flex items-center gap-1 text-slate-300">
                                                    {inquiry.currentStaying === 'home' ? (
                                                        <span className="text-blue-400 flex items-center gap-1 font-semibold"><Home size={11} /> Staying at Home</span>
                                                    ) : inquiry.currentStaying === 'mess' ? (
                                                        <span className="text-emerald-400 flex items-center gap-1 font-semibold"><Building size={11} /> Staying in Mess: {inquiry.joinedMessName || 'Mess'}</span>
                                                    ) : (
                                                        <span className="text-purple-400 font-semibold">Staying: Other / PG</span>
                                                    )}
                                                </div>
                                            )}

                                            {inquiry.feedbackNotes && (
                                                <p className="text-slate-300 text-xs italic">"{inquiry.feedbackNotes}"</p>
                                            )}
                                            {inquiry.followUpDate && (
                                                <div className="text-[10px] text-purple-400 font-bold flex items-center gap-1">
                                                    <Clock size={10} /> Follow-up Date: {inquiry.followUpDate}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* History collapsible list */}
                                    {group.count > 1 && (
                                        <div className="mt-3">
                                            <button
                                                onClick={() => setExpandedHistoryId(prev => prev === group.id ? null : group.id)}
                                                className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg"
                                            >
                                                <span>{expandedHistoryId === group.id ? 'Hide' : 'Show'} Request History ({group.count - 1} more)</span>
                                            </button>

                                            {expandedHistoryId === group.id && (
                                                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto pr-1 border-t border-slate-700/50 pt-2 animate-fadeIn">
                                                    {group.all.slice(1).map(oldInq => {
                                                        const oldCityDisplay = oldInq.city ? (oldInq.city === 'baleshwar' ? 'Balasore' : oldInq.city.charAt(0).toUpperCase() + oldInq.city.slice(1)) : '';
                                                        return (
                                                            <div key={oldInq.id} className="text-xs p-2.5 bg-slate-900/60 border border-slate-700/60 rounded-lg space-y-1 relative group/history">
                                                                <button
                                                                    onClick={async () => {
                                                                        if (window.confirm("Delete this historical request?")) {
                                                                            try {
                                                                                await deleteDoc(doc(db, "room_inquiries", oldInq.id));
                                                                            } catch { alert("Delete failed"); }
                                                                        }
                                                                    }}
                                                                    className="absolute top-1.5 right-1.5 p-1 text-slate-500 hover:text-red-400 rounded transition-colors opacity-0 group-hover/history:opacity-100"
                                                                    title="Delete this historical request"
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                                <div className="text-[10px] text-slate-500 font-medium flex justify-between">
                                                                    <span>Submitted: {oldInq.createdAt?.seconds ? new Date(oldInq.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown'}</span>
                                                                    {renderFeedbackBadge(oldInq)}
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                                                                    <div>
                                                                        <span className="text-[9px] text-slate-500 uppercase font-bold">Loc: </span>
                                                                        <span className="text-slate-300 font-medium text-[11px]">
                                                                            {oldCityDisplay ? `${oldCityDisplay}, ` : ''}{oldInq.location}
                                                                        </span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-[9px] text-slate-500 uppercase font-bold">Budget: </span>
                                                                        <span className="text-emerald-450 font-semibold text-[11px]">{oldInq.budget}</span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-[9px] text-slate-500 uppercase font-bold">Occupancy: </span>
                                                                        <span className="text-slate-300 capitalize text-[11px]">{oldInq.occupancy}</span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-[9px] text-slate-500 uppercase font-bold">Gender: </span>
                                                                        <span className="text-orange-400 capitalize text-[11px] font-semibold">{oldInq.gender ? (oldInq.gender.charAt(0).toUpperCase() + oldInq.gender.slice(1)) : 'Any'}</span>
                                                                    </div>
                                                                </div>
                                                                {oldInq.requirements && (
                                                                    <div className="border-t border-slate-800/50 pt-1 mt-1 text-[11px] text-slate-400 italic">
                                                                        "{oldInq.requirements}"
                                                                    </div>
                                                                )}

                                                                <button
                                                                    onClick={() => setExpandedHistoryInquiryId(prev => prev === oldInq.id ? null : oldInq.id)}
                                                                    className={`w-full mt-2 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 border ${expandedHistoryInquiryId === oldInq.id
                                                                            ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30 hover:bg-indigo-600/20'
                                                                            : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20'
                                                                        }`}
                                                                >
                                                                    <SlidersHorizontal size={10} />
                                                                    {expandedHistoryInquiryId === oldInq.id ? 'Hide Suggestions' : 'Show Suggestions'}
                                                                </button>

                                                                {expandedHistoryInquiryId === oldInq.id && (
                                                                    <SuggestionsPanel
                                                                        inquiry={oldInq}
                                                                        suggestions={getSuggestions(oldInq, messes, rooms)}
                                                                        isCompact={true}
                                                                        onOpenFeedback={() => handleOpenFeedbackModal(group)}
                                                                    />
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-700 flex flex-col gap-2">
                                    <div className="flex gap-2">
                                        <a
                                            href={`tel:${inquiry.phone}`}
                                            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                                        >
                                            <Phone size={14} />
                                            Call User
                                        </a>

                                        <button
                                            onClick={() => handleOpenFeedbackModal(group)}
                                            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                                        >
                                            <MessageSquare size={14} />
                                            Log Feedback
                                        </button>
                                    </div>

                                    {/* Show/Hide Suggestions Button */}
                                    <button
                                        onClick={() => setExpandedInquiryId(prev => prev === group.id ? null : group.id)}
                                        className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 border ${isExpanded
                                                ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30 hover:bg-indigo-600/20'
                                                : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20'
                                            }`}
                                    >
                                        <SlidersHorizontal size={12} />
                                        {isExpanded ? 'Hide Suggestions' : 'Show Suggestions'}
                                    </button>

                                    {/* Suggestions Panel */}
                                    {isExpanded && (
                                        <SuggestionsPanel
                                            inquiry={inquiry}
                                            suggestions={suggestions}
                                            onOpenFeedback={() => handleOpenFeedbackModal(group)}
                                        />
                                    )}

                                    <div className="text-[10px] text-slate-500 flex justify-between items-center">
                                        <span>Submitted: {inquiry.createdAt?.seconds ? new Date(inquiry.createdAt.seconds * 1000).toLocaleString() : 'Just now'}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Log Feedback Modal */}
            {feedbackModalGroup && createPortal(
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-2xl space-y-4 relative text-slate-200 animate-fadeIn custom-scrollbar">
                        <button
                            onClick={() => setFeedbackModalGroup(null)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                        >
                            <XCircle size={20} />
                        </button>

                        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                                <MessageSquare size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Log Call Feedback</h3>
                                <p className="text-xs text-slate-400">
                                    User: <strong className="text-white">{feedbackModalGroup.latest.name}</strong> ({feedbackModalGroup.latest.phone})
                                </p>
                            </div>
                        </div>

                        {/* Call Outcome Selection */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Call Outcome
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: 'connected', label: 'Connected & Talked', icon: PhoneCall, color: 'emerald' },
                                    { id: 'no_answer', label: 'No Answer', icon: PhoneOff, color: 'rose' },
                                    { id: 'busy_switched_off', label: 'Busy / Switched Off', icon: AlertCircle, color: 'orange' },
                                    { id: 'invalid_number', label: 'Invalid Number', icon: XSquare, color: 'red' }
                                ].map(opt => {
                                    const IconComp = opt.icon;
                                    const isSelected = callStatus === opt.id;
                                    return (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => setCallStatus(opt.id)}
                                            className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                                                isSelected
                                                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                                                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                                            }`}
                                        >
                                            <IconComp size={14} />
                                            <span className="line-clamp-1">{opt.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* User Feedback Status (Only when connected) */}
                        {callStatus === 'connected' && (
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    User Status / Result
                                </label>
                                <div className="space-y-1.5">
                                    {[
                                        { id: 'still_searching', label: 'Still Searching (Active Lead)' },
                                        { id: 'joined_messkhojo', label: 'Joined Mess via MessKhojo' },
                                        { id: 'found_elsewhere', label: 'Found Mess Elsewhere' },
                                        { id: 'cancelled', label: 'Cancelled / Not Needed' },
                                        { id: 'callback', label: 'Schedule Follow-up Call' }
                                    ].map(opt => (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => setFeedbackStatus(opt.id)}
                                            className={`w-full py-2 px-3 rounded-xl border text-xs font-bold text-left transition-all ${
                                                feedbackStatus === opt.id
                                                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                                                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Current Staying Location (Where is user currently staying?) */}
                        {callStatus === 'connected' && (
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Where is user currently staying?
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'home', label: 'At Home' },
                                        { id: 'mess', label: 'Mess / Hostel' },
                                        { id: 'other', label: 'Other / PG' }
                                    ].map(opt => (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => setCurrentStaying(opt.id)}
                                            className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                                                currentStaying === opt.id
                                                    ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                                                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* User Purpose / Looking For (College, Exams, Job, Others) */}
                        {callStatus === 'connected' && (
                            <div className="space-y-1.5 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                                <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider">
                                    Looking For / Purpose
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: 'college', label: 'Looking for College' },
                                        { id: 'competitive_exams', label: 'Competitive Exams' },
                                        { id: 'job_aspirant', label: 'Job Aspirant' },
                                        { id: 'others', label: 'Others' }
                                    ].map(opt => (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => {
                                                if (userCategory === opt.id) {
                                                    setUserCategory('');
                                                    setUserCategoryDetail('');
                                                } else {
                                                    setUserCategory(opt.id);
                                                    setUserCategoryDetail('');
                                                }
                                            }}
                                            className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between ${
                                                userCategory === opt.id
                                                    ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                                                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                                            }`}
                                        >
                                            <span className="truncate">{opt.label}</span>
                                        </button>
                                    ))}
                                </div>

                                {userCategory === 'college' && (
                                    <div className="pt-1.5 space-y-1 animate-fadeIn">
                                        <label className="block text-[11px] font-bold text-amber-300">
                                            Which college are they looking for?
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Enter college name (e.g. FM University, VSSUT, OUTR)..."
                                            value={userCategoryDetail}
                                            onChange={(e) => setUserCategoryDetail(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                                            autoFocus
                                        />
                                    </div>
                                )}

                                {userCategory === 'others' && (
                                    <div className="pt-1.5 space-y-1 animate-fadeIn">
                                        <label className="block text-[11px] font-bold text-amber-300">
                                            Specify Reason / Details:
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Type custom reason here..."
                                            value={userCategoryDetail}
                                            onChange={(e) => setUserCategoryDetail(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                                            autoFocus
                                        />
                                    </div>
                                )}

                                {userCategory === 'competitive_exams' && (
                                    <div className="pt-1.5 space-y-1 animate-fadeIn">
                                        <label className="block text-[11px] font-bold text-slate-300">
                                            Target Exam (Optional):
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. UPSC, OPSC, Banking, GATE, NEET..."
                                            value={userCategoryDetail}
                                            onChange={(e) => setUserCategoryDetail(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                                        />
                                    </div>
                                )}

                                {userCategory === 'job_aspirant' && (
                                    <div className="pt-1.5 space-y-1 animate-fadeIn">
                                        <label className="block text-[11px] font-bold text-slate-300">
                                            Job / Field Details (Optional):
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. IT Sector, Private Job, Internship..."
                                            value={userCategoryDetail}
                                            onChange={(e) => setUserCategoryDetail(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Where did you find out about MessKhojo? */}
                        {callStatus === 'connected' && (
                            <div className="space-y-1.5 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                                <label className="block text-xs font-bold text-sky-400 uppercase tracking-wider">
                                    Where did they find about MessKhojo?
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: 'search_engine', label: 'Google / Search Engine' },
                                        { id: 'mess_owner', label: 'Mess Owner / Hostel' },
                                        { id: 'instagram', label: 'Instagram / Social Media' },
                                        { id: 'friends', label: 'Friends / Word of Mouth' },
                                        { id: 'posters_banners', label: 'Poster / Banner' },
                                        { id: 'others', label: 'Others' }
                                    ].map(opt => (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => {
                                                if (discoverySource === opt.id) {
                                                    setDiscoverySource('');
                                                    setDiscoverySourceDetail('');
                                                } else {
                                                    setDiscoverySource(opt.id);
                                                    setDiscoverySourceDetail('');
                                                }
                                            }}
                                            className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between ${
                                                discoverySource === opt.id
                                                    ? 'bg-sky-600 text-white border-sky-500 shadow-md'
                                                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                                            }`}
                                        >
                                            <span className="truncate">{opt.label}</span>
                                        </button>
                                    ))}
                                </div>

                                {discoverySource === 'others' && (
                                    <div className="pt-1.5 space-y-1 animate-fadeIn">
                                        <label className="block text-[11px] font-bold text-sky-300">
                                            Specify Source / Details:
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Enter how they found us..."
                                            value={discoverySourceDetail}
                                            onChange={(e) => setDiscoverySourceDetail(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                                            autoFocus
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Mess Selector (When staying in Mess OR joined Mess) */}
                        {callStatus === 'connected' && (currentStaying === 'mess' || feedbackStatus === 'joined_messkhojo' || feedbackStatus === 'found_elsewhere') && (
                            <div className="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                                <div className="flex items-center justify-between gap-2">
                                    <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wider">
                                        Mess / Hostel Name
                                    </label>

                                    {/* Toggle Listed vs Unlisted */}
                                    <div className="flex bg-slate-900 border border-slate-700 rounded-lg p-0.5 text-[10px] font-bold">
                                        <button
                                            type="button"
                                            onClick={() => setIsUnlistedMess(false)}
                                            className={`px-2 py-0.5 rounded transition-all ${!isUnlistedMess ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            Listed Mess
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsUnlistedMess(true)}
                                            className={`px-2 py-0.5 rounded transition-all ${isUnlistedMess ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            Unlisted Mess
                                        </button>
                                    </div>
                                </div>

                                {isUnlistedMess ? (
                                    <div className="space-y-1">
                                        <input
                                            type="text"
                                            placeholder="Enter unlisted mess name (e.g. Sri Ram Mess)..."
                                            value={unlistedMessName}
                                            onChange={(e) => setUnlistedMessName(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                                        />
                                        <span className="text-[10px] text-amber-400 font-semibold block">
                                            * Will be saved with "(Not Listed)" tag.
                                        </span>
                                    </div>
                                ) : (
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-slate-400">
                                                Messes in <strong className="text-white">{feedbackModalGroup?.latest?.city ? (feedbackModalGroup.latest.city === 'baleshwar' ? 'Balasore' : feedbackModalGroup.latest.city) : 'City'}</strong> ({filteredCityMesses.length} found):
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setShowAllCitiesMesses(prev => !prev)}
                                                className="text-[10px] text-indigo-400 hover:underline font-semibold"
                                            >
                                                {showAllCitiesMesses ? 'Filter by City' : 'Show All Cities Messes'}
                                            </button>
                                        </div>

                                        <div className="relative">
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Type mess name or area to search..."
                                                value={messSearchQuery}
                                                onChange={(e) => setMessSearchQuery(e.target.value)}
                                                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                                            />
                                        </div>

                                        <div className="max-h-36 overflow-y-auto border border-slate-700 rounded-xl p-1 bg-slate-900 space-y-1 custom-scrollbar">
                                            {filteredCityMesses.map(m => (
                                                <button
                                                    key={m.id}
                                                    type="button"
                                                    onClick={() => setJoinedMessId(m.id)}
                                                    className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex justify-between items-center ${
                                                        joinedMessId === m.id
                                                            ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 font-bold'
                                                            : 'hover:bg-slate-800 text-slate-300'
                                                    }`}
                                                >
                                                    <span className="truncate">{m.name}</span>
                                                    <span className="text-[10px] text-slate-500 shrink-0 ml-2">{m.landmark || m.district || 'Mess'}</span>
                                                </button>
                                            ))}
                                            {filteredCityMesses.length === 0 && (
                                                <p className="text-[11px] text-slate-500 italic p-2 text-center">No messes found matching "{messSearchQuery}".</p>
                                            )}
                                        </div>

                                        {joinedMessId && (
                                            <div className="text-[11px] text-emerald-400 font-bold flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg">
                                                <span>Selected: {messes.find(m => m.id === joinedMessId)?.name}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setJoinedMessId('')}
                                                    className="text-slate-400 hover:text-white"
                                                >
                                                    <XCircle size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* If Callback Scheduled, select date */}
                        {callStatus === 'connected' && feedbackStatus === 'callback' && (
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-purple-400 uppercase tracking-wider">
                                    Follow-up Call Date
                                </label>
                                <input
                                    type="date"
                                    value={followUpDate}
                                    onChange={(e) => setFollowUpDate(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                                />
                            </div>
                        )}

                        {/* Operator Notes */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Operator Notes
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Add notes (e.g. Preferred 2 sharing in Mansingh Bazar, suggested BDM Boys Mess on call)..."
                                value={feedbackNotes}
                                onChange={(e) => setFeedbackNotes(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                            {feedbackModalGroup.latest.called && (
                                <button
                                    type="button"
                                    onClick={() => setDeletingFeedbackGroup(feedbackModalGroup)}
                                    className="py-2.5 px-3 bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30 font-bold rounded-xl text-xs transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                                    title="Delete this feedback log"
                                >
                                    <Trash2 size={14} /> Clear Log
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setFeedbackModalGroup(null)}
                                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveFeedback}
                                disabled={isSavingFeedback}
                                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                                {isSavingFeedback ? 'Saving...' : 'Save Feedback'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Pagination View More Button */}
            {visibleCount < groupedInquiries.length && (
                <div className="flex justify-center pt-4">
                    <button
                        onClick={() => setVisibleCount(prev => prev + 10)}
                        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700 transition-all hover:scale-105 active:scale-95 shadow-md flex items-center gap-2 text-sm"
                    >
                        View More ({groupedInquiries.length - visibleCount} remaining)
                    </button>
                </div>
            )}

            {/* Confirmation Warning Modal for clearing feedback log */}
            <ConfirmDeleteModal
                isOpen={!!deletingFeedbackGroup}
                onClose={() => setDeletingFeedbackGroup(null)}
                onConfirm={confirmDeleteFeedbackLog}
                title="Clear Call Feedback Log"
                itemName={deletingFeedbackGroup ? `${deletingFeedbackGroup.latest?.userName || 'User'} (${deletingFeedbackGroup.latest?.userPhone})` : ''}
                description="Are you sure you want to clear this call feedback log? This will reset the call outreach status for this user."
                loading={isDeletingFeedback}
            />
        </div>
    );
};

export default RoomInquiriesTab;
