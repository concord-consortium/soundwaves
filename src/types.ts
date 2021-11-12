export const ZOOM_BUTTONS_WIDTH = 130; // px, it should match width of zoom-buttons-container defined in CSS file
const SIDE_MARGIN = 8; // Units: px. If changing; also change $margin, in vars.scss
const BORDER_WIDTH = 2; // Units: px; If changing; also change: $borderWidth, in vars.scss
export const SIDE_MARGIN_PLUS_BORDER = SIDE_MARGIN + BORDER_WIDTH; // Units: px;
export const SOUND_WAVE_GRAPH_HEIGHT = 105;
export const ZOOMED_OUT_GRAPH_HEIGHT = 45;

// Arbitrary value (in Hz) -- but it needs to be in valid range, per the API specification.
// The specification requires browsers to support a range of, at least: 8000..96000
// See: https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer/AudioBuffer
      // const minSupportedSampleRate = 44100;
export const SOUND_SAMPLE_RATE = 44100;


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
  shouldDrawProgressMarker?: boolean;
}

export interface IZoomButtonsProps {
  handleZoomOut?: () => void;
  handleZoomIn?: () => void;
}

export interface ISoundWavePropsWithData extends ISoundWaveProps {
  data: Float32Array;
}

export interface ISoundWavePropsWithDataAndCarrier extends ISoundWavePropsWithData {
  carrier: Float32Array;
}

export type SoundName =
  "middle-c"
  | "c2"
  | "baby-cry"
  | "rock-and-knock-drum-loop"
  | "cut-beat"
  | "cosmic-arp"
  | "hard-base"
  | "scratch-sample"
  | "record-my-own";

export type Modulation = "" | "AM" | "FM";
