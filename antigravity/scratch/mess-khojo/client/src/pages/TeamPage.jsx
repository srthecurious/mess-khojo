import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, IdCard, Users, Sparkles, X, ArrowLeft, ShieldCheck, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTeamData } from '../hooks/useTeamData';
import MemberCard from '../components/team/MemberCard';
import MemberDetailModal from '../components/team/MemberDetailModal';
import { usePageSEO } from '../hooks/usePageSEO';

const TeamPage = () => {
  usePageSEO({
    title: 'Meet Our Leadership & Founders | MessKhojo — Verified Team Directory',
    description: 'Explore the founders and leadership team behind MessKhojo. Staff and intern profile lookups require an exact Member ID.',
    canonicalUrl: 'https://messkhojo.com/team',
  });

  const {
    members,
    loading,
    searchQuery,
    setSearchQuery,
    stats
  } = useTeamData();

  const [selectedMember, setSelectedMember] = useState(null);

  return (
    <div className="min-h-screen bg-brand-secondary py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto mt-12">
        {/* Navigation CTA (Back to Home) */}
        <div className="flex justify-between items-center mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/80 backdrop-blur-md text-brand-primary text-sm font-bold rounded-2xl border border-purple-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
          >
            <ArrowLeft size={18} />
            <span>Back to Home</span>
          </Link>

          <Link
            to="/about-us"
            className="text-xs font-bold text-brand-primary hover:underline"
          >
            About MessKhojo →
          </Link>
        </div>

        {/* Hero Banner Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative bg-gradient-to-br from-brand-primary via-indigo-700 to-purple-900 rounded-3xl p-8 md:p-12 text-white shadow-2xl overflow-hidden mb-10"
        >
          {/* Decorative Background Accents */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-purple-500/20 rounded-full blur-2xl" />

          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-4">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider text-purple-200 border border-white/20">
              <Sparkles size={14} className="text-amber-300" />
              MessKhojo Leadership Directory
            </span>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Meet the Minds Behind <span className="bg-gradient-to-r from-amber-300 to-amber-100 bg-clip-text text-transparent">MessKhojo</span>
            </h1>

            <p className="text-base sm:text-lg text-purple-100 leading-relaxed font-medium max-w-2xl mx-auto">
              The founders, executive leaders, and founding partners powering Odisha’s premier student accommodation directory.
            </p>

            {/* Live Stats Pill Row */}
            <div className="pt-4 flex flex-wrap justify-center items-center gap-3 sm:gap-6 text-xs sm:text-sm font-bold text-white/90">
              <span className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 flex items-center gap-1.5">
                <Users size={14} className="text-amber-300" />
                {stats.publicLeadership} Leadership Members
              </span>
              <span className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 flex items-center gap-1.5">
                <IdCard size={14} className="text-purple-300" />
                {stats.executives} C-Suite & Executives
              </span>
              <span className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 flex items-center gap-1.5 text-amber-200">
                <ShieldCheck size={14} className="text-emerald-400" />
                Staff/Interns: Exact ID Search Required
              </span>
            </div>

            {/* Prominent Real-time Search Bar */}
            <div className="pt-6 max-w-2xl mx-auto space-y-2">
              <div className="relative flex items-center bg-white rounded-2xl p-2 shadow-xl border-2 border-purple-300/40 focus-within:border-amber-400 transition-all">
                <Search size={22} className="text-brand-primary ml-3 shrink-0" />
                <input
                  type="text"
                  placeholder="Search leadership name or enter exact Member ID (e.g. MK-EMP-001)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm sm:text-base text-slate-900 focus:outline-none placeholder:text-gray-400 bg-transparent font-semibold"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-xl mr-1"
                    title="Clear search"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              {/* Exact ID Lookup Privacy Badge */}
              <div className="flex items-center justify-center gap-1.5 text-xs text-purple-200 font-medium pt-1">
                <Info size={13} className="text-amber-300 shrink-0" />
                <span>To view employee or intern details, enter their exact Member ID (e.g. <span className="font-mono text-white font-bold bg-white/10 px-1.5 py-0.5 rounded">MK-EMP-001</span> or <span className="font-mono text-white font-bold bg-white/10 px-1.5 py-0.5 rounded">MK-INT-001</span>).</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Member Grid / Empty State */}
        {loading ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-10 h-10 border-4 border-purple-200 border-t-brand-primary rounded-full animate-spin mx-auto" />
            <p className="text-sm font-bold text-brand-primary">Loading team directory...</p>
          </div>
        ) : members.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-12 text-center max-w-md mx-auto border border-purple-100 shadow-xl my-8"
          >
            <div className="w-16 h-16 bg-purple-50 text-brand-primary rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-100">
              <IdCard size={32} />
            </div>
            <h3 className="text-xl font-bold text-brand-text-dark mb-2">No Team Member Found</h3>
            <p className="text-xs text-brand-text-gray mb-6 leading-relaxed">
              We couldn't find any public member or exact Member ID matching <span className="font-mono font-bold text-brand-primary">"{searchQuery}"</span>.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="px-6 py-2.5 bg-brand-primary text-white text-xs font-bold rounded-xl hover:bg-purple-800 transition-colors shadow-md"
            >
              Clear Search & View Leadership
            </button>
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <AnimatePresence>
              {members.map((member) => (
                <MemberCard
                  key={member.docId || member.id}
                  member={member}
                  onClick={setSelectedMember}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Member Full Detail Modal */}
        {selectedMember && (
          <MemberDetailModal
            member={selectedMember}
            onClose={() => setSelectedMember(null)}
          />
        )}
      </div>
    </div>
  );
};

export default TeamPage;
