import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import MessCard from './MessCard';

describe('MessCard Component', () => {
    const mockMess = {
        id: '1',
        name: 'Super Premium Mess',
        address: 'Balia Road, Balasore',
        posterUrl: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5',
        isUserSourced: false,
        isFiltered: true,
        matchingBeds: 5,
        minPrice: 1500,
        maxPrice: 3000,
        rentCycle: 'monthly',
        minStayDuration: 6
    };

    it('renders mess name, address, and pricing details correctly', () => {
        render(
            <BrowserRouter>
                <MessCard mess={mockMess} isWishlisted={false} onToggleWishlist={vi.fn()} />
            </BrowserRouter>
        );

        expect(screen.getByText('Super Premium Mess')).toBeInTheDocument();
        expect(screen.getByText('Balia Road, Balasore')).toBeInTheDocument();
        expect(screen.getByText('₹1500')).toBeInTheDocument();
        expect(screen.getByText('–')).toBeInTheDocument();
        expect(screen.getByText('3000')).toBeInTheDocument();
        expect(screen.getByText('Available')).toBeInTheDocument();
    });

    it('triggers onToggleWishlist callback when heart button is clicked', () => {
        const handleToggleWishlist = vi.fn();
        render(
            <BrowserRouter>
                <MessCard mess={mockMess} isWishlisted={false} onToggleWishlist={handleToggleWishlist} />
            </BrowserRouter>
        );

        const heartBtn = screen.getByTitle('Save to wishlist');
        fireEvent.click(heartBtn);

        expect(handleToggleWishlist).toHaveBeenCalledTimes(1);
        expect(handleToggleWishlist).toHaveBeenCalledWith('1');
    });
});
