import React, { useRef } from "react";
import { useSoundWaveInteractions } from "../hooks/use-sound-wave-interactions";
import { useSoundWaveRendering } from "../hooks/use-sound-wave-rendering";
import { ISoundWaveProps } from "../types";
import "./sound-wave.scss";

export const SoundWave = (props: ISoundWaveProps) => {
  const { interactive } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useSoundWaveRendering(canvasRef, props);

  const { handlePointerDown, handlePointerMove } = useSoundWaveInteractions(canvasRef, props);

  return (
    <div className={`sound-wave ${interactive ? "interactive" : ""}`}>
      <canvas
        ref={canvasRef}
        onPointerDown={interactive ? handlePointerDown : undefined}
        onPointerMove={interactive ? handlePointerMove : undefined}
      />
    </div>
  );
};
