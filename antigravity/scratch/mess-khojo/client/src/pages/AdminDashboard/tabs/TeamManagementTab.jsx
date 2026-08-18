import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, Edit2, Trash2, IdCard, Upload, CheckCircle, AlertCircle, X, Maximize2 } from 'lucide-react';
import { addTeamMember, updateTeamMember, deleteTeamMember, uploadMemberAvatar } from '../../../services/teamService';
import ImageModal from '../../../components/ImageModal';
import ConfirmDeleteModal from '../../../components/ConfirmDeleteModal';
import { useBodyScrollLock } from '../../../hooks/useBodyScrollLock';

const ROLE_CATEGORIES = [
  { id: 'founder', label: 'Founder', prefix: 'MK-FND' },
  { id: 'co_founder', label: 'Co-Founder', prefix: 'MK-COF' },
  { id: 'ceo', label: 'CEO (Chief Executive Officer)', prefix: 'MK-CEO' },
  { id: 'cto', label: 'CTO (Chief Technology Officer)', prefix: 'MK-CTO' },
  { id: 'cfo', label: 'CFO (Chief Financial Officer)', prefix: 'MK-CFO' },
  { id: 'coo', label: 'COO (Chief Operating Officer)', prefix: 'MK-COO' },
  { id: 'cmo', label: 'CMO (Chief Marketing Officer)', prefix: 'MK-CMO' },
  { id: 'founding_partner', label: 'Founding Partner', prefix: 'MK-FPT' },
  { id: 'employee', label: 'Employee', prefix: 'MK-EMP' },
  { id: 'intern', label: 'Intern', prefix: 'MK-INT' },
];

