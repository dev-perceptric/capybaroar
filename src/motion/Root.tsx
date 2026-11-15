import { Composition } from "remotion";
import { CapyMotion } from "./CapyMotion";
import { FPS, MOTION_CANVAS, totalFrames, type MotionProps } from "../lib/capy/motionRules";
import { SAMPLE } from "./sample";

export const Root = () => (
  <Composition
    id="CapyMotion"
    component={CapyMotion}
    fps={FPS}
    width={1080}
    height={1920}
    durationInFrames={totalFrames(SAMPLE.scenes)}
    defaultProps={SAMPLE}
    calculateMetadata={({ props }: { props: MotionProps }) => ({ durationInFrames: Math.max(1, totalFrames(props.scenes)), width: MOTION_CANVAS[props.aspect].w, height: MOTION_CANVAS[props.aspect].h })}
  />
);
