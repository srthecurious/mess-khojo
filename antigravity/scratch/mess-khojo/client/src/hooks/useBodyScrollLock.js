import { useEffect } from 'react';

export const useBodyScrollLock = (isLocked) => {
    useEffect(() => {
        if (isLocked) {
            document.body.style.overflow = 'hidden';
            // Prevent layout shift by adding padding equal to scrollbar width
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.body.style.paddingRight = `${scrollbarWidth}px`;
        } else {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }

        return () => {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        };
    }, [isLocked]);
};
