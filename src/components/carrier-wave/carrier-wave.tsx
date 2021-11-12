import React, { ChangeEvent, useEffect, useState } from "react";
import { Modulation, ZOOM_BUTTONS_WIDTH, SOUND_WAVE_GRAPH_HEIGHT, ZOOMED_OUT_GRAPH_HEIGHT } from "../../types";
import { getFMCarrierWave } from "../../utils/audio";
import { SoundWave } from "../sound-wave";
import { ZoomButtons } from "../zoom-buttons/zoom-buttons";

import "./carrier-wave.scss";

type CarrierWave = { modulation: Modulation, frequency: number };

const carrierWaves: Record<string, CarrierWave> = {
  "Choose . . .": { modulation: "", frequency: 0 },
  // "AM 540kHz": { modulation: "AM", frequency: 540e3 },
  // "AM 600kHz": { modulation: "AM", frequency: 600e3 },
  // "AM 1200kHz": { modulation: "AM", frequency: 1200e3 },
  "FM 2KHz": { modulation: "FM", frequency: 2e3 },
  "FM 4KHz": { modulation: "FM", frequency: 4e3 },
  "FM 8KHz": { modulation: "FM", frequency: 8e3 },
};

export interface ICarrierWaveProps {
  audioBuffer?: AudioBuffer; // This is the buffer for the user-chosen sound; and NOT the carrier wave
  playbackProgress: number; // normalized, [0, 1]
  graphWidth: number;
  volume: number;
}

export const CarrierWave = (props: ICarrierWaveProps) => {
  const { audioBuffer, playbackProgress, graphWidth, volume } = props;
  const [carrierBuffer, setCarrierBuffer] = useState<AudioBuffer>();
  const [carrierZoom, setCarrierZoom] = useState<number>(16);
  const [carrierWaveSelection, setCarrierWaveSelection] = useState<string>("Choose . . .");

  const carrierFrequency = carrierWaves[carrierWaveSelection].frequency;
  const modulation = carrierWaves[carrierWaveSelection].modulation;
  // Using 20kHz as upper range of human hearing
  const timesHigherThanHuman = carrierFrequency !== 0 ? `${(carrierFrequency / 2e4).toString()}x` : "";
  const carrierWavelength = carrierFrequency !== 0 ? `${((1 / carrierFrequency) * 1000).toPrecision(3)}ms` : "";

  useEffect(() => {
    if (audioBuffer && carrierFrequency !== 0 && modulation === "FM") {
      const updateCarrierBuffer = async () => {
        setCarrierBuffer(await getFMCarrierWave(audioBuffer, carrierFrequency, volume));
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
            volume={1}
            playbackProgress={playbackProgress}
            zoom={carrierZoom}
            zoomedInView={true}
            shouldDrawProgressMarker={true}
            interactive={false}
          />
        </div>
        <div className="zoomed-out-graph-container chosen-carrier">
          <SoundWave
            width={graphWidth - ZOOM_BUTTONS_WIDTH}
            height={ZOOMED_OUT_GRAPH_HEIGHT}
            audioBuffer={carrierBuffer}
            volume={1}
            playbackProgress={playbackProgress}
            zoom={carrierZoom}
            zoomedInView={false}
            shouldDrawProgressMarker={false}
            interactive={false}
          />
          <ZoomButtons handleZoomIn={handleZoomIn} handleZoomOut={handleZoomOut} />
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
