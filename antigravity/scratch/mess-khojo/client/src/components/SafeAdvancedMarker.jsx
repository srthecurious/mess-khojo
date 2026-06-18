import React, { Component } from 'react';
import { AdvancedMarker, useApiLoadingStatus, APILoadingStatus } from '@vis.gl/react-google-maps';

/**
 * ROOT CAUSE:
 * When Google Maps API fails auth, the marker.js SDK is still loaded partially.
 * The `useAdvancedMarker` hook in @vis.gl/react-google-maps does:
 *   const newMarker = new markerLibrary.AdvancedMarkerElement();
 *   newMarker.map = map;  // <-- CRASHES: getRootNode() on undefined internal node
 *
 * The map object is NON-NULL even during AUTH_FAILURE, so checking `useMap()` alone
 * is NOT sufficient. We must check that the API loading status is exactly LOADED.
 *
 * Fix: Gate marker rendering on APILoadingStatus === 'LOADED'.
 * Fallback: Wrap in ErrorBoundary as a secondary safety net.
 */

class MarkerErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error) {
        // Swallow the marker crash gracefully — maps auth failure should never
        // crash the entire React page.
        console.warn('[SafeAdvancedMarker] Marker rendering failed (likely Maps auth failure):', error?.message);
    }

    render() {
        if (this.state.hasError) return null;
        return this.props.children;
    }
}

/**
 * SafeAdvancedMarker: A drop-in replacement for AdvancedMarker that is immune
 * to Google Maps API authentication failures.
 *
 * Guards:
 * 1. Checks APILoadingStatus === 'LOADED' (not just that map is non-null)
 * 2. Wraps in ErrorBoundary to catch any remaining SDK-level crashes
 */
const SafeAdvancedMarker = (props) => {
    const status = useApiLoadingStatus();

    // Only render when the Maps API is fully and successfully loaded.
    // AUTH_FAILURE, FAILED, LOADING, NOT_LOADED all return null safely.
    if (status !== APILoadingStatus.LOADED) return null;

    return (
        <MarkerErrorBoundary>
            <AdvancedMarker {...props} />
        </MarkerErrorBoundary>
    );
};

export default SafeAdvancedMarker;
