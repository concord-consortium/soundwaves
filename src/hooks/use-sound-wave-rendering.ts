import { RefObject, useEffect } from "react";
import { ISoundWaveProps } from "../types";
import { getCurrentSampleIdx, getCurrentAmplitudeY } from "../utils/sound-wave-helpers";

export interface IDrawHelperProps extends ISoundWaveProps {
  ctx: CanvasRenderingContext2D;
}

const drawBackground = (props: IDrawHelperProps) => {
  const { ctx, width, height } = props;
  ctx.fillStyle = "#eee";
  ctx.fillRect(0, 0, width, height);
};

const drawSoundWaveLine = (props: IDrawHelperProps) => {
  const { ctx, width, drawingStep, data, zoomedInView, zoom } = props;
  const actualZoom = zoomedInView ? zoom : 1;
  const segmentWidth = width / data.length * actualZoom;
  const currentDataPointIdx = getCurrentSampleIdx(props);
  const startIdx = zoomedInView ? currentDataPointIdx : 0;
  const stopIdx = startIdx + data.length / actualZoom;
  const pointsCount = stopIdx - startIdx;

  for (let i = 0; i < pointsCount; i += drawingStep) {
    ctx.lineTo(i * segmentWidth, getCurrentAmplitudeY(props, i + startIdx));
  }

  ctx.strokeStyle = "#999";
  ctx.stroke();
};

// Used only in the zoomed in view.
const drawProgressMarker = (props: IDrawHelperProps) => {
  const { ctx, height } = props;
  // Marker is always at the left edge. Probably it's going to change.
  const markerX = 0;
  const markerY = getCurrentAmplitudeY(props, getCurrentSampleIdx(props));

  ctx.fillStyle = "red";
  ctx.fillRect(markerX, 0, 1, height); // line
  ctx.beginPath();
  ctx.arc(markerX, markerY, 5, 0, 2 * Math.PI); // dot
  ctx.fill();
};

// Used only in the zoomed out view.
const drawZoomAreaMarker = (props: IDrawHelperProps) => {
  const { ctx, width, height, data, zoom } = props;
  const x = getCurrentSampleIdx(props);
  const segmentWidth = width / data.length;
  const markerWidth = width / zoom;

  ctx.strokeStyle = "#333";
  ctx.lineWidth = 2;
  ctx.strokeRect(x * segmentWidth, 0, markerWidth, height);
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
