import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Img, staticFile } from "remotion";

export const SceneIntro: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const opacity = interpolate(frame, [0, 20], [0, 1]);
    const scale = spring({
        frame: frame - 10,
        fps,
        config: { damping: 200, mass: 0.5 },
    });

    const textY = interpolate(frame, [20, 40], [20, 0], { extrapolateRight: 'clamp' });
    const textOpacity = interpolate(frame, [20, 40], [0, 1]);

    return (
        <AbsoluteFill className="bg-brand-primary flex items-center justify-center bg-gradient-to-br from-purple-700 to-purple-900">
            <div className="flex flex-col items-center">
                <div style={{ opacity, transform: `scale(${Math.max(0, scale)})` }} className="mb-6 relative z-10">
                    <Img
                        src={staticFile("logo.png")}
                        className="w-48 h-48 drop-shadow-2xl rounded-3xl"
                        onError={(e) => {
                            // Fallback if logo invalid
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                </div>

                <div style={{ opacity: textOpacity, transform: `translateY(${textY}px)` }} className="text-center">
                    <h1 className="text-6xl font-black text-white mb-3 tracking-tight drop-shadow-md">
                        Mess Khojo
                    </h1>
                    <p className="text-2xl text-purple-100 font-medium tracking-wide bg-white/10 px-6 py-2 rounded-full backdrop-blur-sm">
                        Find Your Perfect Stay
                    </p>
                </div>
            </div>

            {/* Decorative circles */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-500/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-teal-500/20 rounded-full blur-[100px]" />
        </AbsoluteFill>
    );
};
