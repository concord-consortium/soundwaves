import React, { ChangeEvent, useRef, useState } from "react";

import { SoundName } from "../../types";
import MicIcon from "../../assets/icons/mic_black_48dp.svg";
import LabelsIcon from "../../assets/icons/sell_black_48dp.svg";

import "./sound-picker.scss";

export interface ISoundPickerProps {
  selectedSound: SoundName
  handleSoundChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
  onRecordingCompleted?: (audioBuffer: AudioBuffer) => void;
}

export const SoundPicker = (props: ISoundPickerProps) => {
  const { selectedSound, handleSoundChange, onRecordingCompleted } = props;

  // While recording, 'chunks' of audio data are appended here
  let audioRecordingChunks: BlobPart[] | undefined = [];

  // defaults to match default of Middle C selection
  const [isPureToneSelected, setIsPureToneSelected] = useState<boolean>(true);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder>();
  const [isReadyToRecord, setIsReadyToRecord] = useState<Boolean>(false);
  const [isRecording, setIsRecording] = useState<Boolean>(false);

  const soundSelectRef = useRef<HTMLSelectElement>(null);
  const recordingTimerRef = useRef<number>();

  const accessRecordingStream = async () => {

    // Bail out if there's a browser security restriction
    if (!navigator.mediaDevices) {
      return;
    }

    const constraints: MediaStreamConstraints = { audio: true, video: false };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    const recorder = new MediaRecorder(stream);

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioRecordingChunks?.push(event.data);
      }
    };

    recorder.onstop = async (event) => {
      const blob = new Blob(audioRecordingChunks, { 'type' : recorder.mimeType });

      const audioURL = window.URL.createObjectURL(blob);
      const arrayBuffer = await (await fetch(audioURL)).arrayBuffer();
      const audioBuffer = await (new AudioContext()).decodeAudioData(arrayBuffer);
      onRecordingCompleted?.(audioBuffer);
      audioRecordingChunks = [];
    };

    setMediaRecorder(recorder);
    setIsReadyToRecord(true);
    window.alert("Click on the microphone to start/stop recording (up to: 5 seconds).");
  };

  const doFinishedRecording = () => {
    clearTimeout(recordingTimerRef.current);

    mediaRecorder?.stop();
    setIsRecording(false);
    const soundSelect = soundSelectRef.current;
    if (soundSelect) { soundSelect.disabled = false; }
  };

  const onTimedOutRecording = () => {
    doFinishedRecording();
  };

  const onMicIconClicked = () => {
    const maximumRecordingLengthInMilliseconds = 1000 * 5;

    // Ignore this event, if it happens when "(record my own) is NOT selected"
    if (!isReadyToRecord) { return; }

    if (mediaRecorder?.state === "inactive") {
      // Use a one-shot timer, to ensure recording does not exceed the maximum length
      recordingTimerRef.current = setTimeout(onTimedOutRecording, maximumRecordingLengthInMilliseconds);

      audioRecordingChunks = []; // Clear out any old audio data
      mediaRecorder?.start();
      setIsRecording(true);
      const soundSelect = soundSelectRef.current;
      if (soundSelect) { soundSelect.disabled = true; }
      return;
    } else {
      doFinishedRecording();
    }
  };

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

    const isUserRecordingSelected = soundName === "record-my-own";
    setIsReadyToRecord((!!mediaRecorder) && isUserRecordingSelected);
    if (isUserRecordingSelected && !mediaRecorder) {
      accessRecordingStream();
    }

    handleSoundChange?.(event);
  };


  return (
    <div className="sound-picker-container">
      <div className="sound-picker-select-container">
        <select className="sound-picker"
          ref={soundSelectRef}
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
        <MicIcon className={`sound-picker-icon button ${isReadyToRecord ? "" : "disabled"} ${isRecording ? "recording" : ""}`}
          onClick={onMicIconClicked} />
        <LabelsIcon className={`sound-picker-icon button ${isPureToneSelected ? "" : "disabled"}`} />
      </div>
    </div>
  );
};
