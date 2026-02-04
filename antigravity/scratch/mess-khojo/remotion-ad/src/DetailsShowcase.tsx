import { interpolate, useCurrentFrame, AbsoluteFill, spring, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Outfit';
import { Wifi, Home, Coffee, Shield } from 'lucide-react';

const { fontFamily } = loadFont();

export const DetailsShowcase: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const bounce = spring({
        frame,
        fps,
        config: {
            damping: 10,
        },
    });

    const amenities = [
        { icon: <Wifi size={50} />, label: 'Free Wifi' },
        { icon: <Home size={50} />, label: 'Clean Rooms' },
        { icon: <Coffee size={50} />, label: 'Good Food' },
        { icon: <Shield size={50} />, label: 'Secure' },
    ];

    return (
        <AbsoluteFill style={{
            backgroundColor: '#4B2E83',
            fontFamily,
            color: 'white',
            padding: 80,
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <div style={{ opacity: interpolate(frame, [0, 20], [0, 1]), textAlign: 'center' }}>
                <h1 style={{ fontSize: 100, marginBottom: 100 }}>Premium Facilities</h1>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 60,
                    marginTop: 40
                }}>
                    {amenities.map((item, i) => {
                        const s = spring({
                            frame: frame - (40 + i * 10),
                            fps,
                            config: { damping: 10 }
                        });
                        return (
                            <div key={i} style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                padding: 40,
                                borderRadius: 30,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 20,
                                transform: `scale(${s})`,
                                opacity: s
                            }}>
                                {item.icon}
                                <span style={{ fontSize: 40, fontWeight: 500 }}>{item.label}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </AbsoluteFill>
    );
};
