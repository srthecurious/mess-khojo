import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Sequence, Img, staticFile, useVideoConfig } from "remotion";

const TouchIndicator: React.FC<{ x: number; y: number; progress: number }> = ({ x, y, progress }) => {
    const scale = interpolate(progress, [0, 0.5, 1], [0, 1, 0]);
    const opacity = interpolate(progress, [0, 0.5, 1], [0, 1, 0]);
    return (
        <div
            style={{
                position: 'absolute',
                left: x,
                top: y,
                width: 60,
                height: 60,
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                transform: `translate(-50%, -50%) scale(${scale})`,
                opacity: opacity,
                border: '4px solid white',
                boxShadow: '0 0 10px rgba(0,0,0,0.3)',
                zIndex: 100,
            }}
        />
    );
};

export const InstagramVideo: React.FC = () => {
    const { fps } = useVideoConfig(); // 30fps

    // Timing constants (in frames)
    // 1. Home: 0 - 90
    // 2. Scroll: 90 - 150
    // 3. Click Mess: 150 - 180
    // 4. Mess Details: 180 - 270
    // 5. Click Room: 270 - 300
    // 6. Room Details: 300 - 390
    // 7. Click Request: 390 - 420
    // 8. Modal: 420 - 510
    // 9. Click Confirm: 510 - 540
    // 10. Final: 540 - 600

    return (
        <AbsoluteFill className="bg-black">
            {/* 1. Home Screen */}
            <Sequence from={0} durationInFrames={150}>
                <Img src={staticFile("screenshots-instagram/1_home.png")} className="w-full h-full object-cover" />
            </Sequence>

            {/* Scroll Animation */}
            <Sequence from={90} durationInFrames={60}>
                <AbsoluteFill>
                    <Img
                        src={staticFile("screenshots-instagram/1_home.png")}
                        className="w-full h-full object-cover absolute top-0"
                        style={{ transform: `translateY(${interpolate(useCurrentFrame(), [0, 60], [0, -100])}%)` }}
                    />
                    <Img
                        src={staticFile("screenshots-instagram/2_home_scrolled.png")}
                        className="w-full h-full object-cover absolute top-0"
                        style={{ transform: `translateY(${interpolate(useCurrentFrame(), [0, 60], [100, 0])}%)` }}
                    />
                </AbsoluteFill>
            </Sequence>

            {/* Click Mess Card */}
            <Sequence from={150} durationInFrames={30}>
                <Img src={staticFile("screenshots-instagram/2_home_scrolled.png")} className="w-full h-full object-cover" />
                <TouchIndicator x={540} y={1200} progress={interpolate(useCurrentFrame(), [0, 30], [0, 1])} />
            </Sequence>

            {/* 2. Mess Details */}
            <Sequence from={180} durationInFrames={120}>
                <Img src={staticFile("screenshots-instagram/3_details.png")} className="w-full h-full object-cover" />
            </Sequence>

            {/* Click Room Group / Card */}
            <Sequence from={270} durationInFrames={30}>
                <Img src={staticFile("screenshots-instagram/3_details.png")} className="w-full h-full object-cover" />
                {/* Simulate checking room types */}
                <TouchIndicator x={540} y={800} progress={interpolate(useCurrentFrame(), [0, 30], [0, 1])} />
            </Sequence>

            {/* 3. Room Details */}
            <Sequence from={300} durationInFrames={120}>
                <Img src={staticFile("screenshots-instagram/3_details_room.png")} className="w-full h-full object-cover" />
            </Sequence>

            {/* Click Request Call */}
            <Sequence from={390} durationInFrames={30}>
                <Img src={staticFile("screenshots-instagram/3_details_room.png")} className="w-full h-full object-cover" />
                <TouchIndicator x={540} y={1600} progress={interpolate(useCurrentFrame(), [0, 30], [0, 1])} />
            </Sequence>

            {/* 4. Modal */}
            <Sequence from={420} durationInFrames={120}>
                <Img src={staticFile("screenshots-instagram/4_modal.png")} className="w-full h-full object-cover" />
            </Sequence>

            {/* Click Confirm */}
            <Sequence from={510} durationInFrames={30}>
                <Img src={staticFile("screenshots-instagram/4_modal.png")} className="w-full h-full object-cover" />
                <TouchIndicator x={680} y={1150} progress={interpolate(useCurrentFrame(), [0, 30], [0, 1])} />
            </Sequence>

            {/* 5. Final State */}
            <Sequence from={540}>
                <Img src={staticFile("screenshots-instagram/5_confirm.png")} className="w-full h-full object-cover" />
            </Sequence>

        </AbsoluteFill>
    );
};
