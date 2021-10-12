export interface ISoundWaveProps {
  width: number;
  height: number;
  audioBuffer?: AudioBuffer;
  volume: number; // [0, 2], 1 is the default volume
  playbackProgress: number; // normalized, [0, 1]
  zoom: number;
  zoomedInView: boolean;
  interactive?: boolean;
  onProgressUpdate?: (newProgress: number) => void;
}

export interface ISoundWavePropsWithData extends ISoundWaveProps {
  data: Float32Array;
}
