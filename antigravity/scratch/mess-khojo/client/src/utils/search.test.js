import { describe, it, expect } from 'vitest';
import { createSearchIndex, searchMesses } from './search';

describe('searchMesses', () => {
    const mockMesses = [
        { id: '1', name: 'Balasore Boys Hostel', address: 'FM College Road, Balasore', district: 'balasore' },
        { id: '2', name: 'Maa Tarini Girls PG', address: 'Sahadevkhunta, Balasore', district: 'balasore' },
        { id: '3', name: 'Cuttack Student Palace', address: 'Link Road, Cuttack', district: 'cuttack' }
    ];

    it('returns empty array when query is empty or whitespace', () => {
        const index = createSearchIndex(mockMesses);
        expect(searchMesses(index, '')).toEqual([]);
        expect(searchMesses(index, '   ')).toEqual([]);
    });

    it('finds exact name match', () => {
        const index = createSearchIndex(mockMesses);
        const results = searchMesses(index, 'Balasore Boys');
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].id).toBe('1');
    });

    it('finds matches with typo tolerance', () => {
        const index = createSearchIndex(mockMesses);
        const results = searchMesses(index, 'Balasor Boys'); // Typo: 'Balasor' instead of 'Balasore'
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].id).toBe('1');
    });

    it('finds matches in address field', () => {
        const index = createSearchIndex(mockMesses);
        const results = searchMesses(index, 'Sahadevkhunta');
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].id).toBe('2');
    });
});
