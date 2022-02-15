import { RefObject, useEffect } from "react";
import { ISoundWaveProps } from "../types";
import { getCurrentSampleIdx, getCurrentAmplitudeY, getZoomedInViewPointsCount, getPointsCount } from "../utils/sound-wave-helpers";

export interface IDrawHelperProps extends ISoundWaveProps {
  ctx: CanvasRenderingContext2D;
  data: Float32Array;
}

const drawBackground = (props: IDrawHelperProps) => {
  const { ctx, width, height } = props;
  ctx.clearRect(0, 0, width, height);
};

const drawTimeCaptions = (props: IDrawHelperProps) => {
  const { ctx, width, height, playbackRate, audioBuffer, data } = props;

  // Need the audioBuffer to calculate
  if (!audioBuffer) { return; }

  const timePerSample = audioBuffer.duration / (data.length * playbackRate);
  const currentDataPointIdx = getCurrentSampleIdx(props);
  const zoomedInViewPointsCount = getZoomedInViewPointsCount(props);
  const leftRightOffsetInSamples = (zoomedInViewPointsCount / 2);
  const leftRightOffsetInMilliseconds =
    Math.round((timePerSample * leftRightOffsetInSamples) * 1000);
  const timeIndexInSeconds = timePerSample * currentDataPointIdx;
  const timeIndex = Math.round(timeIndexInSeconds * 1000);
  const timeIndexLeft = timeIndex - leftRightOffsetInMilliseconds;
  const timeIndexRight = timeIndex + leftRightOffsetInMilliseconds;

  const textPadding = 4;
  const textLeftLocation = textPadding;
  const textRightLocation = width - textPadding;
  const textCenterLocation = width / 2;
  const textBaselineYlocation = height - (textPadding);

  ctx.font = "'Comfortaa', cursive";
  ctx.textAlign = "left";
  ctx.fillText(`${timeIndexLeft} ms`, textLeftLocation, textBaselineYlocation);
  ctx.textAlign = "center";
  ctx.fillText(`${timeIndex} ms`, textCenterLocation, textBaselineYlocation);
  ctx.textAlign = "right";
  ctx.fillText(`${timeIndexRight} ms`, textRightLocation, textBaselineYlocation);
};

const drawSoundWaveLine = (props: IDrawHelperProps) => {
  const { ctx, width, zoomedInView } = props;
  const currentDataPointIdx = getCurrentSampleIdx(props);
  const zoomedInViewPointsCount = getZoomedInViewPointsCount(props);
  const pointsCount = getPointsCount(props);
  // It ensures that the current data point is exactly in the middle of the zoomed in view.
  const zoomedInViewPadding = Math.round(zoomedInViewPointsCount * 0.5);
  const xScale = width / pointsCount;
  const startIdx = zoomedInView ? currentDataPointIdx - zoomedInViewPadding : -zoomedInViewPadding;

  for (let i = 0; i < pointsCount; i += 1) {
    ctx.lineTo(i * xScale, getCurrentAmplitudeY(props, i + startIdx));
  }

  ctx.strokeStyle = (zoomedInView) ? "#024059" : "#3377BD";
  ctx.stroke();
};

// Used only in the zoomed in view.
const drawProgressMarker = (props: IDrawHelperProps) => {
  const { ctx, height, width } = props;
  // Marker is always at the left edge. Probably it's going to change.
  const markerX = Math.round(width * 0.5);
  const markerY = getCurrentAmplitudeY(props, getCurrentSampleIdx(props));

  ctx.fillStyle = "#ea6d2f";
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

  // Marker border
  ctx.strokeStyle = "#ea6d2f";
  ctx.lineWidth = 2;
  ctx.strokeRect(x * xScale, 0, markerWidth, height);

  // Marker area highlight
  ctx.fillStyle = "#ea6d2f40";
  ctx.fillRect( (x * xScale) + 2 , 2, markerWidth - 4, height -4);

  // Marker center hairline
  ctx.fillStyle = "#ea6d2f80";
  ctx.fillRect(x * xScale + 0.5 * markerWidth, 0, 1, height); // line
};


export const useSoundWaveRendering = (canvasRef: RefObject<HTMLCanvasElement>, data: Float32Array, props: ISoundWaveProps) => {
  const { width, height, audioBuffer, volume, playbackProgress, playbackRate, zoom, zoomedInView, shouldDrawProgressMarker, pureToneFrequency } = props;

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
      ctx, width, height, audioBuffer, data, volume, playbackProgress, zoom, zoomedInView, pureToneFrequency, playbackRate
    };

    drawBackground(drawHelperProps);
    drawSoundWaveLine(drawHelperProps);
    if (zoomedInView) {
      drawTimeCaptions(drawHelperProps);
      if (shouldDrawProgressMarker) {
        drawProgressMarker(drawHelperProps);
      }
    } else {
      drawZoomAreaMarker(drawHelperProps);
    }
  }, [canvasRef, width, height, audioBuffer, data, volume, playbackProgress, playbackRate, zoom, zoomedInView, pureToneFrequency, shouldDrawProgressMarker]);
};
