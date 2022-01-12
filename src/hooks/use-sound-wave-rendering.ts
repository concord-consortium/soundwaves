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
  const { ctx, width, height, audioBuffer } = props;

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

        // -- commented out, but deliberately not removed, per: PT #180792001
// Used only in the zoomed in view.
// const drawAmplitudeMarker = (props: IDrawHelperProps) => {
//   const { ctx, width, height, zoom } = props;

//   const markerPadding = Math.round(2000 / zoom); // X samples point away from the center
//   const kSampleDiff = 5;
//   const baseY = height * 0.5;

//   const pointsCount = getPointsCount(props);
//   const currentDataPointIdx = getCurrentSampleIdx(props);

//   const startIdx = currentDataPointIdx + markerPadding;

//   let amplitudeX = null;
//   let amplitudeY = null;
//   for (let i = startIdx; i < currentDataPointIdx + pointsCount * 0.5; i++) {
//     const y1 = getCurrentAmplitudeY(props, i - kSampleDiff);
//     const y2 = getCurrentAmplitudeY(props, i);
//     const y3 = getCurrentAmplitudeY(props, i + kSampleDiff);
//     // Find the local min (note that the Y axis is upside down -> 0 is at the top of the canvas).
//     if ((y1 > y2) && (y2 < y3)) {
//       amplitudeX = i;
//       amplitudeY = y2;
//       break;
//     }
//   }

//   if (amplitudeX !== null && amplitudeY !== null) {
//     const kLineWidth = 3;
//     const xScale = width / pointsCount;
//     const minPointIdx = currentDataPointIdx - 0.5 * pointsCount; // currentDataPointIdx is always in the middle
//     const xScaled = (amplitudeX - minPointIdx) * xScale - 0.5 * kLineWidth;
//     const amplitudeLineHeight = amplitudeY - baseY;
//     // Vertical line
//     ctx.fillStyle = "#892be2";
//     ctx.fillRect(xScaled, baseY, kLineWidth, amplitudeLineHeight);
//     // I-beam
//     const kIBeamWidth = 12;
//     ctx.fillRect(xScaled - 0.5 * kIBeamWidth + 0.5 * kLineWidth, amplitudeY - kLineWidth, kIBeamWidth, kLineWidth);
//     ctx.fillRect(xScaled - 0.5 * kIBeamWidth + 0.5 * kLineWidth, baseY - 0.5 * kLineWidth, kIBeamWidth, kLineWidth);
//     // Draw (semi-opaque) background for the text
//     const kTextTopPadding = 6;
//     const kTextFontSize = 14;
//     const kBoxWidth = 75;
//     const kBoxHeight = kTextFontSize * 1.33;
//     const textY = Math.max(18, amplitudeY - kTextTopPadding);
//     ctx.fillStyle = "#ffffffb0";
//     ctx.fillRect(xScaled + kIBeamWidth * 0.6, textY - kTextFontSize, kBoxWidth, kBoxHeight);
//     // Label
//     ctx.fillStyle = "#892be2";
//     ctx.textAlign = "left";
//     ctx.font = `${kTextFontSize}px Comfortaa, cursive`;
//     ctx.fillText("Amplitude", xScaled + kIBeamWidth * 0.6, textY);
//   }
// };

        // -- commented out, but deliberately not removed, per: PT #180792001
// const drawWaveLengthMarker = (props: IDrawHelperProps) => {
//   const { ctx, width, height, zoom, data, pureToneFrequency } = props;

//   const kSampleDiff = 1;
//   const baseY = height * 0.5;
//   const pointsCount = getPointsCount(props);
//   // X samples point away from the center
//   const markerPadding = Math.min(pointsCount * 0.25, Math.round(20000 / zoom));

//   const currentDataPointIdx = getCurrentSampleIdx(props);

//   const startIdx = currentDataPointIdx + markerPadding;

