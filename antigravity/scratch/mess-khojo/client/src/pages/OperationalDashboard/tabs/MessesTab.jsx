import React from 'react';
import { Database, Search, Server, EyeOff, Eye, CheckCircle, TrendingUp, Edit3, MapPin } from 'lucide-react';

const MessesTab = ({
    messes,
    searchQuery,
    setSearchQuery,
    handleToggleVisibility,
    handleToggleSponsored,
    handleEditItem
}) => {
    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <h2 className="text-2xl font-bold flex items-center gap-3 text-indigo-400">
                    <Database size={28} />
                    Mess Directory
                </h2>
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name or address..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none shadow-inner"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {messes.filter(m =>
                    (m.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (m.address || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (m.id || '').toLowerCase().includes(searchQuery.toLowerCase())
                ).sort((a, b) => (a.name || '').localeCompare(b.name || '')).map(mess => (
                    <div key={mess.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 md:p-6 flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-indigo-500/50 transition-all shadow-lg hover:shadow-indigo-500/5">
                        <div className="flex items-center gap-5 w-full md:w-auto">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-2xl bg-slate-700/50 flex items-center justify-center text-indigo-400 overflow-hidden border border-slate-600">
                                    {mess.posterUrl ? (
                                        <img src={mess.posterUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <Server size={24} />
                                    )}
                                </div>
                                {mess.hidden && (
                                    <div className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full shadow-lg border border-rose-600">
                                        <EyeOff size={10} />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    {mess.name || mess.messName || '(No Name)'}
                                    {mess.isUserSourced && (
                                        <span className="text-[10px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20 uppercase font-black">
                                            Sourced
                                        </span>
                                    )}
                                </h3>
                                <p className="text-slate-400 text-sm line-clamp-1 flex items-center gap-1.5">
                                    <MapPin size={12} className="opacity-50" /> {mess.address || mess.landmark || '—'}
                                </p>
                                <p className="text-slate-500 text-[11px] mt-1 font-mono">{mess.id}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                            <button
                                onClick={() => handleToggleVisibility(mess.id, mess.hidden)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${mess.hidden
                                    ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20'
                                    : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'
                                    }`}
                                title={mess.hidden ? "Show Listing" : "Hide Listing"}
                            >
                                {mess.hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                                {mess.hidden ? 'Private' : 'Public'}
                            </button>

                            <button
                                onClick={() => handleToggleSponsored(mess.id, mess.isSponsored)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${mess.isSponsored
                                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20'
                                    : 'bg-slate-700/50 text-slate-400 border-slate-600 hover:bg-slate-700'
                                    }`}
                                title={mess.isSponsored ? "Remove Sponsorship" : "Make Sponsored"}
                            >
                                {mess.isSponsored ? <CheckCircle size={16} /> : <TrendingUp size={16} />}
                                {mess.isSponsored ? 'Sponsored' : 'Sponsor'}
                            </button>

                            <button
                                onClick={() => handleEditItem(mess, 'mess')}
                                className="p-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl transition-all border border-slate-600"
                            >
                                <Edit3 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MessesTab;
