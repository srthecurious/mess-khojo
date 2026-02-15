import React from 'react';
import { Sequence } from "remotion";
import { SceneIntro } from "./components/SceneIntro";
import { SceneProblem } from "./components/SceneProblem";
import { SceneWalkthrough } from "./components/SceneWalkthrough";
import { SceneCommunity } from "./components/SceneCommunity";
import { SceneOutro } from "./components/SceneOutro";

export const RemotionVideo: React.FC = () => {
    return (
        <div className="flex-1 bg-white absolute inset-0">
            <Sequence from={0} durationInFrames={150}>
                <SceneIntro />
            </Sequence>
            <Sequence from={150} durationInFrames={250}>
                <SceneProblem />
            </Sequence>
            <Sequence from={400} durationInFrames={450}>
                <SceneWalkthrough />
            </Sequence>
            <Sequence from={850} durationInFrames={200}>
                <SceneCommunity />
            </Sequence>
            <Sequence from={1050} durationInFrames={150}>
                <SceneOutro />
            </Sequence>
        </div>
    );
};
