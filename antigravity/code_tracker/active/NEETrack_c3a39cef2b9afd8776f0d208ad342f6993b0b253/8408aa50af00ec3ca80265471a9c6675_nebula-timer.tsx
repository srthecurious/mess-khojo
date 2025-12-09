û'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface NebulaTimerProps {
    value: number; // 0 to 100
    size?: number;
    className?: string;
    children?: React.ReactNode;
}

export const NebulaTimer: React.FC<NebulaTimerProps> = ({
    value,
    size = 300,
    className,
    children,
}) => {
    const radius = size / 2 - 20; // Padding for glow
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div
            className={cn('relative flex items-center justify-center', className)}
            style={{ width: size, height: size }}
        >
            {/* Ambient Glow Background */}
            <div className="absolute inset-0 rounded-full bg-amber-500/5 blur-3xl animate-pulse" />

            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="transform -rotate-90 relative z-10"
            >
                <defs>
                    <linearGradient id="nebula-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f59e0b" /> {/* Amber-500 */}
                        <stop offset="50%" stopColor="#d97706" /> {/* Amber-600 */}
                        <stop offset="100%" stopColor="#78350f" /> {/* Amber-900 */}
                    </linearGradient>

                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Track */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="#1e293b" // Slate-800
                    strokeWidth="8"
                    className="opacity-30"
                />

                {/* Progress Path */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="url(#nebula-gradient)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    filter="url(#glow)"
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                />

                {/* Particle/Orb at the tip (Optional, complex to calculate position perfectly without more math) */}
            </svg>

            {/* Inner Content */}
            <div className="absolute inset-0 flex items-center justify-center z-20">
                {children}
            </div>
        </div>
    );
};
û"(c3a39cef2b9afd8776f0d208ad342f6993b0b2532Dfile:///c:/Apps/NEETrack/NEETrack/src/components/ui/nebula-timer.tsx:!file:///c:/Apps/NEETrack/NEETrack