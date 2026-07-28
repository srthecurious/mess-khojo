import { useEffect } from 'react';

export const useBodyScrollLock = (isLocked) => {
    useEffect(() => {
        if (isLocked) {
            const scrollY = window.scrollY || window.pageYOffset;
            
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
            
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.body.style.paddingRight = `${scrollbarWidth}px`;
        } else {
            const scrollY = document.body.style.top;
            
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
            document.body.style.paddingRight = '';
            
            if (scrollY) {
                document.documentElement.style.scrollBehavior = 'auto';
                window.scrollTo(0, parseInt(scrollY || '0') * -1);
                document.documentElement.style.scrollBehavior = '';
            }
        }

        return () => {
            const scrollY = document.body.style.top;
            
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
            document.body.style.paddingRight = '';
            
            if (scrollY) {
                document.documentElement.style.scrollBehavior = 'auto';
                window.scrollTo(0, parseInt(scrollY || '0') * -1);
                document.documentElement.style.scrollBehavior = '';
            }
        };
    }, [isLocked]);
};
