import React, { useEffect, useState } from "react";
import { Modulation, ZOOMED_OUT_GRAPH_HEIGHT } from "../../types";
import { getAMCarrierWave, getFMCarrierWave } from "../../utils/audio";
import { ButtonGroup } from "../button-group/button-group";
import { SoundWave } from "../sound-wave";

import "./carrier-wave.scss";

type CarrierWave = { modulation: Modulation, frequency: number };

export interface ICarrierWaveProps {
  audioBuffer?: AudioBuffer; // This is the buffer for the user-chosen sound; and NOT the carrier wave
  playbackProgress: number; // normalized, [0, 1]
  graphWidth: number;
  graphHeight: number;
  volume: number;
  onProgressUpdate?: (newProgress: number) => void;
  interactive: boolean;
}

export const CarrierWave = (props: ICarrierWaveProps) => {
  const { audioBuffer, playbackProgress, graphWidth, graphHeight, volume,
    onProgressUpdate, interactive } = props;

  const [carrierBuffer, setCarrierBuffer] = useState<AudioBuffer>();
  const [carrierZoom, setCarrierZoom] = useState<number>(16);
  const [carrierFrequency, setCarrierFrequency] = useState<number>(2e3);
  const [modulation, setModulation] = useState<string>("AM");

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

  const handleFrequencyButtonClicked = (index: number, value: string) => {
    const unscaledFrequency = parseInt(value, 10);
    setCarrierFrequency(unscaledFrequency * 1e3);
  };

  const handleModulationButtonClicked = (index: number, value: string) => {
    setModulation(value);
  };

  const handleZoomIn = () => {
    setCarrierZoom(Math.min(2048, carrierZoom * 2));
  };

  const handleZoomOut = () => {
    setCarrierZoom(Math.max(2, carrierZoom * 0.5));
  };

  return (
    <div className="carrier-wave-container">
      <div className="carrier-picker-container">
        <div className="modulation-container">
          <div className="carrier-picker-caption">
            Modulation
          </div>
          <div className="freq-mod-container">
            <ButtonGroup
              buttons={["AM", "FM"]}
              selectedButtonLabel={ modulation }
              onButtonClicked={handleModulationButtonClicked}
              />
          </div>
        </div>
        <div className="frequency-container">
          <div className="carrier-picker-caption">
            Carrier Frequency
          </div>
          <div className="freq-mod-container">
            <ButtonGroup
              buttons={["2", "4", "8"]}
              selectedButtonLabel={ (carrierFrequency / 1000).toString() }
              onButtonClicked={handleFrequencyButtonClicked}
              />
            &nbsp;&nbsp;kHz
          </div>
        </div>
      </div>
      <div className="carrier-wave-graph-container">
        <div className="zoomed-in-view">
          <SoundWave
            width={graphWidth}
            height={graphHeight}
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
    </div>
  );
};
