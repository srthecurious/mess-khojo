import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Sequence, Img, staticFile } from "remotion";
import { PhoneFrame } from './PhoneFrame';

export const SceneWalkthrough: React.FC = () => {
    const frame = useCurrentFrame();

    return (
        <AbsoluteFill className="bg-gray-50 flex items-center justify-center">
            <div className="scale-75 md:scale-100 transition-transform">
                <PhoneFrame>
                    <Sequence from={0} durationInFrames={90}>
                        <Img src={staticFile("screenshots/home.png")} className="w-full" />
                        {/* Simulate scroll */}
                        <div className="absolute top-2/3 left-1/2 -translate-x-1/2 w-10 h-10 bg-white/50 rounded-full animate-ping"></div>
                    </Sequence>
                    <Sequence from={90} durationInFrames={90}>
                        <Img src={staticFile("screenshots/list.png")} className="w-full" />
                    </Sequence>
                    <Sequence from={180} durationInFrames={90}>
                        <Img src={staticFile("screenshots/details.png")} className="w-full" />
                    </Sequence>
                    <Sequence from={270}>
                        <Img src={staticFile("screenshots/booking.png")} className="w-full" />
                    </Sequence>
                </PhoneFrame>
            </div>

            {/* Overlay Text */}
            <div className="absolute bottom-20 left-0 w-full text-center">
                <Sequence from={0} durationInFrames={90}>
                    <h3 className="text-4xl font-bold text-brand-primary bg-white/80 px-4 py-2 inline-block rounded-xl shadow-lg">Browse Stays</h3>
                </Sequence>
                <Sequence from={90} durationInFrames={90}>
                    <h3 className="text-4xl font-bold text-brand-primary bg-white/80 px-4 py-2 inline-block rounded-xl shadow-lg">View Details</h3>
                </Sequence>
                <Sequence from={180}>
                    <h3 className="text-4xl font-bold text-brand-primary bg-white/80 px-4 py-2 inline-block rounded-xl shadow-lg">Book Instantly</h3>
                </Sequence>
            </div>
        </AbsoluteFill>
    );
};
