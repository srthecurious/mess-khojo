import { UserPlus, Shield, FileSpreadsheet } from 'lucide-react';

const PartnersTab = ({
    partnerStatus,
    partnerEmail,
    setPartnerEmail,
    partnerPassword,
    setPartnerPassword,
    handleCreatePartner,
    updatePasswordStatus,
    updatePartnerEmail,
    setUpdatePartnerEmail,
    updatePartnerPassword,
    setUpdatePartnerPassword,
    handleUpdatePassword,
    migrationStatus,
    handleMigratePartners,
    handleBackfillDistricts,
    handleSyncACAmenities,
    sheetsSyncStatus,
    handleSyncAllToSheets
}) => {
    return (
        <div className="max-w-xl mx-auto mt-10">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-blue-500/10 p-3 rounded-full text-blue-500">
                        <UserPlus size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Add New Partner</h2>
                        <p className="text-slate-400 text-sm">Create credentials for a mess owner</p>
                    </div>
                </div>

                {partnerStatus.msg && (
                    <div className={`p-4 rounded-xl mb-6 text-sm border ${partnerStatus.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                        partnerStatus.type === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                            'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>
                        {partnerStatus.msg}
                    </div>
                )}

                <form onSubmit={handleCreatePartner} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Partner Email</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            value={partnerEmail}
                            onChange={(e) => setPartnerEmail(e.target.value)}
                            placeholder="owner@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Temporary Password</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            value={partnerPassword}
                            onChange={(e) => setPartnerPassword(e.target.value)}
                            placeholder="SecurePassword123"
                        />
                        <p className="text-xs text-slate-500 mt-2">
                            <Shield size={12} className="inline mr-1" />
                            Admin account will be created directly in Auth.
                        </p>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-blue-600/20 active:scale-95"
                    >
                        Create Account
                    </button>
                </form>

                {/* Update Password Section */}
                <div className="mt-8 pt-8 border-t border-slate-700">
                    <h3 className="text-lg font-bold text-white mb-2">Update Partner Password</h3>
                    <p className="text-sm text-slate-400 mb-4">Instantly reset a partner's password if they are locked out.</p>
                    
                    {updatePasswordStatus.msg && (
                        <div className={`p-4 rounded-xl mb-4 text-sm border ${updatePasswordStatus.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                            {updatePasswordStatus.msg}
                        </div>
                    )}

                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <input
                                    type="email"
                                    required
                                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-amber-500 outline-none"
                                    value={updatePartnerEmail}
                                    onChange={(e) => setUpdatePartnerEmail(e.target.value)}
                                    placeholder="Partner Email"
                                />
                            </div>
                            <div>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-amber-500 outline-none"
                                    value={updatePartnerPassword}
                                    onChange={(e) => setUpdatePartnerPassword(e.target.value)}
                                    placeholder="New Password (Min 6 chars)"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={updatePasswordStatus.loading}
                            className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-amber-600/20 disabled:opacity-50"
                        >
                            {updatePasswordStatus.loading ? 'Updating...' : 'Force Update Password'}
                        </button>
                    </form>
                </div>

                {/* Migration Tool Section */}
                <div className="mt-8 pt-8 border-t border-slate-700">
                    <h3 className="text-lg font-bold text-white mb-2">Migrate Existing Partners</h3>
                    <p className="text-sm text-slate-400 mb-4">Click this button to automatically fix the login issue for partners whose accounts were created before the security update.</p>
                    
                    {migrationStatus.msg && (
                        <div className={`p-4 rounded-xl mb-4 text-sm border ${migrationStatus.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : migrationStatus.type === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                            {migrationStatus.msg}
                        </div>
                    )}

                    <button
                        onClick={handleMigratePartners}
                        disabled={migrationStatus.loading}
                        type="button"
                        className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all border border-slate-600 disabled:opacity-50"
                    >
                        {migrationStatus.loading ? 'Migrating...' : 'Migrate Existing Partners'}
                    </button>
                </div>

                {/* District Backfill Tool Section */}
                <div className="mt-8 pt-8 border-t border-slate-700">
                    <h3 className="text-lg font-bold text-white mb-2">Backfill Districts for Legacy Messes</h3>
                    <p className="text-sm text-slate-400 mb-4">Click this button to assign the default district ('Balasore') to all existing messes that don't have a district field yet.</p>
                    
                    <button
                        onClick={handleBackfillDistricts}
                        disabled={migrationStatus.loading}
                        type="button"
                        className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all border border-slate-600 disabled:opacity-50"
                    >
                        {migrationStatus.loading ? 'Processing...' : 'Backfill Districts'}
                    </button>
                </div>

                {/* AC Sync Tool Section */}
                <div className="mt-8 pt-8 border-t border-slate-700">
                    <h3 className="text-lg font-bold text-white mb-2">Sync AC Amenities for 1-Click Messes</h3>
                    <p className="text-sm text-slate-400 mb-4">Click this button to sync AC amenities case-sensitively and robustly for all 1-click registered messes and their rooms in the database.</p>
                    
                    <button
                        onClick={handleSyncACAmenities}
                        disabled={migrationStatus.loading}
                        type="button"
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-indigo-600/20 disabled:opacity-50"
                    >
                        {migrationStatus.loading ? 'Syncing...' : 'Sync AC Amenities'}
                    </button>
                </div>

                {/* Google Sheets Sync Tool Section */}
                <div className="mt-8 pt-8 border-t border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                        <FileSpreadsheet className="text-emerald-400" size={20} />
                        <h3 className="text-lg font-bold text-white">Google Sheets Integration</h3>
                    </div>
                    <p className="text-sm text-slate-400 mb-4">
                        Perform a batch import of all existing mess registrations in Firestore into your Google Sheets. Uses high-performance writing for zero delay.
                    </p>

                    {sheetsSyncStatus.msg && (
                        <div className={`p-4 rounded-xl mb-4 text-sm border ${
                            sheetsSyncStatus.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                            sheetsSyncStatus.type === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                            'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>
                            {sheetsSyncStatus.msg}
                        </div>
                    )}

                    <button
                        onClick={handleSyncAllToSheets}
                        disabled={sheetsSyncStatus.loading}
                        type="button"
                        className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <FileSpreadsheet size={18} />
                        {sheetsSyncStatus.loading ? 'Syncing Records...' : 'Sync Historical Messes to Sheets'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PartnersTab;
