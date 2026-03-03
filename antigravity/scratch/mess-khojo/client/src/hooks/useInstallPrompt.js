import { useState, useEffect } from 'react';

export const useInstallPrompt = () => {
    // Initialize from the global window object (populated by inline script in index.html)
    const [deferredPrompt, setDeferredPrompt] = useState(window.deferredPrompt || null);
    const [isInstallable, setIsInstallable] = useState(window.isInstallable || false);
    const [isStandalone, setIsStandalone] = useState(false);

    // Detect iOS (Safari doesn't support beforeinstallprompt)
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

    useEffect(() => {
        // Check if already running as installed PWA
        const standalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true;
        setIsStandalone(standalone);

        if (standalone) return; // Already installed — skip everything

        // Register service worker if supported
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch((err) => {
                console.error('ServiceWorker registration failed: ', err);
            });
        }

        const handleReady = () => {
            setDeferredPrompt(window.deferredPrompt);
            setIsInstallable(window.isInstallable);
        };

        const handleInstalled = () => {
            setDeferredPrompt(null);
            setIsInstallable(false);
            setIsStandalone(true);
        };

        // Listen for standard events AND our custom global events
        window.addEventListener('pwa-ready', handleReady);
        window.addEventListener('pwa-installed', handleInstalled);

        // Also add direct listeners here just in case the manual script missed it 
        // (though the inline script should catch it)
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            window.deferredPrompt = e;
            window.isInstallable = true;
            handleReady();
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleInstalled);

        // Check one more time immediately in case we missed the sync
        handleReady();

        return () => {
            window.removeEventListener('pwa-ready', handleReady);
            window.removeEventListener('pwa-installed', handleInstalled);
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleInstalled);
        };
    }, []);

    const promptInstall = async () => {
        if (!deferredPrompt) {
            return false;
        }

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            // We've used the prompt, and can't use it again, throw it away
            setDeferredPrompt(null);
            setIsInstallable(false);
            window.deferredPrompt = null;
            window.isInstallable = false;
        }

        return outcome === 'accepted';
    };

    return { isInstallable, promptInstall, isIOS, isStandalone };
};
