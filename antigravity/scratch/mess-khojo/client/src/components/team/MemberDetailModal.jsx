import React, { useState } from 'react';
import { X, Mail, Linkedin, Twitter, Github, Instagram, IdCard, Calendar, Briefcase, Award, CheckCircle2, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import ImageModal from '../ImageModal';

const MemberDetailModal = ({ member, onClose }) => {
  const [imageError, setImageError] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  useBodyScrollLock(!!member);

  if (!member) return null;

  const initials = member.name
    ? member.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'MK';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl z-10 border border-purple-100 my-8 custom-scrollbar"
        >
          {/* Top Banner Gradient */}
          <div className="h-32 bg-gradient-to-r from-brand-primary via-indigo-600 to-purple-800 relative p-6 flex justify-between items-start">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-mono font-bold rounded-full border border-white/30">
              <IdCard size={14} />
              Member ID: {member.id}
            </span>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>

          {/* Profile Content Container */}
          <div className="px-6 sm:px-8 pb-8 pt-0 relative">
            {/* Avatar & Header Profile Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between -mt-14 mb-6 gap-4">
              <div className="relative">
                {member.avatarUrl && !imageError ? (
                  <div 
                    className="relative group/avatar cursor-pointer"
                    onClick={() => setIsImageModalOpen(true)}
                    title="Click to view full photo"
                  >
                    <img
                      src={member.avatarUrl}
                      alt={member.name}
                      onError={() => setImageError(true)}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-white shadow-xl bg-white group-hover/avatar:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/30 rounded-3xl opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity">
                      <Maximize2 size={24} className="text-white drop-shadow-lg" />
                    </div>
                  </div>
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-brand-primary to-indigo-700 text-white font-black text-3xl flex items-center justify-center border-4 border-white shadow-xl">
                    {initials}
                  </div>
                )}
                {member.status === 'Active' && (
                  <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full shadow-md" title="Active Team Member" />
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-stretch sm:self-auto">
                {member.email && (
                  <a
                    href={`mailto:${member.email}`}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-primary text-white text-sm font-bold rounded-xl hover:bg-purple-800 transition-colors shadow-md"
                  >
                    <Mail size={16} />
                    Email Member
                  </a>
                )}
                {member.linkedin && (
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors border border-blue-200"
                    title="LinkedIn Profile"
                  >
                    <Linkedin size={18} />
                  </a>
                )}
                {member.twitter && (
                  <a
                    href={member.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-sky-50 text-sky-500 rounded-xl hover:bg-sky-100 transition-colors border border-sky-200"
                    title="Twitter Profile"
                  >
                    <Twitter size={18} />
                  </a>
                )}
                {member.github && (
                  <a
                    href={member.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-gray-100 text-gray-800 rounded-xl hover:bg-gray-200 transition-colors border border-gray-300"
                    title="GitHub Profile"
                  >
                    <Github size={18} />
                  </a>
                )}
                {member.instagram && (
                  <a
                    href={member.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-pink-50 text-pink-600 rounded-xl hover:bg-pink-100 transition-colors border border-pink-200"
                    title="Instagram Profile"
                  >
                    <Instagram size={18} />
                  </a>
                )}
              </div>
            </div>

            {/* Name and Designation */}
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-text-dark">
                {member.name}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-base font-bold text-brand-primary">
                  {member.role}
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <Briefcase size={14} className="text-gray-400" />
                  {member.department}
                </span>
              </div>
            </div>

            {/* Metadata Badges Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 p-4 bg-purple-50/50 rounded-2xl border border-purple-100">
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Role Tier</span>
                <span className="text-sm font-bold text-brand-text-dark capitalize">{member.categoryLabel || member.roleCategory}</span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Status</span>
                <span className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 size={14} />
                  {member.status || 'Active'}
                </span>
              </div>
              {member.joinedDate && (
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Joined</span>
                  <span className="text-sm font-bold text-brand-text-dark flex items-center gap-1">
                    <Calendar size={14} className="text-brand-primary" />
                    {member.joinedDate}
                  </span>
                </div>
              )}
            </div>

            {/* Bio Section */}
            {member.bio && (
              <div className="mb-6">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">About & Responsibilities</h4>
                <p className="text-sm text-brand-text-dark leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100 font-normal">
                  {member.bio}
                </p>
              </div>
            )}

            {/* Skills & Expertise */}
            {member.skills && member.skills.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Award size={14} className="text-brand-primary" />
                  Skills & Expertise
                </h4>
                <div className="flex flex-wrap gap-2">
                  {member.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-semibold bg-purple-100 text-brand-primary px-3 py-1 rounded-xl border border-purple-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <ImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        src={member.avatarUrl}
        title={member.name}
      />
    </AnimatePresence>
  );
};

export default MemberDetailModal;
