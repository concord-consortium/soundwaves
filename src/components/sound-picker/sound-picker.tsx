import React, { ChangeEvent, useRef, useState } from "react";

import { SoundName } from "../../types";
import MicIcon from "../../assets/icons/mic_black_48dp.svg";
  // -- commented out, but deliberately not removed, per: PT #180792001
  // import LabelsIcon from "../../assets/icons/sell_black_48dp.svg";

import "./sound-picker.scss";

export interface ISoundPickerProps {
  selectedSound: SoundName;
  setSelectedSound: (soundName: SoundName) => void;
  recordingAudioBuffer: AudioBuffer;
  setRecordingAudioBuffer: (audioBuffer: AudioBuffer) => void;
  drawWaveLabels: boolean;
  playing: boolean;
  handleSoundChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
  onMyRecordingChosen: (audioBuffer: AudioBuffer) => void;
  handleDrawWaveLabelChange?: () => void;
}

export const isPureTone = (soundName: string) => {
  switch (soundName) {
    case "middle-c": return true;
    case "c2": return true;
    default: return false;
  }
};

export const pureToneFrequencyFromSoundName = (soundName: string) => {
  switch (soundName) {
    case "middle-c": return 261.65;
    case "c2": return 65.41;
    default: return 0;
  }
};