//   let waveX1 = null; // X coord of the first sign change
//   let waveX2 = null; // X coord of the second sign change
//   let waveX3 = null; // X coord of the third sign change
//   for (let i = startIdx; i < currentDataPointIdx + pointsCount * 0.5; i++) {
//     const y1 = data[i - kSampleDiff];
//     const y2 = data[i + kSampleDiff];
//     if (y1 !== undefined && y2 !== undefined && Math.sign(y1) !== Math.sign(y2)) {
//       if (waveX1 === null) {
//         waveX1 = i;
//         i += kSampleDiff * 2;
//       } else if (waveX2 === null) {
//         waveX2 = i;
//         i += kSampleDiff * 2;
//       } else {
//         waveX3 = i;
//         break;
//       }
//     }
//   }

//   if (waveX1 !== null && waveX3 !== null) {
//     const kLineWidth = 3;
//     const xScale = width / pointsCount;
//     const minPointIdx = currentDataPointIdx - 0.5 * pointsCount; // currentDataPointIdx is always in the middle
//     const x1Scaled = (waveX1 - minPointIdx) * xScale;
//     const x3Scaled = (waveX3 - minPointIdx) * xScale;

//     // Horizontal line
//     ctx.fillStyle = "#892be2";
//     ctx.fillRect(x1Scaled, baseY - 0.5 * kLineWidth, (x3Scaled - x1Scaled), kLineWidth);

//     // I-beam
//     const kIBeamWidth = 12;
//     ctx.fillRect(x1Scaled - kLineWidth, baseY - kIBeamWidth * 0.5, kLineWidth, kIBeamWidth);
//     ctx.fillRect(x3Scaled, baseY - kIBeamWidth * 0.5, kLineWidth, kIBeamWidth);

//     // Draw (semi-opaque) background for the text
//     const kTextFontSize = 14;
//     const kTextTopPadding = 40;
//     const kBoxWidth = 150;
//     const kBoxHeight = kTextFontSize * 1.33;
//     ctx.fillStyle = "#ffffffb0";
//     ctx.fillRect((x1Scaled + x3Scaled) * 0.5 - 0.5 * kBoxWidth, baseY + 0.65 * kTextTopPadding, kBoxWidth, kBoxHeight);

//     // Label
//     ctx.fillStyle = "#892be2";
//     ctx.textAlign = "center";
//     ctx.font = `${kTextFontSize} Comfortaa, cursive`;
//     const wavelengthInMs = 1 / (pureToneFrequency || 1) * 1000;
//     ctx.fillText(`Wave length: ${wavelengthInMs.toFixed(2)}ms`, (x1Scaled + x3Scaled) * 0.5, baseY + kTextTopPadding);
//   }
// };

export const useSoundWaveRendering = (canvasRef: RefObject<HTMLCanvasElement>, data: Float32Array, props: ISoundWaveProps) => {
  const { width, height, audioBuffer, volume, playbackProgress, zoom, zoomedInView, shouldDrawProgressMarker, shouldDrawWaveCaptions: shouldDrawAmplitudeWavelengthCaptions, pureToneFrequency } = props;

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
      ctx, width, height, audioBuffer, data, volume, playbackProgress, zoom, zoomedInView, pureToneFrequency
    };

    drawBackground(drawHelperProps);
    drawSoundWaveLine(drawHelperProps);
    if (zoomedInView) {
      drawTimeCaptions(drawHelperProps);
      if (shouldDrawProgressMarker) {
        drawProgressMarker(drawHelperProps);
      }
      if (shouldDrawAmplitudeWavelengthCaptions) {
        // commented out, but deliberately not removed, per: PT #180792001
        // drawAmplitudeMarker(drawHelperProps);
        // drawWaveLengthMarker(drawHelperProps);
      }
    } else {
      drawZoomAreaMarker(drawHelperProps);
    }
  }, [canvasRef, width, height, audioBuffer, data, volume, playbackProgress, zoom, zoomedInView, pureToneFrequency, shouldDrawAmplitudeWavelengthCaptions, shouldDrawProgressMarker]);
};
