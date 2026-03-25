import React, { useState, useEffect, useRef, useCallback } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';

const HeroCarousel = ({ onMap }) => {
    const [desktopAds, setDesktopAds] = useState([]);
    const [mobileAds, setMobileAds] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isHovered, setIsHovered] = useState(false);
    const [isTouched, setIsTouched] = useState(false);
    const intervalRef = useRef(null);
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);

    // Detect screen size
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch desktop ads
    useEffect(() => {
        const q = query(
            collection(db, 'hero_ads_desktop'),
            where('active', '==', true),
            orderBy('order', 'asc')
        );
        const unsub = onSnapshot(q, (snap) => {
            setDesktopAds(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (error) => {
            console.error('HeroCarousel: Desktop ads query failed:', error);
        });
        return unsub;
    }, []);

    // Fetch mobile ads
    useEffect(() => {
        const q = query(
            collection(db, 'hero_ads_mobile'),
            where('active', '==', true),
            orderBy('order', 'asc')
        );
        const unsub = onSnapshot(q, (snap) => {
            setMobileAds(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (error) => {
            console.error('HeroCarousel: Mobile ads query failed:', error);
        });
        return unsub;
    }, []);

    const ads = isMobile ? mobileAds : desktopAds;

    // Reset index when ads change or screen switches
    useEffect(() => {
        setCurrentIndex(0);
    }, [isMobile, ads.length]);

    // Auto-scroll
    const startAutoScroll = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (ads.length <= 1) return;

        intervalRef.current = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % ads.length);
        }, 3500);
    }, [ads.length]);

    useEffect(() => {
        if (!isHovered && !isTouched && ads.length > 1) {
            startAutoScroll();
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isHovered, isTouched, startAutoScroll, ads.length]);

    const goTo = (index) => {
        setCurrentIndex(index);
        // Restart timer on manual nav
        startAutoScroll();
    };

    const prev = () => goTo((currentIndex - 1 + ads.length) % ads.length);
    const next = () => goTo((currentIndex + 1) % ads.length);

    // Touch swipe handlers
    const handleTouchStart = (e) => {
        setIsTouched(true);
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e) => {
        touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
        setIsTouched(false);
        const diff = touchStartX.current - touchEndX.current;
        if (Math.abs(diff) > 50) {
            if (diff > 0) next();
            else prev();
        }
    };

    // Handle ad click (open link if present)
    const handleAdClick = (ad) => {
        if (ad.linkUrl) {
            window.open(ad.linkUrl, '_blank', 'noopener,noreferrer');
        }
    };

    if (ads.length === 0) return null;

    return (
        <div className="px-4 sm:px-6 lg:px-8 mb-6 max-w-7xl mx-auto">
            <div
                className={`w-full relative overflow-hidden rounded-3xl shadow-lg group ${
                    isMobile ? 'aspect-[3/2]' : 'h-[50vh]'
                }`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Slides */}
                <div
                    className="flex h-full transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                    {ads.map((ad) => (
                        <div
                            key={ad.id}
                            className={`w-full h-full flex-shrink-0 relative ${ad.linkUrl ? 'cursor-pointer' : ''}`}
                            onClick={() => handleAdClick(ad)}
                        >
                            <img
                                src={ad.imageUrl}
                                alt={ad.title || 'Advertisement'}
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                            {/* Optional title overlay */}
                            {ad.title && (
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 pb-14">
                                    <p className="text-white font-bold text-lg drop-shadow-lg">{ad.title}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>



                {/* Dot indicators */}
                {ads.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
                        {ads.map((_, i) => (
                            <button
                                key={i}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    goTo(i);
                                }}
                                className={`rounded-full transition-all duration-300 ${
                                    i === currentIndex
                                        ? 'w-6 h-2.5 bg-white shadow-md'
                                        : 'w-2.5 h-2.5 bg-white/50 hover:bg-white/80'
                                }`}
                                aria-label={`Go to slide ${i + 1}`}
                            />
                        ))}
                    </div>
                )}

                {/* Prev/Next arrows (desktop hover only) */}
                {ads.length > 1 && (
                    <>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                prev();
                            }}
                            className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center bg-black/30 hover:bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm"
                            aria-label="Previous slide"
                        >
                            <ChevronLeft size={22} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                next();
                            }}
                            className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center bg-black/30 hover:bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm"
                            aria-label="Next slide"
                        >
                            <ChevronRight size={22} />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default HeroCarousel;
