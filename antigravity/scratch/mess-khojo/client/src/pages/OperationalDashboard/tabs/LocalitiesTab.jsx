import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { DISTRICTS_CONFIG } from '../../../context/DistrictContext';
import { MapPin, Plus, X, Save, Loader2, Check, AlertCircle } from 'lucide-react';

const LocalitiesTab = () => {
    // Collect all cities from all districts into a flat list
    const allCities = Object.values(DISTRICTS_CONFIG).flatMap(district =>
        district.cities.map(city => ({ ...city, districtId: district.id, districtName: district.name }))
    );

    const [selectedCityId, setSelectedCityId] = useState(allCities[0]?.id || '');
    const [localitiesConfig, setLocalitiesConfig] = useState({});
    const [localitiesLoading, setLocalitiesLoading] = useState(true);
    const [newLocality, setNewLocality] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null); // { type: 'success' | 'error', msg: string }
    const [pendingChanges, setPendingChanges] = useState(false);

    // Subscribe to Firestore localities config
    useEffect(() => {
        const unsub = onSnapshot(
            doc(db, 'app_config', 'localities'),
            (snap) => {
                if (snap.exists()) {
                    setLocalitiesConfig(snap.data());
                } else {
                    setLocalitiesConfig({});
                }
                setLocalitiesLoading(false);
            },
            (err) => {
                console.warn('LocalitiesTab: Firestore error:', err.message);
                setLocalitiesLoading(false);
            }
        );
        return () => unsub();
    }, []);

    // Current localities for the selected city (from local state)
    const currentLocalities = localitiesConfig[selectedCityId] || [];

    const handleAddLocality = () => {
        const trimmed = newLocality.trim();
        if (!trimmed) return;
        if (currentLocalities.map(l => l.toLowerCase()).includes(trimmed.toLowerCase())) {
            setSaveStatus({ type: 'error', msg: `"${trimmed}" already exists in this city.` });
            setTimeout(() => setSaveStatus(null), 3000);
            return;
        }
        setLocalitiesConfig(prev => ({
            ...prev,
            [selectedCityId]: [...(prev[selectedCityId] || []), trimmed]
        }));
        setNewLocality('');
        setPendingChanges(true);
    };

    const handleRemoveLocality = (name) => {
        setLocalitiesConfig(prev => ({
            ...prev,
            [selectedCityId]: (prev[selectedCityId] || []).filter(l => l !== name)
        }));
        setPendingChanges(true);
    };

    const handleSave = async () => {
        setSaving(true);
        setSaveStatus(null);
        try {
            await setDoc(doc(db, 'app_config', 'localities'), localitiesConfig);
            setSaveStatus({ type: 'success', msg: 'Localities saved successfully!' });
            setPendingChanges(false);
            setTimeout(() => setSaveStatus(null), 3000);
        } catch (err) {
            console.error('LocalitiesTab save error:', err);
            setSaveStatus({ type: 'error', msg: 'Failed to save. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleAddLocality();
    };

    const selectedCity = allCities.find(c => c.id === selectedCityId);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <MapPin className="text-purple-400" size={22} />
                        Manage Localities
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                        Configure the official locality list that partners and users can select from.
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving || !pendingChanges}
                    className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all text-sm shadow-lg shadow-purple-600/20"
                >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {/* Save Status */}
            {saveStatus && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold ${
                    saveStatus.type === 'success'
                        ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                        : 'bg-red-500/10 border border-red-500/30 text-red-400'
                }`}>
                    {saveStatus.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                    {saveStatus.msg}
                </div>
            )}

            {/* Pending Changes Banner */}
            {pendingChanges && !saveStatus && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    <AlertCircle size={16} />
                    You have unsaved changes. Click "Save Changes" to persist them.
                </div>
            )}

            {/* City Selector */}
            <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Select City / Town
                </label>
                <div className="flex flex-wrap gap-2">
                    {allCities.map(city => (
                        <button
                            key={city.id}
                            onClick={() => setSelectedCityId(city.id)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                                selectedCityId === city.id
                                    ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/20'
                                    : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-purple-500/50 hover:text-white'
                            }`}
                        >
                            <span className="text-xs text-slate-400 mr-1">{city.districtName} /</span>
                            {city.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Localities Panel */}
            <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 space-y-5">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-sm">
                        Localities for{' '}
                        <span className="text-purple-400">{selectedCity?.name}</span>
                        <span className="ml-2 px-2 py-0.5 bg-slate-700 rounded-full text-xs text-slate-300 font-normal">
                            {currentLocalities.length} total
                        </span>
                    </h3>
                </div>

                {localitiesLoading ? (
                    <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
                        <Loader2 size={16} className="animate-spin" /> Loading localities...
                    </div>
                ) : (
                    <>
                        {/* Locality Pills */}
                        {currentLocalities.length === 0 ? (
                            <div className="text-slate-500 text-sm py-4 text-center border border-dashed border-slate-600 rounded-xl">
                                No localities configured for this city yet. Add one below.
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {[...currentLocalities].sort((a, b) => a.localeCompare(b)).map(name => (
                                    <div
                                        key={name}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-full text-sm text-slate-200 group"
                                    >
                                        <MapPin size={12} className="text-purple-400 shrink-0" />
                                        <span>{name}</span>
                                        <button
                                            onClick={() => handleRemoveLocality(name)}
                                            className="ml-1 text-slate-500 hover:text-red-400 transition-colors"
                                            title={`Remove ${name}`}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add Locality */}
                        <div className="flex gap-2 pt-3 border-t border-slate-700">
                            <input
                                type="text"
                                value={newLocality}
                                onChange={e => setNewLocality(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Add new locality (e.g. Mansingh Bazar)..."
                                className="flex-1 bg-slate-900 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-slate-500"
                            />
                            <button
                                onClick={handleAddLocality}
                                disabled={!newLocality.trim()}
                                className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-all"
                            >
                                <Plus size={16} />
                                Add
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-300 space-y-1">
                <p className="font-bold text-blue-200">How localities work</p>
                <p>• Partners and users select from these official localities when registering a mess or submitting a room request.</p>
                <p>• Pre-existing messes use their migrated <code className="bg-slate-700 px-1 rounded text-xs">locality</code> value (copied from their old landmark text) and will be standardised when the mess is next edited.</p>
                <p>• Deleting a locality here does <strong>not</strong> remove it from existing mess documents — it only prevents future selection.</p>
            </div>
        </div>
    );
};

export default LocalitiesTab;
