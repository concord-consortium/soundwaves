import { ISoundWaveProps } from "../types";

export const getCurrentAmplitudeY = (props: ISoundWaveProps, index: number) => {
  const { data, volume, height } = props;
  const baseHeight = height * 0.5; // center wave vertically
  const range = height * 0.2; // leave some padding, and space for max volume equal to 2
  return -data[index] * volume * range + baseHeight;
};

export const getCurrentSampleIdx = (props: ISoundWaveProps) => {
  const { data, drawingStep, playbackProgress } = props;
  // If drawStep is equal to X, it means that we'll draw only every 10th point.
  // In this case, it's necessary to divide value by X, use Math.floor, and multiply by X
  // to ensure that possible index values are only multiplies of X.
  return Math.max(0, Math.floor(data.length * playbackProgress / drawingStep) * drawingStep);
};

export const getCurrentSampleX = (props: ISoundWaveProps) => {
  const { width, data, zoomedInView, zoom  } = props;
  const actualZoom = zoomedInView ? zoom : 1;
  const segmentWidth = width / data.length * actualZoom;
  const currentDataPointIdx = getCurrentSampleIdx(props);
  return currentDataPointIdx * segmentWidth;
};
