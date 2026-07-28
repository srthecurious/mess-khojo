import { useState, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';
import { fetchTeamMembers } from '../services/teamService';

export const PUBLIC_ROLE_CATEGORIES = [
  'founder',
  'co_founder',
  'ceo',
  'cto',
  'cfo',
  'coo',
  'cmo',
  'founding_partner'
];

export const CATEGORY_TABS = [
  { id: 'all', label: 'All Leadership & Founders' },
  { id: 'csuite', label: 'Executive Suite (C-Suite)' },
  { id: 'founders', label: 'Founders & Partners' }
];

export const useTeamData = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await fetchTeamMembers();
      setMembers(data);
      setError(null);
    } catch (err) {
      console.error("Failed to load team members:", err);
      setError("Failed to load team member directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  // Public leadership members subset (for name search & default grid)
  const publicMembers = useMemo(() => {
    return members.filter(m => 
      PUBLIC_ROLE_CATEGORIES.includes((m.roleCategory || '').toLowerCase())
    );
  }, [members]);

  // Fuse.js search index for public members
  const fuseIndex = useMemo(() => {
    return new Fuse(publicMembers, {
      keys: [
        { name: 'id', weight: 0.4 },
        { name: 'name', weight: 0.35 },
        { name: 'role', weight: 0.15 },
        { name: 'department', weight: 0.05 },
        { name: 'skills', weight: 0.05 }
      ],
      threshold: 0.35,
      ignoreLocation: true,
      useExtendedSearch: true
    });
  }, [publicMembers]);

  // Filtered members calculation for public view
  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim();

    // 1. Exact Member ID Lookup (Reveals Employees & Interns if exact ID matches, e.g. MK-EMP-001)
    if (q) {
      const exactIdMatch = members.filter(m => (m.id || '').trim().toLowerCase() === q.toLowerCase());
      if (exactIdMatch.length > 0) {
        return exactIdMatch;
      }
    }

    // 2. Base list for public display is restricted to Leadership & Founders
    let result = publicMembers;

    // 3. Category Tab filtering
    if (activeCategory !== 'all') {
      result = result.filter(member => {
        const category = (member.roleCategory || '').toLowerCase();
        if (activeCategory === 'csuite') {
          return ['ceo', 'cto', 'cfo', 'coo', 'cmo'].includes(category);
        }
        if (activeCategory === 'founders') {
          return ['founder', 'co_founder', 'founding_partner'].includes(category);
        }
        return true;
      });
    }

    // 4. Partial Name / Keyword search within Public Leadership
    if (q) {
      const substringMatches = result.filter(m => 
        (m.id || '').toLowerCase().includes(q.toLowerCase()) ||
        (m.name || '').toLowerCase().includes(q.toLowerCase()) ||
        (m.role || '').toLowerCase().includes(q.toLowerCase())
      );

      if (substringMatches.length > 0) {
        return substringMatches;
      }

      const fuseResults = fuseIndex.search(q);
      const matchedDocIds = new Set(fuseResults.map(r => r.item.docId || r.item.id));
      return result.filter(m => matchedDocIds.has(m.docId || m.id));
    }

    return result;
  }, [members, publicMembers, activeCategory, searchQuery, fuseIndex]);

  // Team Statistics
  const stats = useMemo(() => {
    return {
      total: members.length,
      publicLeadership: publicMembers.length,
      executives: members.filter(m => ['ceo', 'cto', 'cfo', 'coo', 'cmo', 'founder', 'co_founder'].includes((m.roleCategory || '').toLowerCase())).length,
      employees: members.filter(m => (m.roleCategory || '').toLowerCase() === 'employee').length,
      interns: members.filter(m => (m.roleCategory || '').toLowerCase() === 'intern').length,
    };
  }, [members, publicMembers]);

  return {
    members: filteredMembers,
    allMembers: members,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    stats,
    refetch: loadMembers
  };
};
