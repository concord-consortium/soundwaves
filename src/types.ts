import { ChangeEvent } from "react";

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
  debug?: boolean;
}

export interface ICarrierWaveProps {
  width: number;
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
| "scratch-sample";


// export interface ICarrierWaveProps {
//   carrierWaveSelection: string;
//   wavelength: string;
//   timesHigherThanHuman: string;
//   modulation: string;
//   handleCarrierChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
// }

export type Modulation = "" | "AM" | "FM" ;
export type Frequency = 0 | 540e3 | 600e3 | 1200e3 | 897e5 | 1019e5 | 1081e5 ;
