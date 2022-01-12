import React, { useEffect, useRef, useState } from "react";
import { useSoundWaveInteractions } from "../hooks/use-sound-wave-interactions";
import { useSoundWaveRendering } from "../hooks/use-sound-wave-rendering";
import { ISoundWaveProps } from "../types";
import { downsampleAudioBuffer } from "../utils/audio";
import { ZoomButtons } from "./zoom-buttons/zoom-buttons";

import "./sound-wave.scss";

// Performance - 20k seems to be reasonable limit (tested on desktop Chrome, Safari and iOS Safari)
const MAX_GRAPH_POINTS = 20000;

export const SoundWave = (props: ISoundWaveProps) => {
  const {
    interactive,
    audioBuffer,
    zoom,
    zoomedInView,
    // -- commented out, but deliberately not removed, per: PT #180792001
    // shouldDrawWaveCaptions,
    // pureToneFrequency,
    handleZoomIn,
    handleZoomOut
  } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState<Float32Array>(new Float32Array(0));

  useEffect(() => {
    if (!audioBuffer) {
      return;
    }
    const actualZoom = zoomedInView ? zoom : 1;
    // Note that maxPointsCount is bigger for zoomed in view, as it displays only fraction of all the points.
    const maxPointsCount = MAX_GRAPH_POINTS * actualZoom;
    if (audioBuffer.length > maxPointsCount) {
      downsampleAudioBuffer(audioBuffer, maxPointsCount).then(result => {
        setData(result);
      });
    } else {
      // Nothing to do, the original data isn't too large.
      setData(audioBuffer.getChannelData(0));
    }
  }, [audioBuffer, zoom, zoomedInView]);

  useSoundWaveRendering(canvasRef, data, props);
  const { handlePointerDown, handlePointerMove } = useSoundWaveInteractions(canvasRef, data, props);

  const cssClasses =
    `sound-wave ${interactive ? "interactive" : ""} ${zoomedInView ? "zoomed-in-view" : ""}`;

  return (
    <div className={cssClasses}>
      {
        //  -- commented out, but deliberately not removed, per: PT #180792001
        // shouldDrawWaveCaptions && pureToneFrequency &&
        // <div className="frequency">Frequency: {pureToneFrequency} Hz</div>
      }
      <canvas
        ref={canvasRef}
        onPointerDown={interactive ? handlePointerDown : undefined}
        onPointerMove={interactive ? handlePointerMove : undefined}
      />
      {
        zoomedInView &&
          <ZoomButtons handleZoomIn={handleZoomIn} handleZoomOut={handleZoomOut}/>
      }
    </div>
  );
};
