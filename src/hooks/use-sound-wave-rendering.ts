import { RefObject, useEffect } from "react";
import { ISoundWaveProps } from "../types";
import { getCurrentSampleIdx, getCurrentAmplitudeY, getZoomedInViewPointsCount, getPointsCount } from "../utils/sound-wave-helpers";

export interface IDrawHelperProps extends ISoundWaveProps {
  ctx: CanvasRenderingContext2D;
}

const drawBackground = (props: IDrawHelperProps) => {
  const { ctx, width, height } = props;
  ctx.clearRect(0, 0, width, height);
};

const drawSoundWaveLine = (props: IDrawHelperProps) => {
  const { ctx, width, drawingStep, zoomedInView } = props;
  const currentDataPointIdx = getCurrentSampleIdx(props);
  const zoomedInViewPointsCount = getZoomedInViewPointsCount(props);
  const pointsCount = getPointsCount(props);
  // It ensures that the current data point is exactly in the middle of the zoomed in view.
  const zoomedInViewPadding = Math.round(zoomedInViewPointsCount * 0.5);
  const xScale = width / pointsCount;
  const startIdx = zoomedInView ? currentDataPointIdx - zoomedInViewPadding : -zoomedInViewPadding;

  for (let i = 0; i < pointsCount; i += drawingStep) {
    ctx.lineTo(i * xScale, getCurrentAmplitudeY(props, i + startIdx));
  }

  ctx.strokeStyle = "#999";
  ctx.stroke();
};

// Used only in the zoomed in view.
const drawProgressMarker = (props: IDrawHelperProps) => {
  const { ctx, height, width } = props;
  // Marker is always at the left edge. Probably it's going to change.
  const markerX = Math.round(width * 0.5);
  const markerY = getCurrentAmplitudeY(props, getCurrentSampleIdx(props));

  ctx.fillStyle = "red";
  ctx.fillRect(markerX, 0, 1, height); // line
  ctx.beginPath();
  ctx.arc(markerX, markerY, 5, 0, 2 * Math.PI); // dot
  ctx.fill();
};

// Used only in the zoomed out view.
const drawZoomAreaMarker = (props: IDrawHelperProps) => {
  const { ctx, width, height } = props;
  const x = getCurrentSampleIdx(props);
  const zoomedInViewPointsCount = getZoomedInViewPointsCount(props);
  const pointsCount = getPointsCount(props);
  const xScale = width / pointsCount;
  const markerWidth = (zoomedInViewPointsCount / pointsCount) * width;

  ctx.strokeStyle = "#333";
  ctx.lineWidth = 2;
  ctx.strokeRect(x * xScale, 0, markerWidth, height);
  ctx.fillStyle = "rgba(255,0,0,0.5)";
  ctx.fillRect(x * xScale + 0.5 * markerWidth, 0, 1, height); // line
};

export const useSoundWaveRendering = (canvasRef: RefObject<HTMLCanvasElement>, props: ISoundWaveProps) => {
  const { width, height, data, volume, playbackProgress, drawingStep, zoom, zoomedInView } = props;

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    // Update canvas dimensions.
    canvasRef.current.width = width;
    canvasRef.current.height = height;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) {
      return;
    }
    // Just to keep things simple, provide one props object to all the helpers.
    const drawHelperProps: IDrawHelperProps = {
      ctx, width, height, data, volume, playbackProgress, drawingStep, zoom, zoomedInView
    };

    drawBackground(drawHelperProps);
    drawSoundWaveLine(drawHelperProps);
    if (zoomedInView) {
      drawProgressMarker(drawHelperProps);
    } else {
      drawZoomAreaMarker(drawHelperProps);
    }
  }, [canvasRef, width, height, data, volume, playbackProgress, drawingStep, zoom, zoomedInView]);
};
