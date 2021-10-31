import React from "react";
import { ICarrierWaveProps, Frequency, Modulation } from "../types";

type CarrierWave = {modulation: Modulation, frequency: Frequency};

export const carrierWaves: Record<string, CarrierWave> = {
  "Choose . . .":   {modulation: "", frequency:  0},
  "AM 540kHz":   {modulation: "AM", frequency:  540e3},
  "AM 600kHz":   {modulation: "AM", frequency:  600e3},
  "AM 1200kHz":  {modulation: "AM", frequency: 1200e3},
  "FM 89.7MHz":  {modulation: "FM", frequency:  897e5},
  "FM 101.9MHz": {modulation: "FM", frequency: 1019e5},
  "FM 108.1MHz": {modulation: "FM", frequency: 1081e5},
};

export const CarrierWave = (props: ICarrierWaveProps) => {
  const {
    carrierWaveSelection,
    wavelength,
    timesHigherThanHuman,
    modulation,
    handleCarrierChange,
  } = props;

  const CarrierWaveOptions = (): any => {
    const carrierWaveKeys: string[] = [];
    for (const key in carrierWaves) {
      carrierWaveKeys.push(key);
    }
    const optionElements = carrierWaveKeys.map((key) =>
      <option key={key} value={key}>{key}</option>
    );
    return (optionElements);
  };

  return (
    <div className="carrier-wave-container">
      <div>
        Radio Carrier Wave:
      </div>
      <div className="freq-mod-container">
        <select value={carrierWaveSelection} onChange={handleCarrierChange}>
          <CarrierWaveOptions />
        </select>
      </div>
      <div>
        Wavelength:&nbsp;<span className="value">{wavelength}</span>
      </div>
      <div>
        Higher than human hearing range by:&nbsp;
        <span className="value">{timesHigherThanHuman}</span>
      </div>
      <div>
        Modulation:&nbsp;<span className="value">{modulation}</span>
      </div>
    </div>
  );
};
