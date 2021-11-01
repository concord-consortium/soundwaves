import React, { ChangeEvent } from "react";

import { SoundName } from "../../types";
import MicIcon from "../../assets/icons/mic_black_48dp.svg";
import LabelsIcon from "../../assets/icons/sell_black_48dp.svg";

import "./sound-picker.scss";

export interface ISoundPickerProps {
  selectedSound: SoundName
  handleSoundChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
}

export const SoundPicker = (props: ISoundPickerProps) => {
  const { selectedSound, handleSoundChange } = props;

  return (
    <div className="sound-picker-container">
      <div className="sound-picker-select-container">
        <select className="sound-picker"
          value={selectedSound}
          onChange={handleSoundChange}
          >
          <option value="middle-c">Middle C (261.65Hz)</option>
          <option value="c2">Lower C (65.41 Hz)</option>
          <option value="baby-cry">Baby Cry</option>
          <option value="rock-and-knock-drum-loop">Rock & Knock</option>
          <option value="cut-beat">Cut Beat</option>
          <option value="cosmic-arp">Cosmic Arp</option>
          <option value="hard-base">Hard Base</option>
          <option value="scratch-sample">Scratch Sample</option>
        </select>
      </div>
      <div className="mic-label-icons-container">
        <MicIcon className="mic-icon button disabled" viewBox="0 0 36 36" />
        {/* <LabelsIcon className="button disabled" viewBox="0 0 36 36" /> */}
      </div>
    </div>
  );
}