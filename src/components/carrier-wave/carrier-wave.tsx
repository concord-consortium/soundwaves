import React, { ChangeEvent, useEffect, useState } from "react";
import { Modulation, SOUND_WAVE_GRAPH_HEIGHT, ZOOMED_OUT_GRAPH_HEIGHT } from "../../types";
import { getAMCarrierWave, getFMCarrierWave } from "../../utils/audio";
import { SoundWave } from "../sound-wave";

import "./carrier-wave.scss";

type CarrierWave = { modulation: Modulation, frequency: number };

const carrierWaves: Record<string, CarrierWave> = {
  "Choose . . .": { modulation: "", frequency: 0 },
  "AM 2kHz": { modulation: "AM", frequency: 2e3 },
  "AM 4kHz": { modulation: "AM", frequency: 4e3 },
  "AM 8kHz": { modulation: "AM", frequency: 8e3 },
  "FM 2kHz": { modulation: "FM", frequency: 2e3 },
  "FM 4kHz": { modulation: "FM", frequency: 4e3 },
  "FM 8kHz": { modulation: "FM", frequency: 8e3 },
};

export interface ICarrierWaveProps {
  audioBuffer?: AudioBuffer; // This is the buffer for the user-chosen sound; and NOT the carrier wave
  playbackProgress: number; // normalized, [0, 1]
  graphWidth: number;
  volume: number;
  onProgressUpdate?: (newProgress: number) => void;
  interactive: boolean;
}

export const CarrierWave = (props: ICarrierWaveProps) => {
  const { audioBuffer, playbackProgress, graphWidth, volume,
    onProgressUpdate, interactive } = props;

  const [carrierBuffer, setCarrierBuffer] = useState<AudioBuffer>();
  const [carrierZoom, setCarrierZoom] = useState<number>(16);
  const [carrierWaveSelection, setCarrierWaveSelection] = useState<string>("Choose . . .");

  const carrierFrequency = carrierWaves[carrierWaveSelection].frequency;
  const modulation = carrierWaves[carrierWaveSelection].modulation;
  // Using 20kHz as upper range of human hearing
  const timesHigherThanHuman = carrierFrequency !== 0 ? `${(carrierFrequency / 2e4).toString()}x` : "";
  const carrierWavelength = carrierFrequency !== 0 ? `${((1 / carrierFrequency) * 1000).toPrecision(3)}ms` : "";

  useEffect(() => {
    if (audioBuffer && carrierFrequency !== 0 && modulation !== "") {
      const updateCarrierBuffer = async () => {
        const buffer = modulation === "AM" ?
          await getAMCarrierWave(audioBuffer, carrierFrequency) :
          await getFMCarrierWave(audioBuffer, carrierFrequency, volume);
        setCarrierBuffer(buffer);
      };
      updateCarrierBuffer();
    }
  }, [audioBuffer, carrierFrequency, volume, modulation]);

  const handleCarrierChange = ((event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setCarrierWaveSelection(value);
  });

  const handleZoomIn = () => {
    setCarrierZoom(Math.min(2048, carrierZoom * 2));
  };

  const handleZoomOut = () => {
    setCarrierZoom(Math.max(2, carrierZoom * 0.5));
  };

  const CarrierWaveOptions = (): any => {
    const carrierWaveKeys: string[] = [];
    for (const key in carrierWaves) {
      carrierWaveKeys.push(key);
    }
    const optionElements = carrierWaveKeys.map((key) =>
      <option key={key} value={key}>{ key }</option>
    );
    return optionElements;
  };

  return (
    <div className="carrier-wave-container">
      <div className="carrier-picker-container">
        <div className="carrier-picker-caption">
          Radio Carrier Wave:&nbsp;
        </div>
        <div className="freq-mod-container">
          <select value={carrierWaveSelection} onChange={handleCarrierChange}>
            <CarrierWaveOptions />
          </select>
        </div>
      </div>
      <div className="carrier-wave-graph-container">
        <div className="zoomed-in-view">
          <SoundWave
            width={graphWidth}
            height={SOUND_WAVE_GRAPH_HEIGHT}
            audioBuffer={carrierBuffer}
            volume={modulation === "AM" ? volume : 1}
            playbackProgress={playbackProgress}
            zoom={carrierZoom}
            zoomedInView={true}
            shouldDrawProgressMarker={(modulation !== "")}
            pureToneFrequency={carrierFrequency}
            interactive={false}
            handleZoomIn={handleZoomIn}
            handleZoomOut={handleZoomOut}
          />
        </div>
        <div className="zoomed-out-graph-container chosen-carrier">
          <SoundWave
            width={graphWidth}
            height={ZOOMED_OUT_GRAPH_HEIGHT}
            audioBuffer={carrierBuffer}
            volume={modulation === "AM" ? volume : 1}
            playbackProgress={playbackProgress}
            zoom={carrierZoom}
            zoomedInView={false}
            interactive={interactive}
            onProgressUpdate={onProgressUpdate}
          />
        </div>
      </div>
      <div className="wavelength-mod-container">
        <div>
          Wavelength:&nbsp;<span className="value">{ carrierWavelength }</span>
        </div>
        <div>
          &nbsp;Modulation:&nbsp;
          <span className="value">
            {
              modulation && ((modulation === "FM") ? "Frequency" : "Amplitude")
            }
          </span>
        </div>
      </div>

      <div className="times-higher-than-container">
        Higher than human hearing range by:&nbsp;
        <span className="value">{ timesHigherThanHuman }</span>
      </div>
    </div>
  );
};
