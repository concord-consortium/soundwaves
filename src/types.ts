export interface ISoundWaveProps {
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
