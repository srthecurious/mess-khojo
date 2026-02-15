import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

export const SceneProblem: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const opacity1 = interpolate(frame, [0, 20], [0, 1]);
    const opacity2 = interpolate(frame, [50, 70], [0, 1]);

    const slideIn = spring({
        frame: frame - 100, // Trigger later
        fps,
        config: { damping: 200 },
    });

    const x = interpolate(slideIn, [0, 1], [0, -100]); // Transition out

    return (
        <AbsoluteFill className="bg-white flex items-center justify-center p-10">
            <div style={{ transform: `translateX(${x}%)` }} className="w-full text-center">
                <h2 style={{ opacity: opacity1 }} className="text-5xl font-bold text-gray-800 mb-8 leading-tight">
                    New to the city? <br />
                    <span className="text-brand-primary">Need an affordable stay?</span>
                </h2>

                <h2 style={{ opacity: opacity2 }} className="text-4xl font-bold text-brand-accent mt-8">
                    Mess Khojo is here! 🚀
                </h2>
            </div>
        </AbsoluteFill>
    );
};