const TeamManagementTab = ({ teamData }) => {
  const { members, loading, refetch, stats } = teamData;
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [popupImage, setPopupImage] = useState(null);
  const [deletingMember, setDeletingMember] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useBodyScrollLock(isModalOpen);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    role: '',
    roleCategory: 'employee',
    department: '',
    bio: '',
    email: '',
    linkedin: '',
    twitter: '',
    github: '',
    instagram: '',
    skills: '',
    joinedDate: new Date().toISOString().split('T')[0],
    status: 'Active',
    avatarUrl: ''
  });

  const handleOpenAddModal = () => {
    setEditingMember(null);
    setAvatarFile(null);
    setAvatarPreview('');
    setFormData({
      id: `MK-EMP-0${(members.length + 1).toString().padStart(2, '0')}`,
      name: '',
      role: '',
      roleCategory: 'employee',
      department: 'Engineering',
      bio: '',
      email: '',
      linkedin: '',
      twitter: '',
      github: '',
      instagram: '',
      skills: 'React, Node.js',
      joinedDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      avatarUrl: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (member) => {
    setEditingMember(member);
    setAvatarFile(null);
    setAvatarPreview(member.avatarUrl || '');
    setFormData({
      id: member.id || '',
      name: member.name || '',
      role: member.role || '',
      roleCategory: member.roleCategory || 'employee',
      department: member.department || '',
      bio: member.bio || '',
      email: member.email || '',
      linkedin: member.linkedin || '',
      twitter: member.twitter || '',
      github: member.github || '',
      instagram: member.instagram || '',
      skills: Array.isArray(member.skills) ? member.skills.join(', ') : (member.skills || ''),
      joinedDate: member.joinedDate || new Date().toISOString().split('T')[0],
      status: member.status || 'Active',
      avatarUrl: member.avatarUrl || ''
    });
    setIsModalOpen(true);
  };

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    const matchedRole = ROLE_CATEGORIES.find(r => r.id === category);
    
    let newId = formData.id;
    if (matchedRole && (!editingMember || !formData.id)) {
      const nextNum = (members.length + 1).toString().padStart(3, '0');
      newId = `${matchedRole.prefix}-${nextNum}`;
    }

    setFormData(prev => ({
      ...prev,
      roleCategory: category,
      id: newId
    }));
  };

  const handleAvatarFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.id || !formData.name || !formData.role) {
      alert("Member ID, Name, and Role title are required.");
      return;
    }

    try {
      setSaving(true);
      let uploadedUrl = formData.avatarUrl;

      if (avatarFile) {
        uploadedUrl = await uploadMemberAvatar(avatarFile, formData.id);
      }

      const categoryLabelObj = ROLE_CATEGORIES.find(r => r.id === formData.roleCategory);
      const payload = {
        ...formData,
        categoryLabel: categoryLabelObj ? categoryLabelObj.label : formData.roleCategory,
        skills: typeof formData.skills === 'string' 
          ? formData.skills.split(',').map(s => s.trim()).filter(Boolean)
          : formData.skills,
        avatarUrl: uploadedUrl
      };

      if (editingMember && editingMember.docId) {
        await updateTeamMember(editingMember.docId, payload);
      } else {
        const existingInList = members.find(m => m.id === formData.id && m.docId);
        if (existingInList) {
          await updateTeamMember(existingInList.docId, payload);
        } else {
          await addTeamMember(payload);
        }
      }

      setIsModalOpen(false);
      refetch();
    } catch (err) {
      console.error("Failed to save team member:", err);
      alert(`Failed to save team member: ${err.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteMember = async () => {
    if (!deletingMember) return;
    try {
      setDeleting(true);
      if (deletingMember.docId) {
        await deleteTeamMember(deletingMember.docId);
        refetch();
      }
    } catch (err) {
      console.error("Failed to delete member:", err);
      alert("Failed to delete member");
    } finally {
      setDeleting(false);
      setDeletingMember(null);
    }
  };

  const adminFilteredMembers = (members || []).filter(m => 
    (m.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.id || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.role || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header & Stats Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/80 p-6 rounded-2xl shadow-xl border border-slate-800 backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-black text-white">Team Members Management</h2>
          <p className="text-sm text-slate-400 mt-1">Manage, add, and edit team profiles across all organizational roles.</p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-purple-900/30 shrink-0 active:scale-95 cursor-pointer"
        >
          <Plus size={18} />
          Add Team Member
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-md">
          <span className="text-xs font-bold uppercase text-slate-400">Total Members</span>
          <p className="text-2xl font-black text-purple-400 mt-1">{stats?.total || 0}</p>
        </div>
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-md">
          <span className="text-xs font-bold uppercase text-slate-400">C-Suite & Execs</span>
          <p className="text-2xl font-black text-purple-300 mt-1">{stats?.executives || 0}</p>
        </div>
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-md">
          <span className="text-xs font-bold uppercase text-slate-400">Core Employees</span>
          <p className="text-2xl font-black text-blue-400 mt-1">{stats?.employees || 0}</p>
        </div>
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-md">
          <span className="text-xs font-bold uppercase text-slate-400">Interns</span>
          <p className="text-2xl font-black text-emerald-400 mt-1">{stats?.interns || 0}</p>
        </div>
      </div>

      {/* Admin Table Section */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl overflow-hidden backdrop-blur-md">
        {/* Search Bar inside Table */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/50 flex items-center gap-3">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search by Member ID, Name, or Role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-none text-sm font-semibold text-white focus:outline-none placeholder:text-slate-500"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors">
              Clear
            </button>
          )}
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-950/80 text-purple-400 text-xs font-black uppercase tracking-wider border-b border-slate-800">
                <th className="py-3.5 px-4">Member</th>
                <th className="py-3.5 px-4">Member ID</th>
                <th className="py-3.5 px-4">Role Title</th>
                <th className="py-3.5 px-4">Role Category</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center font-semibold text-slate-400">
                    Loading team members...
                  </td>
                </tr>
              ) : adminFilteredMembers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center font-semibold text-slate-400">
                    No team members found matching your search.
                  </td>
                </tr>
              ) : (
                adminFilteredMembers.map((m) => (
                  <tr key={m.docId || m.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-extrabold text-white">
                      <div className="flex items-center gap-3">
                        <div 
                          className="relative group cursor-pointer shrink-0"
                          onClick={() => setPopupImage({ src: m.avatarUrl || 'https://via.placeholder.com/40', title: `${m.name} (${m.role})` })}
                          title="Click to view full photo"
                        >
                          <img
                            src={m.avatarUrl || 'https://via.placeholder.com/40'}
                            alt={m.name}
                            className="w-9 h-9 rounded-xl object-cover bg-slate-800 border border-slate-700 group-hover:border-purple-400 group-hover:scale-105 transition-all"
                          />
                          <div className="absolute inset-0 bg-slate-950/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Maximize2 size={12} className="text-white" />
                          </div>
                        </div>
                        <span className="text-slate-100 font-bold">{m.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs font-bold text-purple-400">
                      {m.id}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-200">
                      {m.role}
                    </td>
                    <td className="py-3 px-4 capitalize text-xs font-semibold text-slate-400">
                      {m.roleCategory}
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-400">
                      {m.department}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${m.status === 'Active' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                        {m.status || 'Active'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(m)}
                          className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Edit Member"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeletingMember(m)}
                          className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Delete Member"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Member Form Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-800 my-8 text-white">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white flex justify-between items-center border-b border-slate-800 shadow-md">
              <h3 className="text-xl font-extrabold text-white tracking-wide">
                {editingMember ? 'Edit Team Member' : 'Add New Team Member'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto bg-slate-900 text-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Role Category Dropdown */}
                <div>
                  <label className="block text-xs font-black uppercase mb-1.5 tracking-wider text-slate-300">
                    Role Tier / Category *
                  </label>
                  <select
                    value={formData.roleCategory}
                    onChange={handleCategoryChange}
                    className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm font-semibold text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none shadow-sm"
                  >
                    {ROLE_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id} className="bg-slate-900 text-white font-medium">
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Member ID */}
                <div>
                  <label className="block text-xs font-black uppercase mb-1.5 tracking-wider text-slate-300">
                    Member ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MK-FND-001"
                    value={formData.id}
                    onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm font-mono font-bold text-purple-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none shadow-sm placeholder:text-slate-500"
                  />
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-black uppercase mb-1.5 tracking-wider text-slate-300">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aditya Kumar Nayak"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm font-semibold text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none shadow-sm placeholder:text-slate-500"
                  />
                </div>

                {/* Specific Role Title */}
                <div>
                  <label className="block text-xs font-black uppercase mb-1.5 tracking-wider text-slate-300">
                    Role Title / Designation *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Founder & CEO"
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm font-semibold text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none shadow-sm placeholder:text-slate-500"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-xs font-black uppercase mb-1.5 tracking-wider text-slate-300">
                    Department
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Executive & Strategy"
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm font-semibold text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none shadow-sm placeholder:text-slate-500"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-black uppercase mb-1.5 tracking-wider text-slate-300">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm font-semibold text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none shadow-sm"
                  >
                    <option value="Active" className="bg-slate-900 text-white font-medium">Active</option>
                    <option value="Alumnus" className="bg-slate-900 text-white font-medium">Alumnus (Former Member)</option>
                  </select>
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-black uppercase mb-1.5 tracking-wider text-slate-300">
                  Bio / Description
                </label>
                <textarea
                  rows="3"
                  placeholder="Brief summary of responsibilities and achievements..."
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm font-semibold text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none shadow-sm placeholder:text-slate-500"
                />
              </div>

              {/* Skills */}
              <div>
                <label className="block text-xs font-black uppercase mb-1.5 tracking-wider text-slate-300">
                  Skills (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Product Strategy, React, Venture Growth"
                  value={formData.skills}
                  onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm font-semibold text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none shadow-sm placeholder:text-slate-500"
                />
              </div>

              {/* Contact Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase mb-1.5 tracking-wider text-slate-300">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="member@messkhojo.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm font-semibold text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none shadow-sm placeholder:text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1.5 tracking-wider text-slate-300">
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/..."
                    value={formData.linkedin}
                    onChange={(e) => setFormData(prev => ({ ...prev, linkedin: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm font-semibold text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none shadow-sm placeholder:text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1.5 tracking-wider text-slate-300">
                    Twitter/X URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://twitter.com/..."
                    value={formData.twitter}
                    onChange={(e) => setFormData(prev => ({ ...prev, twitter: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm font-semibold text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none shadow-sm placeholder:text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1.5 tracking-wider text-slate-300">
                    GitHub URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://github.com/..."
                    value={formData.github}
                    onChange={(e) => setFormData(prev => ({ ...prev, github: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm font-semibold text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none shadow-sm placeholder:text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1.5 tracking-wider text-slate-300">
                    Instagram URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://instagram.com/..."
                    value={formData.instagram}
                    onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm font-semibold text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none shadow-sm placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Photo Upload & Preview */}
              <div>
                <label className="block text-xs font-black uppercase mb-1.5 tracking-wider text-slate-300">
                  Profile Photo Avatar
                </label>
                <div className="flex items-center gap-4">
                  {avatarPreview && (
                    <div 
                      className="relative group cursor-pointer shrink-0"
                      onClick={() => setPopupImage({ 
                        src: avatarPreview, 
                        title: formData.name ? `${formData.name} - Profile Photo Avatar` : 'Profile Photo Avatar Preview' 
                      })}
                      title="Click to pop up full photo preview"
                    >
                      <img 
                        src={avatarPreview} 
                        alt="Preview" 
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-purple-500/60 shadow-md group-hover:scale-105 group-hover:border-purple-400 transition-all" 
                      />
                      <div className="absolute inset-0 bg-slate-950/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Maximize2 size={16} className="text-white drop-shadow-md" />
                      </div>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    className="text-xs font-semibold file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-500/20 file:text-purple-300 hover:file:bg-purple-500/30 cursor-pointer text-slate-400"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold rounded-xl transition-colors border border-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-purple-900/30 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {saving ? 'Saving...' : editingMember ? 'Update Member' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Image Popup Lightbox Modal */}
      <ImageModal 
        isOpen={!!popupImage} 
        onClose={() => setPopupImage(null)} 
        src={popupImage?.src} 
        title={popupImage?.title} 
      />

      {/* Confirmation Warning Modal before deleting member */}
      <ConfirmDeleteModal
        isOpen={!!deletingMember}
        onClose={() => setDeletingMember(null)}
        onConfirm={confirmDeleteMember}
        title="Delete Team Member"
        itemName={deletingMember ? `${deletingMember.name} (${deletingMember.id})` : ''}
        description="Are you sure you want to remove this team member from the directory? This action will permanently delete their record."
        loading={deleting}
      />
    </div>
  );
};

export default TeamManagementTab;
