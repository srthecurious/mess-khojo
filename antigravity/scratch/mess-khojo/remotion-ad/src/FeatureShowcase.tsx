import { interpolate, useCurrentFrame, useVideoConfig, AbsoluteFill } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Outfit';
import { Search, MapPin, CheckCircle } from 'lucide-react';

const { fontFamily } = loadFont();

export const FeatureShowcase: React.FC = () => {
    const frame = useCurrentFrame();
    const { width, height } = useVideoConfig();

    const opacity = interpolate(frame, [0, 20], [0, 1]);
    const slideX = interpolate(frame, [0, 30], [width, 0], {
        extrapolateRight: 'clamp',
    });

    const features = [
        { icon: <Search size={60} />, text: 'Easy Search' },
        { icon: <MapPin size={60} />, text: 'Locate Nearby' },
        { icon: <CheckCircle size={60} />, text: 'Verified Listings' },
    ];

    return (
        <AbsoluteFill style={{
            backgroundColor: 'white',
            fontFamily,
            padding: 100,
            justifyContent: 'center'
        }}>
            <div style={{ transform: `scale(${opacity})`, opacity }}>
                <h1 style={{ color: '#4B2E83', fontSize: 100, marginBottom: 80, textAlign: 'center' }}>
                    Everything you need
                </h1>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 60 }}>
                {features.map((feature, i) => {
                    const featureOpacity = interpolate(
                        frame,
                        [40 + i * 20, 60 + i * 20],
                        [0, 1],
                        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                    );
                    const featureX = interpolate(
                        frame,
                        [40 + i * 20, 60 + i * 20],
                        [100, 0],
                        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                    );

                    return (
                        <div key={i} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 40,
                            opacity: featureOpacity,
                            transform: `translateX(${featureX}px)`
                        }}>
                            <div style={{
                                backgroundColor: '#EDEAF4',
                                color: '#4B2E83',
                                padding: 30,
                                borderRadius: '50%',
                                display: 'flex'
                            }}>
                                {feature.icon}
                            </div>
                            <span style={{ fontSize: 70, fontWeight: 600, color: '#1F2937' }}>
                                {feature.text}
                            </span>
                        </div>
                    );
                })}
            </div>
        </AbsoluteFill>
    );
};
