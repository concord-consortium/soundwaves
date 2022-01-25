import React, { ChangeEvent, useRef, useState } from "react";

import { SoundName } from "../../types";
import MicIcon from "../../assets/icons/mic_black_48dp.svg";

import "./sound-picker.scss";

export interface ISoundPickerProps {
  selectedSound: SoundName;
  setSelectedSound: (soundName: SoundName) => void;
  recordingAudioBuffer: AudioBuffer | undefined;
  setRecordingAudioBuffer: (audioBuffer: AudioBuffer) => void;
  playing: boolean;
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
    onMyRecordingChosen,
  } = props;

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [hasRecording, setHasRecording] = useState<boolean>(false);
  const recordingTimerRef = useRef<number>();
  const mediaRecorderRef = useRef<MediaRecorder>();

  const accessRecordingStream = async () => {

    // While recording, 'chunks' of audio data are appended here
    let audioRecordingChunks: BlobPart[] | undefined = [];

    // Bail out if there's a browser security restriction
    if (!navigator.mediaDevices) {
      return;
    }

    const constraints: MediaStreamConstraints = { audio: true, video: false };
    let stream = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch(err) {
      console.error("navigator.mediaDevices.getUserMedia() threw error:", err);
      return;
    }

    const recorder = new MediaRecorder(stream);

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioRecordingChunks?.push(event.data);
      }
    };

    recorder.onstop = async (event) => {
      // Use API to convert chunks to a blob, and then into a buffer
      // (plus its raw data), for use playback and visualization (and for
      // initial silence trimming, here).
      const blob = new Blob(audioRecordingChunks, { "type" : recorder.mimeType });
      const audioURL = window.URL.createObjectURL(blob);
      const arrayBuffer = await (await fetch(audioURL)).arrayBuffer();
      let aRecordingAudioBuffer = await (new AudioContext()).decodeAudioData(arrayBuffer);
      let channelData = aRecordingAudioBuffer.getChannelData(0);

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
          aRecordingAudioBuffer.sampleRate * 0.2; // 200 milliseconds of samples

        const adjustedSoundIndex = Math.max(0, (firstSoundIndex - extraSamplesOffset));
        channelData = channelData.slice(firstSoundIndex);

        aRecordingAudioBuffer = new AudioBuffer({
          length: aRecordingAudioBuffer.length - adjustedSoundIndex,
          sampleRate: aRecordingAudioBuffer.sampleRate
        });
        setRecordingAudioBuffer(aRecordingAudioBuffer);

        aRecordingAudioBuffer.copyToChannel(channelData, 0);
      }

      // When a recording is completed, we choose it automatically (PT #180792001).
      onMyRecordingChosen(aRecordingAudioBuffer);

      audioRecordingChunks = [];
    };

    mediaRecorderRef.current = recorder;
  };


  const doFinishedRecording = () => {
    clearTimeout(recordingTimerRef.current);

    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    setHasRecording(true);
    setSelectedSound("record-my-own");
  };


  const onTimedOutRecording = () => {
    doFinishedRecording();
  };


  const onMicIconClicked = async () => {
    const maximumRecordingLengthInMilliseconds = 1000 * 5;

    if (isRecording) {
      doFinishedRecording();
      return;
    }

    const isRecordingConfirmed = window.confirm("Press OK to begin recording for 5 seconds.");
    if (!isRecordingConfirmed) { return; }

    setIsRecording(true);
    await accessRecordingStream();
    mediaRecorderRef.current?.start();

    // Use a one-shot timer, to ensure recording does not exceed the maximum length
    recordingTimerRef.current =
      setTimeout(onTimedOutRecording, maximumRecordingLengthInMilliseconds);
  };


  const onSoundPickerChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const soundName = event.currentTarget.value as SoundName;
    const isUserRecordingSelected = (soundName === "record-my-own");
    const isNoSoundSelected = (soundName === "pick-sound");
    const hasMediaRecorder = !!(mediaRecorderRef.current);

    if (isNoSoundSelected) {
      setSelectedSound(soundName);
      return;
    }

    if (isUserRecordingSelected && !hasMediaRecorder && recordingAudioBuffer) {
      accessRecordingStream();
      onMyRecordingChosen(recordingAudioBuffer);
    }
    setSelectedSound(soundName);
  };


  return (
    <div className="sound-picker-container">

      <div className="icons-container">
        <button disabled={playing} onClick={onMicIconClicked}>
          <div>
            <MicIcon className={
              `icon button ${playing ? "disabled" : ""} ${isRecording ? "recording" : ""}`}
              />
          </div>
          <div>Record</div>
        </button>
      </div>

      <div className="sound-picker-mid-label">OR</div>

      <div className="sound-picker-select-container">
        <select className="sound-picker"
          disabled={isRecording}
          value={selectedSound}
          onChange={onSoundPickerChange}
        >
          <option value="pick-sound">Pick Sound</option>
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
    </div>
  );
};
