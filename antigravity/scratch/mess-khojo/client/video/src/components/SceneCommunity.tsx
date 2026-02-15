import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Img, staticFile } from "remotion";

export const SceneCommunity: React.FC = () => {
    const frame = useCurrentFrame();

    const scale = interpolate(frame, [0, 30], [0.8, 1]);
    const opacity = interpolate(frame, [0, 20], [0, 1]);

    return (
        <AbsoluteFill className="bg-brand-secondary flex items-center justify-center p-10">
            <div style={{ opacity, transform: `scale(${scale})` }} className="flex flex-col items-center">
                <h2 className="text-5xl font-bold text-brand-primary mb-10">Join Our Community</h2>

                <div className="flex gap-8">
                    <div className="bg-[#1eaa62] text-white p-8 rounded-3xl shadow-xl flex items-center gap-4">
                        <span className="text-4xl">📱</span>
                        <div>
                            <h3 className="text-2xl font-bold">WhatsApp</h3>
                            <p>Connect with students</p>
                        </div>
                    </div>

                    <div className="bg-[#0088cc] text-white p-8 rounded-3xl shadow-xl flex items-center gap-4">
                        <span className="text-4xl">✈️</span>
                        <div>
                            <h3 className="text-2xl font-bold">Telegram</h3>
                            <p>Join the group</p>
                        </div>
                    </div>
                </div>
            </div>
        </AbsoluteFill>
    );
};
