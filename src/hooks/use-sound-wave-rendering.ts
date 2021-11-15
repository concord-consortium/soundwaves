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
  const { ctx, width, height, zoomedInView, audioBuffer } = props;

  // Need the audioBuffer to calculate
  if (!audioBuffer) { return; }

  const timePerSample = 1 / audioBuffer.sampleRate;
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

  ctx.fillStyle = "#88D3DD";
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
  ctx.fillStyle = "#88D3DDFF";
  ctx.fillRect(x * xScale + 0.5 * markerWidth, 0, 1, height); // line
};

// Used only in the zoomed in view.
const drawSoundMarkers = (props: IDrawHelperProps) => {
  const { ctx, width, height, volume, zoomedInView } = props;

  // Draw AMPLITUDE marker
  const pointsCount = getPointsCount(props);
  const currentDataPointIdx = getCurrentSampleIdx(props);
  const zoomedInViewPointsCount = getZoomedInViewPointsCount(props);
  const zoomedInViewPadding = Math.round(zoomedInViewPointsCount * 0.5);
  const startIdx = zoomedInView ? currentDataPointIdx - zoomedInViewPadding : -zoomedInViewPadding;

  let minAmplitude = height;
  for (let i = 0; i < pointsCount; i++) {
    minAmplitude = Math.min(minAmplitude, getCurrentAmplitudeY(props, i + startIdx));
  }
  minAmplitude = Math.round(minAmplitude);

  const textBoxHeight = 14;
  const textBoxWidth = 54;
  const textPadding = 4;
  const amplitudeCaptionX = (width / 2);
  // Ensure the Y coordinate is not negative, so that caption is visible
  const amplitudeCaptionY = Math.max(minAmplitude - (textBoxHeight), 0);

console.log({captionY: amplitudeCaptionY},{volume},{height},{maxAmplitude: minAmplitude});

  // Draw the text background's border
  // const borderWidth = 1;
  // ctx.strokeStyle = "fuchsia"; // "#d0d0d080"; // "#ffffff";
  // ctx.lineWidth = borderWidth;
  // ctx.strokeRect(amplitudeCaptionX + borderWidth, amplitudeCaptionY + (textBoxHeight / 2),
  //   textBoxWidth, textBoxHeight);

  // Draw (semi-opaque) background for the text
  ctx.fillStyle = "#ffffffb0";
  ctx.fillRect(amplitudeCaptionX + 2, amplitudeCaptionY + (textBoxHeight / 2) + 1,
    textBoxWidth - (textPadding / 2), textBoxHeight - (textPadding / 2));

  // Draw the amplitude line
  ctx.fillStyle = "#303030";
  ctx.fillRect(width / 2, minAmplitude, 3, (height / 2) - minAmplitude);

  // Draw the amplitude label
  const textLeftLocation = amplitudeCaptionX + textPadding + 2;
  const textBaselineYlocation = amplitudeCaptionY + textBoxHeight + (textPadding);
  ctx.font = "'Comfortaa', cursive";
  ctx.textAlign = "left";
  ctx.fillStyle = "#303030";
  ctx.fillText(`Amplitude`, textLeftLocation, textBaselineYlocation);


// TODO: draw wavelength marker

  // const { ctx, width, height } = props;
  // ctx.font = "'Comfortaa', cursive";
  // ctx.textAlign = "left";
  // // ctx.fillText(`${timeIndexLeft} ms`, textLeftLocation, textBaselineYlocation);

};

export const useSoundWaveRendering = (canvasRef: RefObject<HTMLCanvasElement>, data: Float32Array, props: ISoundWaveProps) => {
  const { width, height, audioBuffer, volume, playbackProgress, zoom, zoomedInView, shouldDrawProgressMarker, shouldDrawAmplitudeWavelengthCaptions } = props;

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
      ctx, width, height, audioBuffer, data, volume, playbackProgress, zoom, zoomedInView
    };

    drawBackground(drawHelperProps);
    drawSoundWaveLine(drawHelperProps);
    if (zoomedInView) {
      drawTimeCaptions(drawHelperProps);
      if (shouldDrawProgressMarker) {
        drawProgressMarker(drawHelperProps);
      }
      if (shouldDrawAmplitudeWavelengthCaptions) {
        drawSoundMarkers(drawHelperProps);
      }
    } else {
      drawZoomAreaMarker(drawHelperProps);
    }
  }, [canvasRef, width, height, audioBuffer, data, volume, playbackProgress, zoom, zoomedInView, shouldDrawProgressMarker]);
};
