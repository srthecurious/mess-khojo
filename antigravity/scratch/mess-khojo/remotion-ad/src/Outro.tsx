import { interpolate, useCurrentFrame, AbsoluteFill, spring, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Outfit';

const { fontFamily } = loadFont();

export const Outro: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const scale = spring({
        frame,
        fps,
        config: {
            stiffness: 100,
        },
    });

    return (
        <AbsoluteFill style={{
            backgroundColor: '#F8F7F3',
            fontFamily,
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center'
        }}>
            <div style={{ transform: `scale(${scale})`, opacity: interpolate(frame, [0, 20], [0, 1]) }}>
                <h1 style={{ color: '#4B2E83', fontSize: 120, marginBottom: 20 }}>Ready to Move?</h1>
                <p style={{ color: '#6B7280', fontSize: 60, marginBottom: 80 }}>Visit MessKhojo today</p>

                <div style={{
                    backgroundColor: '#4B2E83',
                    color: 'white',
                    padding: '40px 80px',
                    borderRadius: 100,
                    fontSize: 80,
                    fontWeight: 700,
                    boxShadow: '0 20px 50px rgba(75, 46, 131, 0.3)'
                }}>
                    www.messkhojo.com
                </div>
            </div>

            <div style={{
                position: 'absolute',
                bottom: 100,
                color: '#9CA3AF',
                fontSize: 40,
                opacity: interpolate(frame, [100, 130], [0, 1])
            }}>
                Available on Web & Mobile
            </div>
        </AbsoluteFill>
    );
};
