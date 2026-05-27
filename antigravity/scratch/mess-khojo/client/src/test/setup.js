import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock IntersectionObserver globally for Framer Motion viewport triggers
globalThis.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
};


// Mock Firebase app and auth/db/storage exports
vi.mock('../firebase', () => ({
    auth: {
        onAuthStateChanged: vi.fn(() => vi.fn()),
        currentUser: null,
    },
    db: {},
    storage: {},
    getSecondaryAuth: vi.fn(),
}));

// Mock services so they are isolated by default in tests
vi.mock('../services/messService', () => ({
    getMess: vi.fn(),
    watchMesses: vi.fn(),
    watchRooms: vi.fn(),
    watchRoomsByMess: vi.fn(),
    watchMessByAdmin: vi.fn(),
    updateMess: vi.fn(),
    addMess: vi.fn(),
    deleteMess: vi.fn(),
    addRoom: vi.fn(),
    updateRoom: vi.fn(),
    deleteRoom: vi.fn(),
}));

vi.mock('../services/bookingService', () => ({
    watchBookings: vi.fn(),
    watchBookingsByMess: vi.fn(),
    watchClaims: vi.fn(),
    watchInquiries: vi.fn(),
    watchRoomInquiries: vi.fn(),
    watchFeedbacks: vi.fn(),
    watchMessRegistrations: vi.fn(),
    addBooking: vi.fn(),
    addClaim: vi.fn(),
    addInquiry: vi.fn(),
    addRoomInquiry: vi.fn(),
    addFeedback: vi.fn(),
    addMessRegistration: vi.fn(),
    updateBookingStatus: vi.fn(),
    updateClaimStatus: vi.fn(),
    updateInquiryStatus: vi.fn(),
    updateRoomInquiryStatus: vi.fn(),
    updateFeedbackStatus: vi.fn(),
    updateRegistrationStatus: vi.fn(),
}));

vi.mock('../services/userService', () => ({
    getUserDoc: vi.fn(),
    watchUserDoc: vi.fn(),
    updateUserDoc: vi.fn(),
}));

vi.mock('../analytics', () => ({
    trackMessView: vi.fn(),
    trackContactClick: vi.fn(),
    trackAvailabilityCheck: vi.fn(),
    trackEvent: vi.fn(),
    trackGalleryView: vi.fn(),
    trackLocationUsage: vi.fn(),
    trackSearch: vi.fn(),
    trackViewMore: vi.fn(),
}));
