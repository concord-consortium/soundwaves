import React, { useEffect, useRef } from "react";
import "./sound-wave.scss";

interface ISoundWaveProps {
  width: number;
  height: number;
  data: Float32Array; // normalized, [0, 1]
  volume: number; // [0, 2], 1 is the default volume
  playbackProgress: number; // normalized, [0, 1]
  reduceDataNTimes?: number;
  zoom: number;
}

export const SoundWave = (props: ISoundWaveProps) => {
  const { width, height, data, volume, playbackProgress, reduceDataNTimes, zoom } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    canvasRef.current.width = width;
    canvasRef.current.height = height;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) {
      return;
    }
    ctx.fillStyle = "#eee";
    ctx.fillRect(0, 0, width, height);

    if (data.length === 0) {
      return;
    }

    const segmentWidth = width / data.length;
    const baseHeight = height * 0.5;
    const range = height * 0.2; // leave some padding, and space for max volume equal to 2
    const step = reduceDataNTimes || 1;

    const currentDataIdx = Math.max(0, Math.floor(data.length * playbackProgress / step) * step);

    const startIdx = zoom > 1 ? currentDataIdx : 0;
    const stopIdx = startIdx + data.length * (1 / zoom);
    const pointsCount = stopIdx - startIdx;

    for (let i = 0; i < pointsCount; i += step) {
      ctx.lineTo(i * segmentWidth * zoom, -data[i + startIdx] * volume * range + baseHeight);
    }
    ctx.strokeStyle = "#999";
    ctx.stroke();

    // Progress marker
    ctx.fillStyle = "red";
    if (zoom === 1) {
      ctx.fillRect(width * playbackProgress, 0, 1, height);
    } else {
      // Zoomed in marker is always at the left edge.
      ctx.fillRect(0, 0, 1, height);
    }

    // Current amplitude marker
    const currentPointValue = -data[currentDataIdx] * volume * range + baseHeight;
    ctx.fillStyle = "red";
    ctx.beginPath();
    if (zoom === 1) {
      ctx.arc(width * playbackProgress, currentPointValue, 5, 0, 2 * Math.PI);
    } else {
      // Zoomed in marker is always at the left edge.
      ctx.arc(0, currentPointValue, 5, 0, 2 * Math.PI);
    }
    ctx.fill();

  }, [width, height, data, volume, playbackProgress, reduceDataNTimes, zoom]);

  return (
    <div className="sound-wave">
      <canvas ref={canvasRef} />
    </div>
  );
};
