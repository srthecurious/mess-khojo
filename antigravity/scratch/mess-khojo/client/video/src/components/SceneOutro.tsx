import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Img, staticFile } from "remotion";

export const SceneOutro: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const scale = spring({
        frame,
        fps,
        config: { damping: 100 },
    });

    return (
        <AbsoluteFill className="bg-brand-primary flex items-center justify-center flex-col">
            <Img src={staticFile("logo.png")} className="w-40 h-40 mb-6 drop-shadow-xl" />

            <h1 className="text-6xl font-black text-white mb-4 text-center">
                Mess Khojo
            </h1>
            <p className="text-3xl text-white/90 mb-10 font-light tracking-widest uppercase">
                Mess hunting made easy
            </p>

            <div style={{ transform: `scale(${scale})` }} className="bg-white text-brand-primary px-10 py-4 rounded-full text-3xl font-bold shadow-2xl hover:bg-gray-100 transition-colors cursor-pointer">
                Visit Link 🔗
            </div>

            <p className="text-white/60 mt-8 text-xl">www.messkhojo.com</p>
        </AbsoluteFill>
    );
};
