import React, { useEffect, useRef } from "react";
import "./sound-wave.scss";

interface ISoundWaveProps {
  width: number;
  height: number;
  data: Float32Array; // normalized, [0, 1]
  volume: number; // [0, 2], 1 is the default volume
  playbackProgress: number; // normalized, [0, 1]
  drawingStep: number;
  zoom: number;
  zoomedInView: boolean;
  interactive?: boolean;
  onProgressUpdate?: (newProgress: number) => void;
}

interface IDrawHelperProps extends ISoundWaveProps {
  ctx: CanvasRenderingContext2D;
}

const ZOOM_AREA_INTERACTION_MARGIN = 15;

const getWaveAmplitudeY = (props: ISoundWaveProps, index: number) => {
  const { data, volume, height } = props;
  const baseHeight = height * 0.5; // center wave vertically
  const range = height * 0.2; // leave some padding, and space for max volume equal to 2
  return -data[index] * volume * range + baseHeight;
};

const getCurrentDataPointIdx = (props: ISoundWaveProps) => {
  const { data, drawingStep, playbackProgress } = props;
  // If drawStep is equal to X, it means that we'll draw only every 10th point.
  // In this case, it's necessary to divide value by X, use Math.floor, and multiply by X
  // to ensure that possible index values are only multiplies of X.
  return Math.max(0, Math.floor(data.length * playbackProgress / drawingStep) * drawingStep);
};

const getCurrentDataPointX = (props: ISoundWaveProps) => {
  const { width, data, zoomedInView, zoom  } = props;
  const actualZoom = zoomedInView ? zoom : 1;
  const segmentWidth = width / data.length * actualZoom;
  const currentDataPointIdx = getCurrentDataPointIdx(props);
  return currentDataPointIdx * segmentWidth;
};

const drawBackground = (props: IDrawHelperProps) => {
  const { ctx, width, height } = props;
  ctx.fillStyle = "#eee";
  ctx.fillRect(0, 0, width, height);
};

const drawSoundWaveLine = (props: IDrawHelperProps) => {
  const { ctx, width, drawingStep, data, zoomedInView, zoom } = props;
  const actualZoom = zoomedInView ? zoom : 1;
  const segmentWidth = width / data.length * actualZoom;
  const currentDataPointIdx = getCurrentDataPointIdx(props);
  const startIdx = zoomedInView ? currentDataPointIdx : 0;
  const stopIdx = startIdx + data.length / actualZoom;
  const pointsCount = stopIdx - startIdx;

  for (let i = 0; i < pointsCount; i += drawingStep) {
    ctx.lineTo(i * segmentWidth, getWaveAmplitudeY(props, i + startIdx));
  }

  ctx.strokeStyle = "#999";
  ctx.stroke();
};

// Used only in the zoomed in view.
const drawProgressMarker = (props: IDrawHelperProps) => {
  const { ctx, height } = props;
  // Marker is always at the left edge. Probably it's going to change.
  const markerX = 0;
  const markerY = getWaveAmplitudeY(props, getCurrentDataPointIdx(props));

  ctx.fillStyle = "red";
  ctx.fillRect(markerX, 0, 1, height); // line
  ctx.beginPath();
  ctx.arc(markerX, markerY, 5, 0, 2 * Math.PI); // dot
  ctx.fill();
};

// Used only in the zoomed out view.
const drawZoomAreaMarker = (props: IDrawHelperProps) => {
  const { ctx, width, height, data, zoom } = props;
  const x = getCurrentDataPointIdx(props);
  const segmentWidth = width / data.length;
  const markerWidth = width / zoom;

  ctx.strokeStyle = "#333";
  ctx.lineWidth = 2;
  ctx.strokeRect(x * segmentWidth, 0, markerWidth, height);
};

export const SoundWave = (props: ISoundWaveProps) => {
  const {
    width, height, data, volume, playbackProgress, drawingStep, zoom, zoomedInView, interactive, onProgressUpdate
  } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
  }, [width, height, data, volume, playbackProgress, drawingStep, zoom, zoomedInView]);

  const getRelativeMouseX = (e: { clientX: number }) => {
    return e.clientX - (canvasRef.current?.offsetLeft || 0);
  };

  const isDragging = useRef(false);

  const handlePointerDown = (downEvent: React.PointerEvent) => {
    const startPointerX = getRelativeMouseX(downEvent);
    const currentPointX = getCurrentDataPointX(props);
    const zoomAreaX1 = currentPointX - ZOOM_AREA_INTERACTION_MARGIN;
    const zoomAreaX2 = getCurrentDataPointX(props) + width / zoom + ZOOM_AREA_INTERACTION_MARGIN;

    if (startPointerX >= zoomAreaX1 && startPointerX <= zoomAreaX2) {
      isDragging.current = true;
      document.body.style.cursor = "grab";
      const offset = startPointerX - currentPointX;

      const handleDragging = (moveEvent: PointerEvent) => {
        const pointerX = getRelativeMouseX(moveEvent);
        onProgressUpdate?.(Math.max(0, Math.min(1, (pointerX - offset) / width)));
      };

      const handleDragEnd = () => {
        document.removeEventListener("pointermove", handleDragging);
        document.removeEventListener("pointerup", handleDragEnd);
        isDragging.current = false;
        document.body.style.cursor = "default";
      };

      document.addEventListener<"pointermove">("pointermove", handleDragging);
      document.addEventListener<"pointerup">("pointerup", handleDragEnd);
    }
  };

  const handleHoverEffect = (moveEvent: React.PointerEvent) => {
    const pointerX = getRelativeMouseX(moveEvent);
    const zoomAreaX1 = getCurrentDataPointX(props) - ZOOM_AREA_INTERACTION_MARGIN;
    const zoomAreaX2 = getCurrentDataPointX(props) + width / zoom + ZOOM_AREA_INTERACTION_MARGIN;

    if (!isDragging.current && canvasRef.current) {
      if (pointerX >= zoomAreaX1 && pointerX <= zoomAreaX2) {
        canvasRef.current.style.cursor = "grab";
      } else {
        canvasRef.current.style.cursor = "default";
      }
    }
  };

  return (
    <div className={`sound-wave ${interactive ? "interactive" : ""}`}>
      <canvas
        ref={canvasRef}
        onPointerMove={interactive ? handleHoverEffect : undefined}
        onPointerDown={interactive ? handlePointerDown : undefined}
      />
    </div>
  );
};
