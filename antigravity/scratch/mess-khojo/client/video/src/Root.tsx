import React from 'react';
import { Composition } from 'remotion';
import { RemotionVideo } from './Video';
import { InstagramVideo } from './InstagramVideo';
import './style.css';

export const RemotionRoot: React.FC = () => {
    return (
        <>
            <Composition
                id="MessKhojoPromo"
                component={RemotionVideo}
                durationInFrames={1200}
                fps={30}
                width={1920}
                height={1080}
            />
            <Composition
                id="InstagramReel"
                component={InstagramVideo}
                durationInFrames={600}
                fps={30}
                width={1080}
                height={1920}
            />
        </>
    );
};
