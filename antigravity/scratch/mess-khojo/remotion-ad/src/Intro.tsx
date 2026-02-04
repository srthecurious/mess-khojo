import { interpolate, spring, useCurrentFrame, useVideoConfig, AbsoluteFill, Img, staticFile } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Outfit';

const { fontFamily } = loadFont();

export const Intro: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const logoScale = spring({
        frame,
        fps,
        config: {
            damping: 12,
        },
    });

    const opacity = interpolate(frame, [0, 20], [0, 1]);
    const textY = interpolate(frame, [20, 40], [50, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });

    return (
        <AbsoluteFill style={{
            backgroundColor: '#4B2E83',
            justifyContent: 'center',
            alignItems: 'center',
            fontFamily,
            color: 'white'
        }}>
            <div style={{ transform: `scale(${logoScale})`, opacity }}>
                <Img
                    src={staticFile('logo.png')}
                    style={{ width: 400, height: 400, borderRadius: '50%', border: '10px solid white' }}
                />
            </div>
            <div style={{
                marginTop: 60,
                fontSize: 80,
                fontWeight: 800,
                opacity,
                transform: `translateY(${textY}px)`
            }}>
                MessKhojo
            </div>
            <div style={{
                marginTop: 20,
                fontSize: 40,
                fontWeight: 500,
                opacity: interpolate(frame, [40, 60], [0, 1])
            }}>
                Find Your Perfect Mess!
            </div>
        </AbsoluteFill>
    );
};
