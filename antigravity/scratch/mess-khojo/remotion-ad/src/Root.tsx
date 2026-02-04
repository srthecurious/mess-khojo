import { Composition, registerRoot } from 'remotion';
import { MainComposition } from './Composition';
import './style.css';

export const RemotionRoot: React.FC = () => {
    return (
        <>
            <Composition
                id="MessKhojoAd"
                component={MainComposition}
                durationInFrames={900} // 30 seconds at 30 fps
                fps={30}
                width={1080}
                height={1920} // Portrait for social media ad
            />
        </>
    );
};

registerRoot(RemotionRoot);
