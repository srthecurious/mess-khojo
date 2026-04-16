import ReactGA from 'react-ga4';

// Initialize Google Analytics
let isInitialized = false;

export const initializeAnalytics = () => {
    const measurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID;

    // Only initialize in production or if explicitly enabled
    const isDevelopment = import.meta.env.DEV;

    if (!measurementId) {
        console.warn('⚠️ Google Analytics Measurement ID not found');
        return;
    }

    if (!isInitialized) {
        ReactGA.initialize(measurementId, {
            gaOptions: {
                debug_mode: isDevelopment, // Enable debug mode in development
            },
        });
        isInitialized = true;

        if (isDevelopment) {
            console.log('📊 Google Analytics initialized (Development Mode)');
        }
    }
};

// Track page views
export const trackPageView = (path, title) => {
    if (!isInitialized) return;

    ReactGA.send({
        hitType: 'pageview',
        page: path,
        title: title || document.title
    });

    if (import.meta.env.DEV) {
        console.log('📊 Page View:', path, title);
    }
};

// Track custom events
export const trackEvent = (category, action, label, value) => {
    if (!isInitialized) return;

    ReactGA.event({
        category,
        action,
        label,
        value,
    });

    if (import.meta.env.DEV) {
        console.log('📊 Event:', { category, action, label, value });
    }
};

// Specific tracking functions for common events

// Track search behavior
export const trackSearch = (searchTerm, resultsCount) => {
    trackEvent('Search', 'mess_search', searchTerm, resultsCount);
};

// Track filter usage
export const trackFilter = (filterType, filterValue) => {
    trackEvent('Filter', 'filter_applied', `${filterType}: ${filterValue}`);
};

// Track location selection
export const trackLocationUsage = (method) => {
    // method: 'gps' or 'map'
    trackEvent('Location', 'location_selected', method);
};

// Track mess views
export const trackMessView = (messId, messName) => {
    trackEvent('Mess', 'mess_viewed', `${messName} (${messId})`);
};

// Track room views
export const trackRoomView = (roomId, messId, price) => {
    trackEvent('Room', 'room_viewed', `Room ${roomId} in Mess ${messId}`, Number(price) || undefined);
};

// Track contact clicks
export const trackContactClick = (contactType, messId) => {
    // contactType: 'phone' or 'whatsapp'
    trackEvent('Contact', 'contact_clicked', contactType, messId);
};

// Track booking attempts
export const trackBookingInitiated = (roomId, messId, price) => {
    trackEvent('Booking', 'booking_initiated', `Room ${roomId}`, Number(price) || undefined);
};

// Track availability checks
export const trackAvailabilityCheck = (roomId) => {
    trackEvent('Room', 'availability_checked', `Room ${roomId}`);
};

// Track login attempts
export const trackLoginAttempt = (success) => {
    trackEvent('Authentication', 'login_attempted', success ? 'success' : 'failure');
};

// Track signup attempts
export const trackSignupAttempt = (success) => {
    trackEvent('Authentication', 'signup_attempted', success ? 'success' : 'failure');
};

// Track mess registration
export const trackMessRegistration = (started, messId = null) => {
    if (started) {
        trackEvent('Registration', 'mess_registration_started');
    } else {
        trackEvent('Registration', 'mess_registration_completed', `Mess ${messId}`);
    }
};

// Track mess explorer
export const trackMessExplorer = (action, messId = null) => {
    // action: 'opened' or 'mess_selected'
    trackEvent('MessExplorer', action, messId ? `Mess ${messId}` : undefined);
};

// Track pagination
export const trackViewMore = (currentCount) => {
    trackEvent('Navigation', 'view_more_clicked', `Viewing ${currentCount} items`);
};

// Track amenity filter selections
export const trackAmenityFilter = (amenity, enabled) => {
    trackEvent('Filter', 'amenity_filter', amenity, enabled ? 1 : 0);
};

// Track App Installation
export const trackAppInstall = () => {
    trackEvent('App', 'install_accepted');
};

// Track Gallery Views
export const trackGalleryView = (messId) => {
    trackEvent('Mess', 'gallery_viewed', messId);
};

// Track Wishlist Interactions
export const trackWishlistToggle = (type, id, isAdding) => {
    trackEvent('Wishlist', isAdding ? 'added_to_wishlist' : 'removed_from_wishlist', `${type}_${id}`);
};

// Track Contact Owner feature
export const trackContactOwner = (action, messId, roomId) => {
    // action: 'button_clicked', 'call_confirmed', 'call_cancelled'
    trackEvent('ContactOwner', action, `mess_${messId}_room_${roomId}`);
};

// Track Availability Inquiry (sold-out rooms)
export const trackAvailabilityInquiry = (messId, roomId) => {
    trackEvent('ContactOwner', 'availability_inquiry_submitted', `mess_${messId}_room_${roomId}`);
};

// Track Hero Banner Click
export const trackHeroAdClick = (adId, adTitle, isMobile) => {
    trackEvent('HeroBanner', 'banner_clicked', `${adTitle || adId} (${isMobile ? 'Mobile' : 'Desktop'})`);
};

export default {
    initialize: initializeAnalytics,
    trackPageView,
    trackEvent,
    trackSearch,
    trackFilter,
    trackLocationUsage,
    trackMessView,
    trackRoomView,
    trackContactClick,
    trackBookingInitiated,
    trackAvailabilityCheck,
    trackLoginAttempt,
    trackSignupAttempt,
    trackMessRegistration,
    trackMessExplorer,
    trackViewMore,
    trackAmenityFilter,
    trackAppInstall,
    trackGalleryView,
    trackWishlistToggle,
    trackContactOwner,
    trackAvailabilityInquiry,
    trackHeroAdClick,
};
