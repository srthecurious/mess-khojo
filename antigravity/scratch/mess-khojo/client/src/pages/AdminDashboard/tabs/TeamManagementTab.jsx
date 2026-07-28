import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, IdCard, Upload, CheckCircle, AlertCircle, X } from 'lucide-react';
import { addTeamMember, updateTeamMember, deleteTeamMember, uploadMemberAvatar } from '../../../services/teamService';

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

  const handleDelete = async (member) => {
    if (!window.confirm(`Are you sure you want to delete member "${member.name}" (${member.id})?`)) {
      return;
    }

    try {
      if (member.docId) {
        await deleteTeamMember(member.docId);
        refetch();
      }
    } catch (err) {
      console.error("Failed to delete member:", err);
      alert("Failed to delete member");
    }
  };

  const adminFilteredMembers = (members || []).filter(m => 
    (m.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.id || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.role || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 text-slate-900" style={{ color: '#0f172a' }}>
      {/* Header & Stats Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-purple-100">
        <div>
          <h2 className="text-2xl font-black text-slate-900" style={{ color: '#0f172a' }}>Team Members Management</h2>
          <p className="text-sm text-slate-600 mt-1" style={{ color: '#475569' }}>Manage, add, and edit team profiles across all organizational roles.</p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white text-sm font-bold rounded-xl hover:bg-purple-800 transition-colors shadow-md shrink-0"
        >
          <Plus size={18} />
          Add Team Member
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm">
          <span className="text-xs font-bold uppercase" style={{ color: '#64748b' }}>Total Members</span>
          <p className="text-2xl font-black text-brand-primary mt-1">{stats?.total || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm">
          <span className="text-xs font-bold uppercase" style={{ color: '#64748b' }}>C-Suite & Execs</span>
          <p className="text-2xl font-black text-purple-700 mt-1">{stats?.executives || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm">
          <span className="text-xs font-bold uppercase" style={{ color: '#64748b' }}>Core Employees</span>
          <p className="text-2xl font-black text-blue-600 mt-1">{stats?.employees || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm">
          <span className="text-xs font-bold uppercase" style={{ color: '#64748b' }}>Interns</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{stats?.interns || 0}</p>
        </div>
      </div>

      {/* Admin Table Section */}
      <div className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden">
        {/* Search Bar inside Table */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/80 flex items-center gap-3">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search by Member ID, Name, or Role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-none text-sm font-semibold focus:outline-none placeholder:text-slate-400"
            style={{ color: '#0f172a' }}
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-xs font-bold hover:text-slate-700" style={{ color: '#64748b' }}>
              Clear
            </button>
          )}
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-purple-50/80 text-brand-primary text-xs font-black uppercase tracking-wider border-b border-purple-100">
                <th className="py-3.5 px-4">Member</th>
                <th className="py-3.5 px-4">Member ID</th>
                <th className="py-3.5 px-4">Role Title</th>
                <th className="py-3.5 px-4">Role Category</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100" style={{ color: '#1e293b' }}>
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center font-semibold" style={{ color: '#64748b' }}>
                    Loading team members...
                  </td>
                </tr>
              ) : adminFilteredMembers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center font-semibold" style={{ color: '#64748b' }}>
                    No team members found matching your search.
                  </td>
                </tr>
              ) : (
                adminFilteredMembers.map((m) => (
                  <tr key={m.docId || m.id} className="hover:bg-purple-50/30 transition-colors">
                    <td className="py-3 px-4 font-extrabold" style={{ color: '#0f172a' }}>
                      <div className="flex items-center gap-3">
                        <img
                          src={m.avatarUrl || 'https://via.placeholder.com/40'}
                          alt={m.name}
                          className="w-9 h-9 rounded-xl object-cover bg-purple-100 border border-purple-200"
                        />
                        <span>{m.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs font-bold text-brand-primary">
                      {m.id}
                    </td>
                    <td className="py-3 px-4 font-semibold" style={{ color: '#1e293b' }}>
                      {m.role}
                    </td>
                    <td className="py-3 px-4 capitalize text-xs font-semibold" style={{ color: '#475569' }}>
                      {m.roleCategory}
                    </td>
                    <td className="py-3 px-4 text-xs font-medium" style={{ color: '#64748b' }}>
                      {m.department}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${m.status === 'Active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
                        {m.status || 'Active'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(m)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Member"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(m)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-slate-900/75 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-purple-100 my-8" style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-brand-primary via-indigo-700 to-purple-900 text-white flex justify-between items-center shadow-md">
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

            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto bg-white" style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Role Category Dropdown */}
                <div>
                  <label className="block text-xs font-black uppercase mb-1.5 tracking-wider" style={{ color: '#0f172a' }}>
                    Role Tier / Category *
                  </label>
                  <select
                    value={formData.roleCategory}
                    onChange={handleCategoryChange}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-brand-primary focus:outline-none shadow-sm"
                    style={{ color: '#0f172a', backgroundColor: '#ffffff' }}
                  >
                    {ROLE_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id} style={{ color: '#0f172a', backgroundColor: '#ffffff' }} className="font-medium">
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Member ID */}
                <div>
                  <label className="block text-xs font-black uppercase mb-1.5 tracking-wider" style={{ color: '#0f172a' }}>
                    Member ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MK-FND-001"
                    value={formData.id}
                    onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-mono font-bold text-brand-primary focus:ring-2 focus:ring-brand-primary focus:outline-none shadow-sm placeholder:text-gray-400"
                    style={{ backgroundColor: '#ffffff' }}
                  />
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-black uppercase mb-1.5 tracking-wider" style={{ color: '#0f172a' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aditya Kumar Nayak"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-brand-primary focus:outline-none shadow-sm placeholder:text-gray-400"
                    style={{ color: '#0f172a', backgroundColor: '#ffffff' }}
                  />
                </div>

                {/* Specific Role Title */}
                <div>
                  <label className="block text-xs font-black uppercase mb-1.5 tracking-wider" style={{ color: '#0f172a' }}>
                    Role Title / Designation *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Founder & CEO"
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-brand-primary focus:outline-none shadow-sm placeholder:text-gray-400"
                    style={{ color: '#0f172a', backgroundColor: '#ffffff' }}
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-xs font-black uppercase mb-1.5 tracking-wider" style={{ color: '#0f172a' }}>
                    Department
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Executive & Strategy"
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-brand-primary focus:outline-none shadow-sm placeholder:text-gray-400"
                    style={{ color: '#0f172a', backgroundColor: '#ffffff' }}
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-black uppercase mb-1.5 tracking-wider" style={{ color: '#0f172a' }}>
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-brand-primary focus:outline-none shadow-sm"
                    style={{ color: '#0f172a', backgroundColor: '#ffffff' }}
                  >
                    <option value="Active" style={{ color: '#0f172a', backgroundColor: '#ffffff' }} className="font-medium">Active</option>
                    <option value="Alumnus" style={{ color: '#0f172a', backgroundColor: '#ffffff' }} className="font-medium">Alumnus (Former Member)</option>
                  </select>
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-black uppercase mb-1.5 tracking-wider" style={{ color: '#0f172a' }}>
                  Bio / Description
                </label>
                <textarea
                  rows="3"
                  placeholder="Brief summary of responsibilities and achievements..."
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-brand-primary focus:outline-none shadow-sm placeholder:text-gray-400"
                  style={{ color: '#0f172a', backgroundColor: '#ffffff' }}
                />
              </div>

              {/* Skills */}
              <div>
                <label className="block text-xs font-black uppercase mb-1.5 tracking-wider" style={{ color: '#0f172a' }}>
                  Skills (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Product Strategy, React, Venture Growth"
                  value={formData.skills}
                  onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-brand-primary focus:outline-none shadow-sm placeholder:text-gray-400"
                  style={{ color: '#0f172a', backgroundColor: '#ffffff' }}
                />
              </div>

              {/* Contact Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase mb-1.5 tracking-wider" style={{ color: '#0f172a' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="member@messkhojo.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-brand-primary focus:outline-none shadow-sm placeholder:text-gray-400"
                    style={{ color: '#0f172a', backgroundColor: '#ffffff' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1.5 tracking-wider" style={{ color: '#0f172a' }}>
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/..."
                    value={formData.linkedin}
                    onChange={(e) => setFormData(prev => ({ ...prev, linkedin: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-brand-primary focus:outline-none shadow-sm placeholder:text-gray-400"
                    style={{ color: '#0f172a', backgroundColor: '#ffffff' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1.5 tracking-wider" style={{ color: '#0f172a' }}>
                    Twitter/X URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://twitter.com/..."
                    value={formData.twitter}
                    onChange={(e) => setFormData(prev => ({ ...prev, twitter: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-brand-primary focus:outline-none shadow-sm placeholder:text-gray-400"
                    style={{ color: '#0f172a', backgroundColor: '#ffffff' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1.5 tracking-wider" style={{ color: '#0f172a' }}>
                    GitHub URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://github.com/..."
                    value={formData.github}
                    onChange={(e) => setFormData(prev => ({ ...prev, github: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-brand-primary focus:outline-none shadow-sm placeholder:text-gray-400"
                    style={{ color: '#0f172a', backgroundColor: '#ffffff' }}
                  />
                </div>
              </div>

              {/* Photo Upload & Preview */}
              <div>
                <label className="block text-xs font-black uppercase mb-1.5 tracking-wider" style={{ color: '#0f172a' }}>
                  Profile Photo Avatar
                </label>
                <div className="flex items-center gap-4">
                  {avatarPreview && (
                    <img src={avatarPreview} alt="Preview" className="w-14 h-14 rounded-2xl object-cover border-2 border-purple-200 shadow-sm" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    className="text-xs font-semibold file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-100 file:text-brand-primary hover:file:bg-purple-200 cursor-pointer"
                    style={{ color: '#475569' }}
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-gray-100 text-sm font-bold rounded-xl hover:bg-gray-200 transition-colors"
                  style={{ color: '#334155' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-brand-primary text-white text-sm font-bold rounded-xl hover:bg-purple-800 shadow-md disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving...' : editingMember ? 'Update Member' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagementTab;
