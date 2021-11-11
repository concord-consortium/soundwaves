import React, { useEffect, useRef, useState } from "react";
import { useSoundWaveInteractions } from "../hooks/use-sound-wave-interactions";
import { useSoundWaveRendering } from "../hooks/use-sound-wave-rendering";
import { ISoundWaveProps } from "../types";
import { downsampleAudioBuffer, normalizeData } from "../utils/audio";
import "./sound-wave.scss";

// Performance - 20k seems to be reasonable limit (tested on desktop Chrome, Safari and iOS Safari)
const MAX_GRAPH_POINTS = 20000;

export const SoundWave = (props: ISoundWaveProps) => {
  const { interactive, audioBuffer, zoom, zoomedInView, debug } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState<Float32Array>(new Float32Array(0));

  if (debug) {
    console.log("interactive", interactive);
    console.log("zoom", zoom);
    console.log("audioBuffer", audioBuffer);
    console.log("channelData", audioBuffer?.getChannelData(0));
  }

  useEffect(() => {
    if (!audioBuffer) {
      return;
    }
    const actualZoom = zoomedInView ? zoom : 1;
    // Note that maxPointsCount is bigger for zoomed in view, as it displays only fraction of all the points.
    const maxPointsCount = MAX_GRAPH_POINTS * actualZoom;
    if (audioBuffer.length > maxPointsCount) {
      downsampleAudioBuffer(audioBuffer, maxPointsCount).then(result => {
        setData(normalizeData(result));
      });
    } else {
      // Nothing to do, the original data isn't too large.
      setData(normalizeData(audioBuffer.getChannelData(0)));
    }
  }, [audioBuffer, zoom, zoomedInView]);

  if (debug) {
    console.log("data", data);
  }

  useSoundWaveRendering(canvasRef, data, props);
  const { handlePointerDown, handlePointerMove } = useSoundWaveInteractions(canvasRef, data, props);

  const cssClasses =
    `sound-wave ${interactive ? "interactive" : ""} ${zoomedInView ? "zoomed-in-view" : ""}`;

  return (
    <div className={cssClasses}>
      <canvas
        ref={canvasRef}
        onPointerDown={interactive ? handlePointerDown : undefined}
        onPointerMove={interactive ? handlePointerMove : undefined}
      />
    </div>
  );
};
