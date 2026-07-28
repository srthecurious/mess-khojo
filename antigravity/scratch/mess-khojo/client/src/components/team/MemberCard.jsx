import React, { useState } from 'react';
import { Mail, Linkedin, Twitter, Github, IdCard, ChevronRight, Award } from 'lucide-react';
import { motion } from 'framer-motion';

const getRoleBadgeStyle = (category = '') => {
  switch (category.toLowerCase()) {
    case 'founder':
    case 'co_founder':
      return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'ceo':
    case 'cto':
    case 'cfo':
    case 'coo':
    case 'cmo':
      return 'bg-purple-100 text-purple-800 border-purple-300';
    case 'founding_partner':
      return 'bg-indigo-100 text-indigo-800 border-indigo-300';
    case 'employee':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'intern':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const MemberCard = ({ member, onClick }) => {
  const [imageError, setImageError] = useState(false);

  // Fallback initial avatar generator
  const initials = member.name
    ? member.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'MK';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      onClick={() => onClick(member)}
      className="group relative bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-purple-100 shadow-[0_4px_20px_rgba(75,46,131,0.06)] hover:shadow-[0_12px_30px_rgba(75,46,131,0.15)] hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
    >
      {/* Background Subtle Gradient Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-100/60 to-transparent rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500" />

      <div>
        {/* Top Bar: Member ID Badge & Role Badge */}
        <div className="flex items-center justify-between gap-2 mb-5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-brand-primary text-xs font-mono font-bold rounded-full border border-purple-200 shadow-sm">
            <IdCard size={13} className="text-brand-primary" />
            {member.id}
          </span>
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getRoleBadgeStyle(member.roleCategory)} uppercase tracking-wider`}>
            {member.categoryLabel || member.roleCategory}
          </span>
        </div>

        {/* Member Avatar & Main Info */}
        <div className="flex items-start gap-4 mb-4">
          <div className="relative shrink-0">
            {member.avatarUrl && !imageError ? (
              <img
                src={member.avatarUrl}
                alt={member.name}
                onError={() => setImageError(true)}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-primary to-indigo-600 text-white font-extrabold text-xl flex items-center justify-center border-2 border-white shadow-md group-hover:scale-105 transition-transform duration-300">
                {initials}
              </div>
            )}
            {member.status === 'Active' && (
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-sm" title="Active Team Member" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-extrabold text-brand-text-dark group-hover:text-brand-primary transition-colors truncate">
              {member.name}
            </h3>
            <p className="text-sm font-semibold text-brand-primary leading-snug line-clamp-1">
              {member.role}
            </p>
            {member.department && (
              <p className="text-xs text-gray-500 font-medium mt-0.5 truncate">
                {member.department}
              </p>
            )}
          </div>
        </div>

        {/* Bio Preview */}
        {member.bio && (
          <p className="text-xs text-brand-text-gray leading-relaxed line-clamp-2 mb-4 bg-purple-50/40 p-2.5 rounded-xl border border-purple-50">
            "{member.bio}"
          </p>
        )}

        {/* Skills Pills */}
        {member.skills && member.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {member.skills.slice(0, 3).map((skill, idx) => (
              <span key={idx} className="text-[10px] font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">
                {skill}
              </span>
            ))}
            {member.skills.length > 3 && (
              <span className="text-[10px] font-semibold text-brand-primary bg-purple-100 px-1.5 py-0.5 rounded-md">
                +{member.skills.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer: Social Actions & Detail Prompt */}
      <div className="pt-3 border-t border-purple-100/80 flex items-center justify-between mt-auto">
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {member.email && (
            <a
              href={`mailto:${member.email}`}
              className="p-1.5 rounded-lg text-gray-500 hover:text-brand-primary hover:bg-purple-100 transition-colors"
              title={`Email ${member.name}`}
            >
              <Mail size={15} />
            </a>
          )}
          {member.linkedin && (
            <a
              href={member.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="LinkedIn Profile"
            >
              <Linkedin size={15} />
            </a>
          )}
          {member.twitter && (
            <a
              href={member.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-gray-500 hover:text-sky-500 hover:bg-sky-50 transition-colors"
              title="Twitter Profile"
            >
              <Twitter size={15} />
            </a>
          )}
          {member.github && (
            <a
              href={member.github}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              title="GitHub Profile"
            >
              <Github size={15} />
            </a>
          )}
        </div>

        <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-primary group-hover:translate-x-1 transition-transform">
          View Profile
          <ChevronRight size={14} />
        </span>
      </div>
    </motion.div>
  );
};

export default MemberCard;
