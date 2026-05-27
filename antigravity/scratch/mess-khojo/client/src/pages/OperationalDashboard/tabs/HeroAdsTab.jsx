import React from 'react';
import { Image, ToggleRight, ToggleLeft, Monitor, Smartphone, ArrowUp, ArrowDown, Eye, EyeOff, Trash2 } from 'lucide-react';

const HeroAdsTab = ({
    carouselEnabled,
    handleToggleCarousel,
    desktopAds,
    mobileAds,
    desktopAdFile,
    setDesktopAdFile,
    mobileAdFile,
    setMobileAdFile,
    heroAdUploading,
    heroAdForm,
    setHeroAdForm,
    handleHeroAdUpload,
    handleReorderHeroAd,
    handleToggleHeroAd,
    handleDeleteHeroAd
}) => {
    return (
        <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Image className="text-pink-500" />
                Hero Ads Management
            </h2>

            {/* Global Toggle */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 mb-8 shadow-xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-white">Enable Ad Carousel</h3>
                        <p className="text-slate-400 text-sm mt-1">
                            {carouselEnabled
                                ? 'Carousel is LIVE — users see ad banners on the home page'
                                : 'Carousel is OFF — users see the default hero section'}
                        </p>
                    </div>
                    <button
                        onClick={handleToggleCarousel}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-lg ${
                            carouselEnabled
                                ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600'
                        }`}
                    >
                        {carouselEnabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                        {carouselEnabled ? 'ON' : 'OFF'}
                    </button>
                </div>
            </div>

            {/* Two Sections */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Desktop Banners */}
                {[{ section: 'desktop', ads: desktopAds, icon: <Monitor size={20} />, label: 'Desktop Banners', size: '1400 × 500 px', color: 'blue' },
                  { section: 'mobile', ads: mobileAds, icon: <Smartphone size={20} />, label: 'Mobile Banners', size: '800 × 600 px', color: 'orange' }].map(({ section, ads: sectionAds, icon, label, size, color }) => (
                    <div key={section} className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
                        {/* Section Header */}
                        <div className={`p-5 border-b border-slate-700 bg-${color}-500/5`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg bg-${color}-500/10 text-${color}-400`}>
                                        {icon}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg">{label}</h3>
                                        <p className="text-slate-500 text-xs">Recommended: {size}</p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
                                    sectionAds.length >= 10
                                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                        : 'bg-slate-700 text-slate-300'
                                }`}>
                                    {sectionAds.length}/10
                                </span>
                            </div>
                        </div>

                        {/* Upload Form */}
                        <div className="p-5 border-b border-slate-700">
                            <div className="space-y-3">
                                <div>
                                    <input
                                        id={`hero-ad-file-${section}`}
                                        type="file"
                                        accept="image/*"
                                        disabled={sectionAds.length >= 10 || heroAdUploading}
                                        onChange={(e) => section === 'desktop'
                                        ? setDesktopAdFile(e.target.files?.[0] || null)
                                        : setMobileAdFile(e.target.files?.[0] || null)
                                    }
                                        className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-pink-500/10 file:text-pink-400 hover:file:bg-pink-500/20 disabled:opacity-40"
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <select
                                        value={heroAdForm.district}
                                        onChange={(e) => setHeroAdForm({ ...heroAdForm, district: e.target.value })}
                                        className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:ring-1 focus:ring-pink-500 outline-none capitalize"
                                    >
                                        <option value="all">Any District</option>
                                        <option value="balasore">Balasore</option>
                                        <option value="bhadrak">Bhadrak</option>
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="Link URL (optional)"
                                        value={heroAdForm.linkUrl}
                                        onChange={(e) => setHeroAdForm({ ...heroAdForm, linkUrl: e.target.value })}
                                        className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:ring-1 focus:ring-pink-500 outline-none"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Title (optional)"
                                        value={heroAdForm.title}
                                        onChange={(e) => setHeroAdForm({ ...heroAdForm, title: e.target.value })}
                                        className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:ring-1 focus:ring-pink-500 outline-none"
                                    />
                                </div>
                                <button
                                    onClick={() => handleHeroAdUpload(section)}
                                    disabled={!(section === 'desktop' ? desktopAdFile : mobileAdFile) || heroAdUploading || sectionAds.length >= 10}
                                    className="w-full py-2.5 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-pink-500/10"
                                >
                                    {heroAdUploading ? 'Uploading...' : sectionAds.length >= 10 ? 'Limit Reached (10/10)' : 'Upload Banner'}
                                </button>
                            </div>
                        </div>

                        {/* Banner List */}
                        <div className="p-5 space-y-3 max-h-[600px] overflow-y-auto">
                            {sectionAds.length === 0 ? (
                                <div className="text-center py-12 text-slate-500 text-sm">
                                    No banners uploaded yet.
                                </div>
                            ) : (
                                sectionAds.map((ad, idx) => (
                                    <div key={ad.id} className={`bg-slate-900/50 rounded-xl border ${ad.active ? 'border-slate-700' : 'border-slate-700/50 opacity-50'} p-3 flex gap-3 items-center group`}>
                                        {/* Thumbnail */}
                                        <img
                                            src={ad.imageUrl}
                                            alt={ad.title || 'Banner'}
                                            className="w-24 h-16 object-cover rounded-lg shrink-0 border border-slate-700"
                                        />

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-sm font-bold truncate">{ad.title || 'Untitled'}</p>
                                            {ad.linkUrl && <p className="text-slate-500 text-xs truncate">{ad.linkUrl}</p>}
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold mt-1 inline-block ${ad.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-500'}`}>
                                                {ad.active ? 'ACTIVE' : 'HIDDEN'}
                                            </span>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold mt-1 ml-1 inline-block bg-blue-500/20 text-blue-400 capitalize">
                                                {ad.district || 'balasore'}
                                            </span>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                onClick={() => handleReorderHeroAd(ad.id, 'up', section)}
                                                disabled={idx === 0}
                                                className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-20"
                                                title="Move up"
                                            >
                                                <ArrowUp size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleReorderHeroAd(ad.id, 'down', section)}
                                                disabled={idx === sectionAds.length - 1}
                                                className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-20"
                                                title="Move down"
                                            >
                                                <ArrowDown size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleToggleHeroAd(ad.id, ad.active, section)}
                                                className={`p-1.5 rounded-lg transition-colors ${ad.active ? 'text-emerald-400 hover:bg-emerald-500/20' : 'text-slate-500 hover:bg-slate-700'}`}
                                                title={ad.active ? 'Hide' : 'Show'}
                                            >
                                                {ad.active ? <Eye size={14} /> : <EyeOff size={14} />}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteHeroAd(ad.id, section)}
                                                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HeroAdsTab;
