import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { STATIC_DISTRICTS_CONFIG, FALLBACK_LOCALITIES } from '../../../context/DistrictContext';
import { MapPin, Plus, X, Save, Loader2, Check, AlertCircle, Globe, Building2, ChevronDown, ChevronRight, Pencil, Trash2, GripVertical, ToggleLeft, ToggleRight, Navigation, Upload } from 'lucide-react';

// ─── Sub-section Tabs ────────────────────────────────────────────────────────
const SUB_TABS = [
    { id: 'districts', label: 'Districts', icon: Globe },
    { id: 'cities', label: 'Cities', icon: Building2 },
    { id: 'localities', label: 'Localities / Landmarks', icon: MapPin },
];

// ─── Main Component ──────────────────────────────────────────────────────────
const LocationManagerTab = () => {
    const [subTab, setSubTab] = useState('districts');

    // ── Live Firestore State ────────────────────────────────────────────────
    const [districtsConfig, setDistrictsConfig] = useState(STATIC_DISTRICTS_CONFIG);
    const [localitiesConfig, setLocalitiesConfig] = useState(FALLBACK_LOCALITIES);
    const [loading, setLoading] = useState(true);
    const [localitiesLoading, setLocalitiesLoading] = useState(true);

    // ── Pending Changes Tracking ────────────────────────────────────────────
    const [pendingDistricts, setPendingDistricts] = useState(false);
    const [pendingLocalities, setPendingLocalities] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null);

    // Subscribe to app_config/districts
    useEffect(() => {
        const unsub = onSnapshot(
            doc(db, 'app_config', 'districts'),
            (snap) => {
                if (snap.exists() && snap.data()?.districts) {
                    const raw = snap.data().districts;
                    // Merge with static fallback so nothing ever disappears
                    const merged = { ...STATIC_DISTRICTS_CONFIG };
                    Object.entries(raw).forEach(([key, val]) => {
                        merged[key] = {
                            ...merged[key],
                            ...val,
                            id: key,
                            cities: Array.isArray(val.cities) ? val.cities : (merged[key]?.cities || []),
                            landmarks: Array.isArray(val.landmarks) ? val.landmarks : (merged[key]?.landmarks || []),
                        };
                    });
                    setDistrictsConfig(merged);
                } else {
                    setDistrictsConfig(STATIC_DISTRICTS_CONFIG);
                }
                setLoading(false);
            },
            (err) => {
                console.warn('[LocationManager] districts load error:', err.message);
                setLoading(false);
            }
        );
        return () => unsub();
    }, []);

    // Subscribe to app_config/localities
    useEffect(() => {
        const unsub = onSnapshot(
            doc(db, 'app_config', 'localities'),
            (snap) => {
                if (snap.exists()) {
                    setLocalitiesConfig({ ...FALLBACK_LOCALITIES, ...snap.data() });
                } else {
                    setLocalitiesConfig(FALLBACK_LOCALITIES);
                }
                setLocalitiesLoading(false);
            },
            (err) => {
                console.warn('[LocationManager] localities load error:', err.message);
                setLocalitiesLoading(false);
            }
        );
        return () => unsub();
    }, []);

    // ── Save Districts to Firestore ─────────────────────────────────────────
    const handleSaveDistricts = async () => {
        setSaving(true);
        setSaveStatus(null);
        try {
            // Convert to plain serializable object
            const payload = {};
            Object.entries(districtsConfig).forEach(([key, dist]) => {
                payload[key] = {
                    id: dist.id || key,
                    name: dist.name || key,
                    active: dist.active ?? true,
                    order: dist.order ?? 99,
                    heroTitle: dist.heroTitle || `Find Your Comfortable Stay in ${dist.name}`,
                    heroSubtitle: dist.heroSubtitle || 'Mess Dhundo, Ghar Baithe',
                    gpsCenter: dist.gpsCenter || { lat: 0, lng: 0 },
                    cities: (dist.cities || []).map(c => ({
                        id: c.id,
                        name: c.name,
                        ...(c.busStand ? { busStand: c.busStand } : {}),
                        ...(c.landmarks && Array.isArray(c.landmarks) ? { landmarks: c.landmarks } : {}),
                    })),
                    landmarks: (dist.landmarks || []).map(l =>
                        typeof l === 'string' ? { name: l, type: 'locality' } : l
                    ),
                };
            });
            await setDoc(doc(db, 'app_config', 'districts'), { districts: payload, updatedAt: new Date().toISOString() }, { merge: false });
            setSaveStatus({ type: 'success', msg: 'Districts & cities saved to Firestore!' });
            setPendingDistricts(false);
        } catch (err) {
            console.error('Save districts error:', err);
            setSaveStatus({ type: 'error', msg: `Failed to save: ${err.message}` });
        } finally {
            setSaving(false);
            setTimeout(() => setSaveStatus(null), 4000);
        }
    };

    // ── Save Localities to Firestore ────────────────────────────────────────
    const handleSaveLocalities = async () => {
        setSaving(true);
        setSaveStatus(null);
        try {
            await setDoc(doc(db, 'app_config', 'localities'), localitiesConfig, { merge: true });
            setSaveStatus({ type: 'success', msg: 'Localities saved to Firestore!' });
            setPendingLocalities(false);
        } catch (err) {
            console.error('Save localities error:', err);
            setSaveStatus({ type: 'error', msg: `Failed to save: ${err.message}` });
        } finally {
            setSaving(false);
            setTimeout(() => setSaveStatus(null), 4000);
        }
    };

    // ── Seed Defaults ───────────────────────────────────────────────────────
    const handleSeedDefaults = async () => {
        if (!window.confirm('This will overwrite the Firestore districts document with the current hardcoded defaults. Continue?')) return;
        setDistrictsConfig(STATIC_DISTRICTS_CONFIG);
        setPendingDistricts(true);
        // Also reset localities
        setLocalitiesConfig(FALLBACK_LOCALITIES);
        setPendingLocalities(true);
    };

    const hasPendingChanges = pendingDistricts || pendingLocalities;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Globe className="text-cyan-400" size={22} />
                        Location Manager
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                        Manage districts, cities, and localities. Changes sync to both the website and mobile app in real time.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSeedDefaults}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm font-bold transition-all border border-slate-600"
                    >
                        <Upload size={14} />
                        Seed Defaults
                    </button>
                    <button
                        onClick={async () => {
                            if (pendingDistricts) await handleSaveDistricts();
                            if (pendingLocalities) await handleSaveLocalities();
                            if (!pendingDistricts && !pendingLocalities) {
                                // Force save both
                                await handleSaveDistricts();
                                await handleSaveLocalities();
                            }
                        }}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all text-sm shadow-lg shadow-cyan-600/20"
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {saving ? 'Saving...' : 'Save All Changes'}
                    </button>
                </div>
            </div>

            {/* Status Toasts */}
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

            {hasPendingChanges && !saveStatus && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    <AlertCircle size={16} />
                    You have unsaved changes. Click &quot;Save All Changes&quot; to persist them to Firestore.
                </div>
            )}

            {/* Sub-tabs */}
            <div className="flex gap-2 bg-slate-800 p-1.5 rounded-2xl border border-slate-700">
                {SUB_TABS.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setSubTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                subTab === tab.id
                                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
                                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                            }`}
                        >
                            <Icon size={16} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20 text-slate-400">
                    <Loader2 size={28} className="animate-spin mr-3" /> Loading configuration...
                </div>
            ) : (
                <>
                    {subTab === 'districts' && (
                        <DistrictsSubTab
                            districtsConfig={districtsConfig}
                            setDistrictsConfig={setDistrictsConfig}
                            setPendingDistricts={setPendingDistricts}
                        />
                    )}
                    {subTab === 'cities' && (
                        <CitiesSubTab
                            districtsConfig={districtsConfig}
                            setDistrictsConfig={setDistrictsConfig}
                            setPendingDistricts={setPendingDistricts}
                        />
                    )}
                    {subTab === 'localities' && (
                        <LocalitiesSubTab
                            districtsConfig={districtsConfig}
                            localitiesConfig={localitiesConfig}
                            setLocalitiesConfig={setLocalitiesConfig}
                            setPendingLocalities={setPendingLocalities}
                            loading={localitiesLoading}
                        />
                    )}
                </>
            )}
        </div>
    );
};


// ─── DISTRICTS SUB-TAB ──────────────────────────────────────────────────────
const DistrictsSubTab = ({ districtsConfig, setDistrictsConfig, setPendingDistricts }) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ id: '', name: '', active: true, heroTitle: '', heroSubtitle: 'Mess Dhundo, Ghar Baithe', lat: '', lng: '', order: '' });

    const districts = Object.values(districtsConfig).sort((a, b) => (a.order || 99) - (b.order || 99));

    const resetForm = () => {
        setForm({ id: '', name: '', active: true, heroTitle: '', heroSubtitle: 'Mess Dhundo, Ghar Baithe', lat: '', lng: '', order: '' });
        setShowAddForm(false);
        setEditingId(null);
    };

    const handleEdit = (dist) => {
        setEditingId(dist.id);
        setForm({
            id: dist.id,
            name: dist.name,
            active: dist.active ?? true,
            heroTitle: dist.heroTitle || '',
            heroSubtitle: dist.heroSubtitle || 'Mess Dhundo, Ghar Baithe',
            lat: dist.gpsCenter?.lat?.toString() || '',
            lng: dist.gpsCenter?.lng?.toString() || '',
            order: dist.order?.toString() || '',
        });
        setShowAddForm(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const slug = form.id.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
        if (!slug) return;

        setDistrictsConfig(prev => ({
            ...prev,
            [slug]: {
                ...(prev[slug] || {}),
                id: slug,
                name: form.name || slug.charAt(0).toUpperCase() + slug.slice(1),
                active: form.active,
                heroTitle: form.heroTitle || `Find Your Comfortable Stay in ${form.name}`,
                heroSubtitle: form.heroSubtitle || 'Mess Dhundo, Ghar Baithe',
                gpsCenter: { lat: parseFloat(form.lat) || 0, lng: parseFloat(form.lng) || 0 },
                order: parseInt(form.order) || 99,
                cities: prev[slug]?.cities || [],
                landmarks: prev[slug]?.landmarks || [],
            }
        }));
        setPendingDistricts(true);
        resetForm();
    };

    const handleToggleActive = (distId) => {
        setDistrictsConfig(prev => ({
            ...prev,
            [distId]: { ...prev[distId], active: !prev[distId].active }
        }));
        setPendingDistricts(true);
    };

    const handleDelete = (distId) => {
        if (!window.confirm(`Delete district "${distId}"? This cannot be undone. Existing messes referencing this district will need to be manually updated.`)) return;
        setDistrictsConfig(prev => {
            const next = { ...prev };
            delete next[distId];
            return next;
        });
        setPendingDistricts(true);
    };

    return (
        <div className="space-y-4">
            {/* District List */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                        {districts.length} District{districts.length !== 1 ? 's' : ''} Configured
                    </span>
                    <button
                        onClick={() => { resetForm(); setShowAddForm(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-bold transition-all"
                    >
                        <Plus size={14} />
                        Add District
                    </button>
                </div>

                <div className="divide-y divide-slate-700">
                    {districts.map(dist => (
                        <div key={dist.id} className="px-5 py-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors">
                            <div className="flex items-center gap-4">
                                <span className="text-xs text-slate-500 font-mono w-6 text-right">{dist.order || '—'}</span>
                                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                                    <Globe size={18} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-white font-bold">{dist.name}</span>
                                        <span className="text-xs text-slate-500 font-mono bg-slate-900 px-2 py-0.5 rounded">{dist.id}</span>
                                        {dist.active ? (
                                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">ACTIVE</span>
                                        ) : (
                                            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">COMING SOON</span>
                                        )}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-0.5">
                                        {dist.cities?.length || 0} cities &middot; GPS: {dist.gpsCenter?.lat?.toFixed(4) || '—'}, {dist.gpsCenter?.lng?.toFixed(4) || '—'}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleToggleActive(dist.id)}
                                    className={`p-2 rounded-lg transition-colors ${dist.active ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-500 hover:bg-slate-600'}`}
                                    title={dist.active ? 'Deactivate' : 'Activate'}
                                >
                                    {dist.active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                </button>
                                <button
                                    onClick={() => handleEdit(dist)}
                                    className="p-2 rounded-lg text-slate-400 hover:bg-slate-600 hover:text-white transition-colors"
                                    title="Edit"
                                >
                                    <Pencil size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(dist.id)}
                                    className="p-2 rounded-lg text-red-400/60 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Add / Edit Form */}
            {showAddForm && (
                <div className="bg-slate-800 rounded-2xl border border-cyan-500/30 p-6 space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        {editingId ? <Pencil size={18} className="text-cyan-400" /> : <Plus size={18} className="text-cyan-400" />}
                        {editingId ? `Edit District: ${editingId}` : 'Add New District'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">District ID (slug)</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                                    value={form.id}
                                    onChange={e => setForm({ ...form, id: e.target.value })}
                                    placeholder="e.g. cuttack"
                                    disabled={!!editingId}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Display Name</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-cyan-500"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    placeholder="e.g. Cuttack"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Display Order</label>
                                <input
                                    type="number"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-cyan-500"
                                    value={form.order}
                                    onChange={e => setForm({ ...form, order: e.target.value })}
                                    placeholder="1"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Hero Title</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-cyan-500"
                                    value={form.heroTitle}
                                    onChange={e => setForm({ ...form, heroTitle: e.target.value })}
                                    placeholder="Find Your Comfortable Stay in ..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Hero Subtitle</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-cyan-500"
                                    value={form.heroSubtitle}
                                    onChange={e => setForm({ ...form, heroSubtitle: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">GPS Latitude</label>
                                <input
                                    type="number"
                                    step="any"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-cyan-500"
                                    value={form.lat}
                                    onChange={e => setForm({ ...form, lat: e.target.value })}
                                    placeholder="21.4934"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">GPS Longitude</label>
                                <input
                                    type="number"
                                    step="any"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-cyan-500"
                                    value={form.lng}
                                    onChange={e => setForm({ ...form, lng: e.target.value })}
                                    placeholder="86.9294"
                                />
                            </div>
                            <div className="flex items-end pb-1">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 accent-emerald-500 cursor-pointer"
                                        checked={form.active}
                                        onChange={e => setForm({ ...form, active: e.target.checked })}
                                    />
                                    <span className="text-sm font-bold text-white">Active</span>
                                </label>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm font-bold transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex items-center gap-2 px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-bold transition-all"
                            >
                                <Check size={16} />
                                {editingId ? 'Update District' : 'Add District'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};


// ─── CITIES SUB-TAB ─────────────────────────────────────────────────────────
const CitiesSubTab = ({ districtsConfig, setDistrictsConfig, setPendingDistricts }) => {
    const districts = Object.values(districtsConfig).sort((a, b) => (a.order || 99) - (b.order || 99));
    const [selectedDistrictId, setSelectedDistrictId] = useState(districts[0]?.id || '');
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingCityId, setEditingCityId] = useState(null);
    const [form, setForm] = useState({ id: '', name: '', busStandName: '', busStandLat: '', busStandLng: '' });

    const selectedDistrict = districtsConfig[selectedDistrictId];
    const cities = selectedDistrict?.cities || [];

    const resetForm = () => {
        setForm({ id: '', name: '', busStandName: '', busStandLat: '', busStandLng: '' });
        setShowAddForm(false);
        setEditingCityId(null);
    };

    const handleEditCity = (city) => {
        setEditingCityId(city.id);
        setForm({
            id: city.id,
            name: city.name,
            busStandName: city.busStand?.name || '',
            busStandLat: city.busStand?.lat?.toString() || '',
            busStandLng: city.busStand?.lng?.toString() || '',
        });
        setShowAddForm(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const slug = form.id.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
        if (!slug || !selectedDistrictId) return;

        const newCity = {
            id: slug,
            name: form.name || slug,
            ...(form.busStandName ? {
                busStand: {
                    name: form.busStandName,
                    lat: parseFloat(form.busStandLat) || 0,
                    lng: parseFloat(form.busStandLng) || 0,
                }
            } : {}),
        };

        setDistrictsConfig(prev => {
            const dist = { ...prev[selectedDistrictId] };
            let updatedCities = [...(dist.cities || [])];
            if (editingCityId) {
                updatedCities = updatedCities.map(c => c.id === editingCityId ? newCity : c);
            } else {
                if (updatedCities.some(c => c.id === slug)) {
                    alert(`City with ID "${slug}" already exists in this district.`);
                    return prev;
                }
                updatedCities.push(newCity);
            }
            dist.cities = updatedCities;
            return { ...prev, [selectedDistrictId]: dist };
        });
        setPendingDistricts(true);
        resetForm();
    };

    const handleDeleteCity = (cityId) => {
        if (!window.confirm(`Delete city "${cityId}" from ${selectedDistrict?.name}?`)) return;
        setDistrictsConfig(prev => {
            const dist = { ...prev[selectedDistrictId] };
            dist.cities = (dist.cities || []).filter(c => c.id !== cityId);
            return { ...prev, [selectedDistrictId]: dist };
        });
        setPendingDistricts(true);
    };

    return (
        <div className="space-y-4">
            {/* District Filter */}
            <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Select District
                </label>
                <div className="flex flex-wrap gap-2">
                    {districts.map(dist => (
                        <button
                            key={dist.id}
                            onClick={() => { setSelectedDistrictId(dist.id); resetForm(); }}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                                selectedDistrictId === dist.id
                                    ? 'bg-cyan-600 border-cyan-500 text-white shadow-lg shadow-cyan-600/20'
                                    : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-cyan-500/50 hover:text-white'
                            }`}
                        >
                            {dist.name}
                            <span className="ml-1.5 text-xs opacity-60">({dist.cities?.length || 0})</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Cities List */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                        Cities in {selectedDistrict?.name || '—'}
                    </span>
                    <button
                        onClick={() => { resetForm(); setShowAddForm(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-bold transition-all"
                    >
                        <Plus size={14} />
                        Add City
                    </button>
                </div>

                {cities.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm">No cities configured yet for this district.</div>
                ) : (
                    <div className="divide-y divide-slate-700">
                        {cities.map(city => (
                            <div key={city.id} className="px-5 py-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                        <Building2 size={18} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-white font-bold">{city.name}</span>
                                            <span className="text-xs text-slate-500 font-mono bg-slate-900 px-2 py-0.5 rounded">{city.id}</span>
                                        </div>
                                        {city.busStand && (
                                            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                                <Navigation size={10} />
                                                {city.busStand.name} ({city.busStand.lat?.toFixed(4)}, {city.busStand.lng?.toFixed(4)})
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleEditCity(city)}
                                        className="p-2 rounded-lg text-slate-400 hover:bg-slate-600 hover:text-white transition-colors"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteCity(city.id)}
                                        className="p-2 rounded-lg text-red-400/60 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add / Edit City Form */}
            {showAddForm && (
                <div className="bg-slate-800 rounded-2xl border border-cyan-500/30 p-6 space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        {editingCityId ? <Pencil size={18} className="text-indigo-400" /> : <Plus size={18} className="text-indigo-400" />}
                        {editingCityId ? `Edit City: ${editingCityId}` : `Add City to ${selectedDistrict?.name}`}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">City ID (slug)</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                                    value={form.id}
                                    onChange={e => setForm({ ...form, id: e.target.value })}
                                    placeholder="e.g. cuttack_city"
                                    disabled={!!editingCityId}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Display Name</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    placeholder="e.g. Cuttack City"
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Bus Stand Name</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={form.busStandName}
                                    onChange={e => setForm({ ...form, busStandName: e.target.value })}
                                    placeholder="e.g. Badambadi Bus Stand"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Bus Stand Lat</label>
                                <input
                                    type="number"
                                    step="any"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={form.busStandLat}
                                    onChange={e => setForm({ ...form, busStandLat: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Bus Stand Lng</label>
                                <input
                                    type="number"
                                    step="any"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={form.busStandLng}
                                    onChange={e => setForm({ ...form, busStandLng: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={resetForm} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm font-bold transition-all">
                                Cancel
                            </button>
                            <button type="submit" className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all">
                                <Check size={16} />
                                {editingCityId ? 'Update City' : 'Add City'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};


// ─── LOCALITIES SUB-TAB ──────────────────────────────────────────────────────
const LocalitiesSubTab = ({ districtsConfig, localitiesConfig, setLocalitiesConfig, setPendingLocalities }) => {
    // Collect all cities from all districts dynamically
    const allCities = Object.values(districtsConfig)
        .sort((a, b) => (a.order || 99) - (b.order || 99))
        .flatMap(district =>
            (district.cities || []).map(city => ({ ...city, districtId: district.id, districtName: district.name }))
        );

    const [selectedCityId, setSelectedCityId] = useState(allCities[0]?.id || '');
    const [newLocality, setNewLocality] = useState('');
    const [bulkInput, setBulkInput] = useState('');
    const [showBulkInput, setShowBulkInput] = useState(false);

    const currentLocalities = localitiesConfig[selectedCityId] || [];
    const selectedCity = allCities.find(c => c.id === selectedCityId);

    const handleAddLocality = () => {
        const trimmed = newLocality.trim();
        if (!trimmed) return;
        if (currentLocalities.map(l => l.toLowerCase()).includes(trimmed.toLowerCase())) return;
        setLocalitiesConfig(prev => ({
            ...prev,
            [selectedCityId]: [...(prev[selectedCityId] || []), trimmed]
        }));
        setNewLocality('');
        setPendingLocalities(true);
    };

    const handleBulkAdd = () => {
        const items = bulkInput.split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
        const existing = new Set((currentLocalities || []).map(l => l.toLowerCase()));
        const newItems = items.filter(i => !existing.has(i.toLowerCase()));
        if (newItems.length === 0) return;
        setLocalitiesConfig(prev => ({
            ...prev,
            [selectedCityId]: [...(prev[selectedCityId] || []), ...newItems]
        }));
        setBulkInput('');
        setShowBulkInput(false);
        setPendingLocalities(true);
    };

    const handleRemoveLocality = (name) => {
        setLocalitiesConfig(prev => ({
            ...prev,
            [selectedCityId]: (prev[selectedCityId] || []).filter(l => l !== name)
        }));
        setPendingLocalities(true);
    };

    return (
        <div className="space-y-4">
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

            {/* Localities Editor */}
            <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                        Localities in {selectedCity?.name || selectedCityId} ({currentLocalities.length})
                    </h3>
                    <button
                        onClick={() => setShowBulkInput(!showBulkInput)}
                        className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors"
                    >
                        {showBulkInput ? 'Single Add' : 'Bulk Add (comma/newline)'}
                    </button>
                </div>

                {/* Single Add */}
                {!showBulkInput && (
                    <div className="flex gap-2">
                        <input
                            type="text"
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                            value={newLocality}
                            onChange={e => setNewLocality(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddLocality())}
                            placeholder="Add a locality..."
                        />
                        <button
                            onClick={handleAddLocality}
                            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition-all"
                        >
                            <Plus size={14} />
                            Add
                        </button>
                    </div>
                )}

                {/* Bulk Add */}
                {showBulkInput && (
                    <div className="space-y-2">
                        <textarea
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                            rows={4}
                            value={bulkInput}
                            onChange={e => setBulkInput(e.target.value)}
                            placeholder="Paste localities separated by commas or newlines, e.g.&#10;Patia, Khandagiri, Jayadev Vihar"
                        />
                        <button
                            onClick={handleBulkAdd}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition-all"
                        >
                            <Plus size={14} />
                            Add All
                        </button>
                    </div>
                )}

                {/* Localities Grid */}
                <div className="flex flex-wrap gap-2">
                    {currentLocalities.map((loc, idx) => (
                        <span key={`${loc}-${idx}`} className="group flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-full px-3.5 py-1.5 text-sm text-slate-300 hover:border-purple-500/50 transition-all">
                            <MapPin size={12} className="text-purple-400 shrink-0" />
                            {loc}
                            <button
                                onClick={() => handleRemoveLocality(loc)}
                                className="ml-1 p-0.5 rounded-full text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                                <X size={12} />
                            </button>
                        </span>
                    ))}
                    {currentLocalities.length === 0 && (
                        <span className="text-slate-500 text-sm italic">No localities configured. Add some above.</span>
                    )}
                </div>
            </div>
        </div>
    );
};


export default LocationManagerTab;
