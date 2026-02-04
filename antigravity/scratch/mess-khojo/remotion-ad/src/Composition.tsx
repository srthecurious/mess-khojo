import { Series } from 'remotion';
import { Intro } from './Intro';
import { FeatureShowcase } from './FeatureShowcase';
import { DetailsShowcase } from './DetailsShowcase';
import { Outro } from './Outro';

export const MainComposition = () => {
    return (
        <Series>
            <Series.Sequence durationInFrames={150}>
                <Intro />
            </Series.Sequence>
            <Series.Sequence durationInFrames={300}>
                <FeatureShowcase />
            </Series.Sequence>
            <Series.Sequence durationInFrames={300}>
                <DetailsShowcase />
            </Series.Sequence>
            <Series.Sequence durationInFrames={150}>
                <Outro />
            </Series.Sequence>
        </Series>
    );
};
