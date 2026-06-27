/**
 * WishlistContext.jsx
 *
 * Lifts the useWishlist hook into a single shared context so it runs once
 * at app level instead of being called independently in every consumer
 * (CityLandingPage, CityPage, Header, MessDetails, Wishlist).
 *
 * Without this, each component that calls useWishlist() fires its own
 * getDoc(users/uid) Firestore read on mount — causing duplicate reads
 * for the exact same data.
 */
import React, { createContext, useContext } from 'react';
import { useWishlist as useWishlistHook } from '../hooks/useWishlist';

const WishlistContext = createContext(null);

/**
 * Wrap your app (inside AuthProvider) with this provider.
 * The hook runs once; all consumers share the same state.
 */
export function WishlistProvider({ children }) {
    const wishlist = useWishlistHook();
    return (
        <WishlistContext.Provider value={wishlist}>
            {children}
        </WishlistContext.Provider>
    );
}

/**
 * Drop-in replacement for the old `useWishlist` hook import.
 * API is 100% identical — only the import path changes in consumers.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useWishlist() {
    const ctx = useContext(WishlistContext);
    if (!ctx) throw new Error('useWishlist must be used inside <WishlistProvider>');
    return ctx;
}
