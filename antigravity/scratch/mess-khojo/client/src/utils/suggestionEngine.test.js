import { describe, it, expect } from 'vitest';
import { getSuggestions } from './suggestionEngine';

describe('suggestionEngine getSuggestions', () => {
    const mockMesses = [
        {
            id: 'mess-monthly',
            name: 'Standard Monthly PG',
            city: 'baleshwar',
            messType: 'boys',
            rentCycle: 'monthly',
            hidden: false,
        },
        {
            id: 'mess-yearly',
            name: 'Premium Yearly PG',
            city: 'baleshwar',
            messType: 'boys',
            rentCycle: 'yearly',
            hidden: false,
        },
        {
            id: 'mess-mixed',
            name: 'Mixed PG',
            city: 'baleshwar',
            messType: 'boys',
            rentCycle: 'monthly',
            hidden: false,
        }
    ];

    const mockRooms = [
        {
            id: 'room-1',
            messId: 'mess-monthly',
            occupancy: '2',
            price: '6000',
            rentCycle: 'monthly',
            availableCount: 1,
        },
        {
            id: 'room-2',
            messId: 'mess-yearly',
            occupancy: '2',
            price: '60000', // Yearly price: 60000/yr -> 6000/mo after division
            rentCycle: 'yearly',
            availableCount: 1,
        },
        {
            id: 'room-3',
            messId: 'mess-mixed',
            occupancy: '2',
            price: '50000', // Yearly room in monthly mess: 50000/yr -> 5000/mo after division
            rentCycle: 'yearly',
            availableCount: 1,
        },
        {
            id: 'room-4',
            messId: 'mess-monthly',
            occupancy: '2',
            price: '15000', // Monthly room out of budget (max budget is 7000)
            rentCycle: 'monthly',
            availableCount: 1,
        }
    ];

    it('matches and adjusts prices correctly based on yearly rent cycle', () => {
        const inquiry = {
            city: 'baleshwar',
            gender: 'boys',
            occupancy: '2',
            budget: '5000-7000', // max budget is 7000
            location: '',
        };

        const results = getSuggestions(inquiry, mockMesses, mockRooms);

        // Should return all three matching messes:
        // 1. Standard Monthly PG (room price 6000 <= 7000)
        // 2. Premium Yearly PG (room price adjusted to 6000 <= 7000)
        // 3. Mixed PG (room price adjusted to 5000 <= 7000)
        expect(results.length).toBe(3);

        const monthlyMess = results.find(m => m.id === 'mess-monthly');
        const yearlyMess = results.find(m => m.id === 'mess-yearly');
        const mixedMess = results.find(m => m.id === 'mess-mixed');

        expect(monthlyMess).toBeDefined();
        expect(yearlyMess).toBeDefined();
        expect(mixedMess).toBeDefined();

        // Standard monthly room price should be 6000
        expect(monthlyMess.matchedRooms[0].price).toBe('6000');
        expect(monthlyMess.matchedRooms[0].isPriceAdjustedYearly).toBeUndefined();

        // Premium yearly room price should be adjusted to 6000 (divided by 10)
        expect(yearlyMess.matchedRooms[0].price).toBe('6000');
        expect(yearlyMess.matchedRooms[0].isPriceAdjustedYearly).toBe(true);
        expect(yearlyMess.matchedRooms[0].originalPrice).toBe('60000');

        // Mixed yearly room price should be adjusted to 5000 (divided by 10)
        expect(mixedMess.matchedRooms[0].price).toBe('5000');
        expect(mixedMess.matchedRooms[0].isPriceAdjustedYearly).toBe(true);
        expect(mixedMess.matchedRooms[0].originalPrice).toBe('50000');
    });

    it('excludes rooms that exceed maximum budget after adjustment', () => {
        const inquiry = {
            city: 'baleshwar',
            gender: 'boys',
            occupancy: '2',
            budget: '1000-4000', // max budget is 4000
            location: '',
        };

        const results = getSuggestions(inquiry, mockMesses, mockRooms);

        // Under 4000:
        // - room-1 (6000) is out of budget
        // - room-2 (adjusted to 6000) is out of budget
        // - room-3 (adjusted to 5000) is out of budget
        // - room-4 (15000) is out of budget
        expect(results.length).toBe(0);
    });
});
