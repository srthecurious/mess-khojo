import React, { useState } from 'react';
import { BedDouble, Phone, Trash2, PhoneCall, PhoneOff, Search, SlidersHorizontal, XCircle } from 'lucide-react';
import { db } from '../../../firebase';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { toMessSlug } from '../../../utils/slugify';
import { getCleanOccupancy } from '../../../utils/occupancy';

const WhatsAppIcon = ({ size = 14, className = "" }) => (
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

const getSuggestions = (inquiry, messesList, roomsList) => {
    if (!messesList || !roomsList || !inquiry.city) return [];
    
    const cityPref = inquiry.city.toLowerCase().trim();
    const genderPref = inquiry.gender || '';
    const occupancyPref = getCleanOccupancy(inquiry.occupancy);
    
    const matchesBudget = (price, budgetRange) => {
        if (!budgetRange) return true;
        const clean = String(budgetRange).replace(/\s/g, '').replace(/₹/g, '');
        if (clean.startsWith('<')) {
            return price < parseFloat(clean.slice(1));
        }
        if (clean.endsWith('+')) {
            return price >= parseFloat(clean.slice(0, -1));
        }
        if (clean.includes('-')) {
            const [min, max] = clean.split('-');
            return price >= parseFloat(min) && price <= parseFloat(max);
        }
        const val = parseFloat(clean);
        return isNaN(val) ? true : price <= val;
    };
    
    const matchesGender = (messType, pref) => {
        if (!pref) return true;
        const p = pref.toLowerCase();
        const types = Array.isArray(messType)
            ? messType
            : messType
                ? [messType]
                : [];
        const lowerTypes = types.map(t => String(t).toLowerCase());
        if (p === 'boys') return lowerTypes.includes('boys') || lowerTypes.includes('both') || lowerTypes.includes('coed');
        if (p === 'girls') return lowerTypes.includes('girls') || lowerTypes.includes('both') || lowerTypes.includes('coed');
        return true;
    };
    
    const candidates = [];
    messesList.forEach(mess => {
        if (mess.hidden) return;
        
        // City match
        const messCity = (mess.city || '').toLowerCase().trim();
        if (messCity !== cityPref) return;
        
        // Gender match
        if (!matchesGender(mess.messType, genderPref)) return;
        
        // Rooms check
        const messRooms = roomsList.filter(room => {
            if (room.messId !== mess.id) return false;
            if (occupancyPref && occupancyPref !== 'any') {
                if (getCleanOccupancy(room.occupancy) !== occupancyPref) return false;
            }
            if (!matchesBudget(parseFloat(room.price), inquiry.budget)) return false;
            if (room.availableCount !== undefined && room.availableCount !== null && Number(room.availableCount) <= 0) return false;
            return true;
        });
        
        if (messRooms.length > 0) {
            candidates.push({
                ...mess,
                matchedRooms: messRooms
            });
        }
    });
    
    // Score based on area/landmark match
    const scored = candidates.map(mess => {
        let score = 0;
        if (inquiry.location) {
            const loc = inquiry.location.toLowerCase().trim();
            const landmark = (mess.landmark || '').toLowerCase().trim();
            const address = (mess.address || '').toLowerCase().trim();
            const name = (mess.name || '').toLowerCase().trim();
            
            if (landmark === loc) {
                score += 10;
            } else if (landmark.includes(loc) || loc.includes(landmark)) {
                score += 5;
            }
            if (address.includes(loc)) {
                score += 3;
            }
            if (name.includes(loc)) {
                score += 2;
            }
        }
        return { mess, score };
    });
    
    scored.sort((a, b) => b.score - a.score);
    return scored.map(item => item.mess).slice(0, 6);
};

const getWhatsAppShareUrl = (inquiry, suggestions) => {
    let msg = `Hello ${inquiry.name || 'there'},\n\n`;
    msg += `Based on your request on MessKhojo, here are the best rooms matching your preferences in ${inquiry.city ? (inquiry.city === 'baleshwar' ? 'Balasore' : inquiry.city.charAt(0).toUpperCase() + inquiry.city.slice(1)) : ''}:\n\n`;
    
    suggestions.forEach((mess, idx) => {
        msg += `${idx + 1}. ${mess.name}\n`;
        if (mess.landmark) msg += `📍 Area: ${mess.landmark}\n`;
        msg += `🔗 Link: https://messkhojo.com/mess/${toMessSlug(mess.name, mess.id)}\n\n`;
    });
    
    msg += `Feel free to contact the mess owner directly or let us know if you need any help!`;
    
    const cleanPhone = inquiry.phone.replace(/\D/g, '');
    const waNumber = cleanPhone.startsWith('91') && cleanPhone.length > 10 ? cleanPhone : '91' + cleanPhone;
    
    return `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;
};

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

const RoomInquiriesTab = ({ roomInquiries, messes, rooms }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [calledFilter, setCalledFilter] = useState('all'); // 'all', 'called', 'not_called'
    const [visibleCount, setVisibleCount] = useState(10);
    const [expandedInquiryId, setExpandedInquiryId] = useState(null);

    const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery);
    const [prevCalledFilter, setPrevCalledFilter] = useState(calledFilter);
    const [prevRoomInquiries, setPrevRoomInquiries] = useState(roomInquiries);

    // Reset pagination when search query, filter, or data changes
    if (searchQuery !== prevSearchQuery || calledFilter !== prevCalledFilter || roomInquiries !== prevRoomInquiries) {
        setPrevSearchQuery(searchQuery);
        setPrevCalledFilter(calledFilter);
        setPrevRoomInquiries(roomInquiries);
        setVisibleCount(10);
    }

    // Toggle Called status in Firestore
    const handleToggleCalled = async (inquiryId, currentCalled) => {
        try {
            await updateDoc(doc(db, "room_inquiries", inquiryId), {
                called: !currentCalled,
                calledAt: !currentCalled ? new Date() : null
            });
        } catch (err) {
            console.error("Failed to update call status:", err);
            alert("Failed to update call status");
        }
    };

    // Filter inquiries based on search and called filter
    const filteredInquiries = roomInquiries.filter(inquiry => {
        const matchesCalled = calledFilter === 'all' || 
            (calledFilter === 'called' && !!inquiry.called) || 
            (calledFilter === 'not_called' && !inquiry.called);

        const q = searchQuery.toLowerCase().trim();
        const matchesSearch = !q ||
            (inquiry.name || '').toLowerCase().includes(q) ||
            (inquiry.phone || '').toLowerCase().includes(q) ||
            (inquiry.city || '').toLowerCase().includes(q) ||
            (inquiry.location || '').toLowerCase().includes(q) ||
            (inquiry.requirements || '').toLowerCase().includes(q) ||
            (inquiry.occupancy || '').toLowerCase().includes(q);

        return matchesCalled && matchesSearch;
    });

    const visibleInquiries = filteredInquiries.slice(0, visibleCount);

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-orange-500">
                    <BedDouble />
                    Find Your Room Requests
                </h2>
                <span className="bg-orange-500/10 text-orange-400 px-3 py-1 rounded-full text-xs font-bold border border-orange-500/20">
                    {filteredInquiries.length} Found
                </span>
            </div>

            {/* Search & Filter Panel */}
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50">
                {/* Search Bar */}
                <div className="flex-grow flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-300 relative group">
                    <Search size={16} className="text-slate-500 shrink-0" />
                    <input
                        type="text"
                        placeholder="Search by name, phone, location, occupancy, requirements..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent text-sm focus:outline-none w-full text-white placeholder-slate-500 pr-6"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 text-slate-500 hover:text-white transition-colors"
                        >
                            <XCircle size={16} />
                        </button>
                    )}
                </div>

                {/* Called Dropdown */}
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 shrink-0">
                    <SlidersHorizontal size={14} className="text-slate-500" />
                    <span className="text-xs font-semibold text-slate-400">Call Track:</span>
                    <select
                        value={calledFilter}
                        onChange={(e) => setCalledFilter(e.target.value)}
                        className="bg-transparent text-slate-200 text-sm focus:outline-none cursor-pointer"
                    >
                        <option value="all" className="bg-slate-900">All</option>
                        <option value="called" className="bg-slate-900">Called</option>
                        <option value="not_called" className="bg-slate-900">Not Called</option>
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
                    visibleInquiries.map(inquiry => {
                        const isCalled = !!inquiry.called;
                        const isExpanded = expandedInquiryId === inquiry.id;
                        const suggestions = isExpanded ? getSuggestions(inquiry, messes, rooms) : [];
                        return (
                            <div key={inquiry.id} className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-sm relative group hover:border-slate-600 transition-colors flex flex-col justify-between">
                                <div>
                                    <button
                                        onClick={async () => {
                                            if (window.confirm("Delete this inquiry?")) {
                                                try {
                                                    await deleteDoc(doc(db, "room_inquiries", inquiry.id));
                                                } catch { alert("Delete failed"); }
                                            }
                                        }}
                                        className="absolute top-4 right-4 p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 border border-transparent hover:border-red-500/20"
                                        title="Delete inquiry"
                                    >
                                        <Trash2 size={16} />
                                    </button>

                                    <div className="mb-4 space-y-1.5">
                                        <h3 className="text-lg font-bold text-white leading-tight">{inquiry.name}</h3>
                                        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
                                            <Phone size={14} className="text-orange-500 shrink-0" />
                                            <a href={`tel:${inquiry.phone}`} className="text-slate-350 hover:text-emerald-400 font-mono text-xs">
                                                {inquiry.phone}
                                            </a>
                                            {inquiry.contactMethod && (
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded border font-black uppercase ${inquiry.contactMethod === 'whatsapp' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                                                    {inquiry.contactMethod.toUpperCase()}
                                                </span>
                                            )}
                                            
                                            {/* Called Badges */}
                                            {isCalled ? (
                                                <span className="text-[9px] px-1.5 py-0.5 rounded border font-black bg-emerald-500/15 text-emerald-400 border-emerald-500/20 flex items-center gap-1 shrink-0 uppercase tracking-wide">
                                                    <PhoneCall size={9} /> Called
                                                </span>
                                            ) : (
                                                <span className="text-[9px] px-1.5 py-0.5 rounded border font-black bg-slate-900 text-slate-450 border-slate-700/80 flex items-center gap-1 shrink-0 uppercase tracking-wide">
                                                    <PhoneOff size={9} /> Not Called
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-3 bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 text-sm">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-500">Location</p>
                                                <p className="text-slate-200 font-semibold">
                                                    {inquiry.city ? `${inquiry.city === 'baleshwar' ? 'Balasore' : inquiry.city.charAt(0).toUpperCase() + inquiry.city.slice(1)}, ` : ''}
                                                    {inquiry.location}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-500">Budget</p>
                                                <p className="text-emerald-400 font-bold">{inquiry.budget}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-slate-500">Occupancy</p>
                                            <p className="text-slate-200 capitalize font-medium">{inquiry.occupancy}</p>
                                        </div>
                                        {inquiry.requirements && (
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-500">Requirements</p>
                                                <p className="text-slate-400 italic">"{inquiry.requirements}"</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-700 flex flex-col gap-3">
                                    {/* Mark Called / Not Called Toggle */}
                                    <button
                                        onClick={() => handleToggleCalled(inquiry.id, isCalled)}
                                        className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 border ${
                                            isCalled
                                                ? 'bg-slate-900 text-slate-400 border-slate-750 hover:bg-slate-750'
                                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                        }`}
                                    >
                                        <PhoneCall size={12} />
                                        {isCalled ? 'Mark as Not Called' : 'Mark as Called'}
                                    </button>

                                    {/* Show/Hide Suggestions Button */}
                                    <button
                                        onClick={() => setExpandedInquiryId(prev => prev === inquiry.id ? null : inquiry.id)}
                                        className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 border ${
                                            isExpanded
                                                ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30 hover:bg-indigo-600/20'
                                                : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20'
                                        }`}
                                    >
                                        <SlidersHorizontal size={12} />
                                        {isExpanded ? 'Hide Suggestions' : 'Show Suggestions'}
                                    </button>

                                    {/* Suggestions Panel */}
                                    {isExpanded && (
                                        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/80 mt-1 space-y-3">
                                            <h4 className="text-xs font-bold text-slate-350 uppercase tracking-wider flex items-center justify-between">
                                                <span>Suggested Messes</span>
                                                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-bold">
                                                    {suggestions.length} Matches
                                                </span>
                                            </h4>
                                            
                                            {suggestions.length === 0 ? (
                                                <p className="text-xs text-slate-500 italic">No matching messes found for this request.</p>
                                            ) : (
                                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                                    {suggestions.map((mess) => (
                                                        <div key={mess.id} className="text-xs p-2 bg-slate-800/80 border border-slate-700/50 rounded-lg flex flex-col gap-1 text-left">
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
                                                            <div className="text-[9px] text-slate-400 flex flex-wrap gap-x-2">
                                                                {mess.matchedRooms.map((r, rIdx) => (
                                                                    <span key={r.id}>
                                                                        {r.occupancy} (₹{r.price}/mo)
                                                                        {rIdx < mess.matchedRooms.length - 1 ? ' | ' : ''}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {suggestions.length > 0 && (
                                                <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
                                                    {inquiry.contactMethod === 'whatsapp' ? (
                                                        <a
                                                            href={getWhatsAppShareUrl(inquiry, suggestions)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                                                        >
                                                            <WhatsAppIcon size={14} className="text-white" />
                                                            Share via WhatsApp
                                                        </a>
                                                    ) : (
                                                        <a
                                                            href={`tel:${inquiry.phone}`}
                                                            className="w-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                                                        >
                                                            <Phone size={14} />
                                                            Call User ({inquiry.phone})
                                                        </a>
                                                    )}
                                                    
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
                                                </div>
                                            )}
                                        </div>
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

            {/* Pagination View More Button */}
            {visibleCount < filteredInquiries.length && (
                <div className="flex justify-center pt-4">
                    <button
                        onClick={() => setVisibleCount(prev => prev + 10)}
                        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700 transition-all hover:scale-105 active:scale-95 shadow-md flex items-center gap-2 text-sm"
                    >
                        View More ({filteredInquiries.length - visibleCount} remaining)
                    </button>
                </div>
            )}
        </div>
    );
};

export default RoomInquiriesTab;
