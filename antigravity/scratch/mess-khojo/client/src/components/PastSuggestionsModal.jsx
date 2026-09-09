import React from 'react';
import { X, Trash2, Calendar, MapPin, User, Banknote, ArrowRight, History, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const formatDate = (isoString) => {
    try {
        const d = new Date(isoString);
        return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) + 
            ' ' + 
            d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } catch {
        return 'Date unknown';
    }
};

const formatCityName = (cityId) => {
    if (!cityId) return '';
    if (cityId === 'baleshwar') return 'Balasore';
    if (cityId === 'jajpur_road') return 'Jajpur Road';
    if (cityId === 'jajpur_town') return 'Jajpur Town';
    if (cityId === 'bhubaneswar') return 'Bhubaneswar';
    if (cityId === 'khordha_town') return 'Khordha Town';
    return cityId.charAt(0).toUpperCase() + cityId.slice(1);
};

const formatOccupancy = (occ) => {
    if (!occ) return '';
    const clean = occ.replace('-seater', '');
    if (clean === '4') return '4+ Seater';
    if (/^\d+$/.test(clean)) return `${clean}-Seater`;
    return occ;
};

const PastSuggestionsModal = ({ isOpen, onClose, pastInquiries, onClearAll, onDeleteItem }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleSelect = (item) => {
        onClose();
        navigate('/find-your-room/results', { state: { inquiry: item.inquiry } });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden relative border border-gray-100/50 animate-scale-up">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-brand-primary/5 to-purple-50/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                            <History size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Past Room Suggestions</h2>
                            <p className="text-xs text-gray-500">Your previous room match requests ({pastInquiries.length})</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {pastInquiries.length > 0 && (
                            <button
                                onClick={onClearAll}
                                className="text-xs text-red-500 hover:text-red-700 font-bold px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                            >
                                Clear All
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-655 hover:bg-gray-100 rounded-full transition-all"
                            title="Close"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-grow overflow-y-auto p-6 space-y-4">
                    {pastInquiries.length === 0 ? (
                        <div className="text-center py-16 px-4">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                <History size={32} className="text-gray-300" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-1">No Past Requests Found</h3>
                            <p className="text-sm text-gray-500 max-w-xs mx-auto">
                                Once you submit a room inquiry, it will appear here for easy reference.
                            </p>
                        </div>
                    ) : (
                        pastInquiries.map((item, idx) => {
                            const { inquiry, submittedAt } = item;
                            const cityName = formatCityName(inquiry.city);
                            const budgetLabel = inquiry.budget 
                                ? `₹${inquiry.budget.replace(/-/g, '–').replace('7000+', '7000+')}` 
                                : '';

                            return (
                                <div 
                                    key={idx}
                                    className="group relative bg-white border border-gray-150 hover:border-brand-primary/40 rounded-2xl p-4 sm:p-5 transition-all hover:shadow-md cursor-pointer flex flex-col justify-between"
                                    onClick={() => handleSelect(item)}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-2.5 flex-grow">
                                            {/* Date / Time */}
                                            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-semibold">
                                                <Calendar size={12} />
                                                {formatDate(submittedAt)}
                                            </div>

                                            {/* Location & Room Info */}
                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                <span className="flex items-center gap-1 text-sm font-bold text-gray-900">
                                                    <MapPin size={13} className="text-brand-primary" />
                                                    {cityName}{inquiry.location ? `, ${inquiry.location}` : ''}
                                                </span>
                                                <span className="text-gray-300 text-xs hidden sm:inline">•</span>
                                                <span className="flex items-center gap-1 text-xs font-semibold text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                                                    <User size={12} className="text-brand-primary" />
                                                    {inquiry.gender ? inquiry.gender.charAt(0).toUpperCase() + inquiry.gender.slice(1) : ''}
                                                </span>
                                                <span className="flex items-center gap-1 text-xs font-semibold text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                                                    {formatOccupancy(inquiry.occupancy)}
                                                </span>
                                            </div>

                                            {/* Budget & requirements */}
                                            <div className="flex flex-col gap-1.5 pt-1">
                                                {budgetLabel && (
                                                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                                                        <Banknote size={13} className="text-emerald-500 shrink-0" />
                                                        Budget: {budgetLabel}/mo
                                                    </span>
                                                )}
                                                {inquiry.requirements && (
                                                    <p className="flex items-start gap-1 text-xs text-gray-500 italic line-clamp-1">
                                                        <MessageSquare size={12} className="text-gray-400 shrink-0 mt-0.5" />
                                                        "{inquiry.requirements}"
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Button & Delete Button */}
                                        <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (window.confirm("Remove this search from history?")) {
                                                        onDeleteItem(idx);
                                                    }
                                                }}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                title="Delete search history item"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                            
                                            <div className="text-brand-primary p-1.5 rounded-lg group-hover:bg-brand-primary/10 transition-colors">
                                                <ArrowRight size={18} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default PastSuggestionsModal;
