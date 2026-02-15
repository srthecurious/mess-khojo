import React, { ReactNode } from 'react';
import { Img, staticFile } from 'remotion';

// Simple iPhone Frame Mockup
export const PhoneFrame: React.FC<{ children: ReactNode }> = ({ children }) => {
    return (
        <div className="relative w-[400px] h-[820px] bg-black rounded-[50px] shadow-2xl border-[12px] border-zinc-800 overflow-hidden ring-4 ring-black/40">
            {/* Dynamic Island / Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[30px] bg-black rounded-b-2xl z-50"></div>

            {/* Screen Content */}
            <div className="w-full h-full bg-white overflow-hidden">
                {children}
            </div>

            {/* Reflection shine */}
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none z-40 opacity-30"></div>
        </div>
    );
};
