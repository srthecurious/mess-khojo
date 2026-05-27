import React from 'react';
import { Layout, Search, Edit3 } from 'lucide-react';

const RoomsTab = ({
    rooms,
    searchQuery,
    setSearchQuery,
    handleEditItem
}) => {
    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <h2 className="text-2xl font-bold flex items-center gap-3 text-cyan-400">
                    <Layout size={28} />
                    Global Room Inventory
                </h2>
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search by mess name or category..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-cyan-500 outline-none shadow-inner"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.filter(r =>
                    (r.messName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (r.category || "").toLowerCase().includes(searchQuery.toLowerCase())
                ).map(room => (
                    <div key={room.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex flex-col hover:border-cyan-500/50 transition-all shadow-xl group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-cyan-500/10 text-cyan-500 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider border border-cyan-500/20">
                                {room.occupancy} Room
                            </div>
                            <span className="text-slate-500 text-[10px] font-mono">#{room.id.slice(-6)}</span>
                        </div>

                        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">
                            {room.messName}
                        </h3>
                        <p className="text-slate-400 text-xs mb-4 flex items-center gap-1.5 min-h-[16px]">
                            {room.category && <><Layout size={12} className="opacity-50" /> {room.category}</>}
                        </p>

                        <div className="bg-slate-900/50 rounded-xl p-4 mb-5 border border-slate-700/50 flex-grow">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-slate-500 uppercase font-black">Price</span>
                                <span className="text-emerald-400 font-bold">
                                    ₹{room.price}/{room.rentCycle === 'yearly' ? 'yr' : 'mo'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500 uppercase font-black">Availability</span>
                                <span className="text-white font-bold">{room.availableCount} {room.occupancy === 'Single' ? 'Bed' : 'Seats'}</span>
                            </div>
                        </div>

                        <div className="flex gap-2 mt-auto">
                            <button
                                onClick={() => handleEditItem(room, 'room')}
                                className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 py-2.5 rounded-xl text-xs font-bold transition-all border border-slate-600"
                            >
                                <Edit3 size={14} /> Edit
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RoomsTab;