export const SoundPicker = (props: ISoundPickerProps) => {
  const {
    selectedSound,
    setSelectedSound,
    recordingAudioBuffer,
    setRecordingAudioBuffer,
    playing,
    handleSoundChange,
    onMyRecordingChosen,
    // -- commented out, but deliberately not removed, per: PT #180792001
    // drawWaveLabels,
    handleDrawWaveLabelChange
  } = props;

  // Set: isPureToneSelected, isReadyToRecord defaults, based on "middle-c" default selection
  const [isPureToneSelected, setIsPureToneSelected] = useState<boolean>(true);
  const [isReadyToRecord, setIsReadyToRecord] = useState<boolean>(true);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [hasRecording, setHasRecording] = useState<boolean>(false);

  const recordingTimerRef = useRef<number>();
  const mediaRecorderRef = useRef<MediaRecorder>();
  // // Dummy values provided for audioBuffer; will be over-written when an actually used buffer is assigned.
  // const audioBuffer2 = useRef<AudioBuffer>(new AudioBuffer({length: 3000, sampleRate: 3000}));

  const getAudioBuffer = () => {
      // Use API to convert chunks to a blob, and then into a buffer
      // (plus its raw data), for use playback and visualization (and for
      // initial silence trimming, here).
      // const blob = new Blob(audioRecordingChunks, { "type" : recorder.mimeType });
      // const audioURL = window.URL.createObjectURL(blob);
      // const arrayBuffer = await (await fetch(audioURL)).arrayBuffer();
      // let audioBuffer = await (new AudioContext()).decodeAudioData(arrayBuffer);
  };

  const accessRecordingStream = async () => {
console.log("accessRecordingStream", {mediaRecorderRef}, mediaRecorderRef.current);

    // While recording, 'chunks' of audio data are appended here
    let audioRecordingChunks: BlobPart[] | undefined = [];

    // Bail out if there's a browser security restriction
    if (!navigator.mediaDevices) {
console.log("accessRecordingStream; NO mediaDevices", {navigator});
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
console.log("onstop");
      // Use API to convert chunks to a blob, and then into a buffer
      // (plus its raw data), for use playback and visualization (and for
      // initial silence trimming, here).
      const blob = new Blob(audioRecordingChunks, { "type" : recorder.mimeType });
      const audioURL = window.URL.createObjectURL(blob);
      const arrayBuffer = await (await fetch(audioURL)).arrayBuffer();
      // let audioBuffer = await (new AudioContext()).decodeAudioData(arrayBuffer);
      // audioBuffer2.current = await (new AudioContext()).decodeAudioData(arrayBuffer);
      let recordingAudioBuffer = await (new AudioContext()).decodeAudioData(arrayBuffer);
      // setRecordingAudioBuffer(recordingAudioBuffer);

      // let channelData = audioBuffer.getChannelData(0);
      // let channelData = audioBuffer2.current.getChannelData(0);
      let channelData = recordingAudioBuffer.getChannelData(0);

      // In testing, the API seems to be adding some 'dead time' at the
      // beginning of the recording. The code below attempts to detect
      // that initial 'silence', and minimize it in the clip.

      // Value (empirically determined), below which we assume there's only
      // silence/background noise.
      const noiseFloorValue = 0.01;

      // Get the index of the first sound sample which has an amplitude above
      // background noise.
      const firstSoundIndex = channelData.findIndex( (soundAmplitude) => {
        const absValue = Math.abs(soundAmplitude);
        return (absValue > noiseFloorValue);
      });

      // If initial 'silence' found, then create a new buffer, without the
      // initial silence, except for the 0.2s of 'silence' just prior to the
      // sounds of interest.
      if (firstSoundIndex !== -1) {
        const extraSamplesOffset =
          // audioBuffer.sampleRate * 0.2; // 200 milliseconds of samples
          // (audioBuffer2 && audioBuffer2.current && audioBuffer2.current.sampleRate)
          //   ? (audioBuffer2.current.sampleRate * 0.2) // 200 milliseconds of samples
          //   : 0;
          recordingAudioBuffer.sampleRate * 0.2; // 200 milliseconds of samples

        const adjustedSoundIndex = Math.max(0, (firstSoundIndex - extraSamplesOffset));
        channelData = channelData.slice(firstSoundIndex);

        // audioBuffer = new AudioBuffer({
        //   length: audioBuffer.length - adjustedSoundIndex,
        //   sampleRate: audioBuffer.sampleRate
        // });
        // audioBuffer2.current = new AudioBuffer({
        //   length: audioBuffer2.current.length - adjustedSoundIndex,
        //   sampleRate: audioBuffer2.current.sampleRate
        // });
        recordingAudioBuffer = new AudioBuffer({
          length: recordingAudioBuffer.length - adjustedSoundIndex,
          sampleRate: recordingAudioBuffer.sampleRate
        });
        setRecordingAudioBuffer(recordingAudioBuffer);

        // audioBuffer.copyToChannel(channelData, 0);
        // audioBuffer2.current.copyToChannel(channelData, 0);
        recordingAudioBuffer.copyToChannel(channelData, 0);
      }

      // When a recording is completed, we choose it automatically (PT #180792001).
      // onMyRecordingChosen(audioBuffer);
      // onMyRecordingChosen(audioBuffer2.current);
      onMyRecordingChosen(recordingAudioBuffer);

      audioRecordingChunks = [];
    };

    mediaRecorderRef.current = recorder;
    setIsReadyToRecord(true);
console.log("is ready to record...");
  };

  const doFinishedRecording = () => {
    clearTimeout(recordingTimerRef.current);
console.log("doFinishedRecording", {mediaRecorderRef}, mediaRecorderRef.current);

    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    setHasRecording(true);
    setSelectedSound("record-my-own");
  };

  const onTimedOutRecording = () => {
console.log("onTimedOutRecordingcording");
    doFinishedRecording();
  };

  const onMicIconClicked = async () => {
console.log("onMicIconClicked", {mediaRecorderRef}, mediaRecorderRef.current);
    const maximumRecordingLengthInMilliseconds = 1000 * 5;

    if (isRecording) {
      doFinishedRecording();
      return;
    }

    const isRecordingConfirmed = window.confirm("Press OK to begin recording for 5 seconds.");
    if (!isRecordingConfirmed) { return; }

    setIsRecording(true);
console.log(mediaRecorderRef.current);
    await accessRecordingStream();
    mediaRecorderRef.current?.start();

    // Use a one-shot timer, to ensure recording does not exceed the maximum length
    recordingTimerRef.current =
      setTimeout(onTimedOutRecording, maximumRecordingLengthInMilliseconds);

    // if (mediaRecorderRef.current?.state === "inactive") {
    //   // Use a one-shot timer, to ensure recording does not exceed the maximum length
    //   recordingTimerRef.current = setTimeout(onTimedOutRecording, maximumRecordingLengthInMilliseconds);
    //   mediaRecorderRef.current?.start();
    //   setIsRecording(true);
    // } else {
    //   doFinishedRecording();
    // }
  };

  // -- commented out, but deliberately not removed, per: PT #180792001
  // const onLabelIconClicked = () => {
  //   // Don't allow state change when non-pure tone sound selected
  //   if (!isPureToneSelected) { return; }
  //   handleDrawWaveLabelChange?.();
  // };

  const onSoundPickerChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const soundName = event.currentTarget.value as SoundName;
    setIsPureToneSelected(isPureTone(soundName));
    const isUserRecordingSelected = (soundName === "record-my-own");
    const hasMediaRecorder = !!(mediaRecorderRef.current);
console.log("onSoundPickerChange", {mediaRecorderRef}, {hasMediaRecorder});
// setIsReadyToRecord(hasMediaRecorder && isUserRecordingSelected);
    if (isUserRecordingSelected && !hasMediaRecorder) {
        accessRecordingStream();
        // onMyRecordingChosen(audioBuffer);
        // onMyRecordingChosen(audioBuffer2.current);
        onMyRecordingChosen(recordingAudioBuffer);
      }

    handleSoundChange?.(event);
  };

  return (
    <div className="sound-picker-container">
      <div className="sound-picker-select-container">
        <select className="sound-picker"
          disabled={isRecording}
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
          <option value="record-my-own" disabled={!hasRecording}>(My Recording)</option>
        </select>
      </div>
      <div className="icons-container">
        <MicIcon className={
          `icon button ${playing ? "disabled" : ""} ${isRecording ? "recording" : ""}`}
          onClick={onMicIconClicked} />
        {/* // -- commented out, but deliberately not removed, per: PT #180792001 */}
        {/* <LabelsIcon className={
            `icon button ${isPureToneSelected ? "" : "disabled"} ${drawWaveLabels ? "labelling" : ""}`
          }
          onClick={onLabelIconClicked} /> */}
      </div>
    </div>
  );
};
