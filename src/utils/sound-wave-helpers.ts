import { ISoundWavePropsWithData } from "../types";

export const getCurrentAmplitudeY = (props: ISoundWavePropsWithData, index: number) => {
  const { data, volume, height } = props;
  const baseHeight = height * 0.5; // center wave vertically
  const range = height * 0.2; // leave some padding, and space for max volume equal to 2
  const rawValue = index > 0 && index < data.length ? -data[index] : 0;
  return rawValue * volume * range + baseHeight;
};

export const getCurrentSampleIdx = (props: ISoundWavePropsWithData) => {
  const { data, playbackProgress } = props;
  return Math.max(0, Math.floor(data.length * playbackProgress));
};

export const getPointsCount = (props: ISoundWavePropsWithData) => {
  const { data, zoomedInView } = props;
  const zoomedInViewPointsCount = getZoomedInViewPointsCount(props);
  if (zoomedInView) {
    return zoomedInViewPointsCount;
  } else {
    // This math ensures that there's a necessary padding around the sound wave in the zoomed out view.
    // The padding is based on the zoom level. These calculation could be also written as:
    // const padding = Math.round(zoomedInViewPointsCount * 0.5);
    // const pointsCount = data.length + 2 * padding;
    // Since 2 * padding = zoomedInViewPointsCount, it can be simplified in practice.
    return data.length + zoomedInViewPointsCount;
  }
};

// This makes sense only for zoomed out view. The zoomed in view has the current sample always centered.
export const getCurrentSampleX = (props: ISoundWavePropsWithData) => {
  const { width } = props;
  const xScale = width / getPointsCount(props);
  return getCurrentSampleIdx(props) * xScale;
};

export const getZoomedInViewPointsCount = (props: ISoundWavePropsWithData) => {
  const { data, zoom } = props;
  return Math.round(data.length / zoom);
};
