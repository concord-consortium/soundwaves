import React, { ChangeEvent, useState } from "react";

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

  // defaults to match default of Middle C selection
  const [isPureToneSelected, setIsPureToneSelected] = useState<boolean>(true);

  const [isRecordMyOwnelected, setIsRecordMyOwnSelected] = useState<boolean>(false);

  const onSoundPickerChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const soundName = event.currentTarget.value as SoundName;
    switch (soundName) {
      case "middle-c":
        setIsPureToneSelected(true);
        break;
      case "c2":
        setIsPureToneSelected(true);
        break;
      default:
        setIsPureToneSelected(false);
    }
    setIsRecordMyOwnSelected(soundName === "record-my-own");

    handleSoundChange?.(event);
  };


  return (
    <div className="sound-picker-container">
      <div className="sound-picker-select-container">
        <select className="sound-picker"
          value={selectedSound}
          onChange={onSoundPickerChange}
          >
          <option value="middle-c">Middle C (261.65Hz)</option>
          <option value="c2">Lower C (65.41 Hz)</option>
          <option value="baby-cry">Baby Cry</option>
          <option value="rock-and-knock-drum-loop">Rock & Knock</option>
          <option value="cut-beat">Cut Beat</option>
          <option value="cosmic-arp">Cosmic Arp</option>
          <option value="hard-base">Hard Base</option>
          <option value="scratch-sample">Scratch Sample</option>
          <option value="record-my-own">(record my own . . .)</option>
        </select>
      </div>
      <div className="sound-picker-icons-container">
        <MicIcon className={`sound-picker-icon button ${isRecordMyOwnelected ? "" : "disabled"}`} />
        <LabelsIcon className={`sound-picker-icon button ${isPureToneSelected ? "" : "disabled"}`} />
      </div>
    </div>
  );
};
