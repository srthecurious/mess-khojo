™'use client';
import * as React from 'react';

export const DashboardBackground = () => {
    return (
        <div className="absolute inset-0 z-0 overflow-hidden bg-background">
            <svg viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg" className="h-full w-full object-cover">
                <defs>
                    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: 'hsl(var(--background))', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: 'hsl(260, 60%, 5%)', stopOpacity: 1 }} />
                    </linearGradient>

                    <radialGradient id="glowPrimary">
                        <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 0.4 }} />
                        <stop offset="100%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 0 }} />
                    </radialGradient>

                    <radialGradient id="glowAccent">
                        <stop offset="0%" style={{ stopColor: 'hsl(var(--accent))', stopOpacity: 0.3 }} />
                        <stop offset="100%" style={{ stopColor: 'hsl(var(--accent))', stopOpacity: 0 }} />
                    </radialGradient>

                    <radialGradient id="glowSecondary">
                        <stop offset="0%" style={{ stopColor: 'hsl(var(--secondary))', stopOpacity: 0.2 }} />
                        <stop offset="100%" style={{ stopColor: 'hsl(var(--secondary))', stopOpacity: 0 }} />
                    </radialGradient>
                </defs>
                <rect width="1200" height="800" fill="url(#bgGradient)" />

                {/* Large ambient glows */}
                <circle cx="0" cy="0" r="500" fill="url(#glowPrimary)" opacity="0.4" />
                <circle cx="1200" cy="800" r="600" fill="url(#glowAccent)" opacity="0.3" />
                <circle cx="600" cy="400" r="400" fill="url(#glowSecondary)" opacity="0.2" />

                {/* Grid lines */}
                <g opacity="0.15">
                    <line x1="0" y1="200" x2="1200" y2="200" stroke="hsl(var(--primary))" strokeWidth="1" />
                    <line x1="0" y1="400" x2="1200" y2="400" stroke="hsl(var(--primary))" strokeWidth="1" />
                    <line x1="0" y1="600" x2="1200" y2="600" stroke="hsl(var(--primary))" strokeWidth="1" />
                    <line x1="300" y1="0" x2="300" y2="800" stroke="hsl(var(--primary))" strokeWidth="1" />
                    <line x1="600" y1="0" x2="600" y2="800" stroke="hsl(var(--primary))" strokeWidth="1" />
                    <line x1="900" y1="0" x2="900" y2="800" stroke="hsl(var(--primary))" strokeWidth="1" />
                </g>
            </svg>
            {/* Noise texture overlay for glass effect */}
            <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>
        </div>
    );
};
™*cascade08"(5d61d427a222e017a17c122ac4c4c05a08fc51202Lfile:///c:/Apps/NEETrack/NEETrack/src/components/ui/dashboard-background.tsx:!file:///c:/Apps/NEETrack/NEETrack