import React, { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import Slider from "rc-slider";

import { SIDE_MARGIN_PLUS_BORDER, SoundName, SOUND_WAVE_GRAPH_HEIGHT, ZOOMED_OUT_GRAPH_HEIGHT, ZOOM_BUTTONS_WIDTH, SOUND_SAMPLE_RATE } from "../types";
import { SoundWave } from "./sound-wave";
import { CarrierWave } from "./carrier-wave/carrier-wave";
import { AppHeader } from "./application-header/application-header";
import { SoundPicker, isPureTone, pureToneFrequencyFromSoundName } from "./sound-picker/sound-picker";
import { useAutoWidth } from "../hooks/use-auto-width";
import { ZoomButtons } from "./zoom-buttons/zoom-buttons";

import "./app.scss";
import "rc-slider/assets/index.css";

import MiddleCSound from "../assets/sounds/middle-c.mp3";
import C2Sound from "../assets/sounds/c2.mp3";
import BabyCrySound from "../assets/sounds/baby-cry.mp3";
import RockNKnockDrumLoopSound from "../assets/sounds/Rock-N-Knock-Drum-Loop.mp3";
import CutBeatSound from "../assets/sounds/cut-beat-100.mp3";
import CosmicArpSound from "../assets/sounds/cosmic-arp.mp3";
import HardBaseSound from "../assets/sounds/hard-bass-vox.mp3";
import ScratchSampleSound from "../assets/sounds/scratch-sample.mp3";

import PlayIcon from "../assets/icons/play_circle_outline_black_48dp.svg";
import PauseIcon from "../assets/icons/pause_circle_outline_black_48dp.svg";
import VolumeIcon from "../assets/icons/volume_up_black_48dp.svg";

const sounds: Record<SoundName, string> = {
  "middle-c": MiddleCSound,
  "c2": C2Sound,
  "baby-cry": BabyCrySound,
  "rock-and-knock-drum-loop": RockNKnockDrumLoopSound,
  "cut-beat": CutBeatSound,
  "cosmic-arp": CosmicArpSound,
  "hard-base": HardBaseSound,
  "scratch-sample": ScratchSampleSound,
  "record-my-own": "record-my-own",
};

export const App = () => {
  const [selectedSound, setSelectedSound] = useState<SoundName>("middle-c");
  const [drawWaveLabels, setDrawWaveLabels] = useState<boolean>(false);
  const [playing, setPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(16);
  const [playbackProgress, setPlaybackProgress] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [graphWidth, setGraphWidth] = useState<number>(100);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer>();

  const audioContext = useRef<AudioContext>();
  const audioSource = useRef<AudioBufferSourceNode>();
  const gainNode = useRef<GainNode>();
  const playingRef = useRef<boolean>();
  playingRef.current = playing;

  useAutoWidth({
    container: document.body,
    onWidthChange: useCallback(
      (newWidth) => { setGraphWidth(newWidth - (2 * SIDE_MARGIN_PLUS_BORDER)); }
      , [])
  });

  const setupAudioContextFromRecording = (recordingBuffer: AudioBuffer) => {
    setAudioBuffer(recordingBuffer);
    setPlaybackProgress(0);
  };

  const setupAudioContext = async (soundName: SoundName) => {
    if (audioSource.current && audioContext.current) {
      audioSource.current.stop();
      await audioContext.current.close();
      setPlaying(false);
    }

    // When a user chooses to record their own sound, we don't start recording
    // immediately. But we do want to clear out the old sound data here, and to
    // update the playback progress indicator, so that it is clear that there
    // is nothing recorded (yet).
    if (soundName === "record-my-own") {
      const emptyBuffer = new AudioBuffer({
        length: 1,
        sampleRate: SOUND_SAMPLE_RATE
      });
      audioContext.current = new AudioContext();
      gainNode.current = audioContext.current.createGain();
      setAudioBuffer(emptyBuffer);
      setPlaybackProgress(0);
      return;
    }

    // Handle selection of 'canned' sounds...
    const response = await window.fetch(sounds[soundName]);
    const soundArrayBuffer = await response.arrayBuffer();
    audioContext.current = new AudioContext();
    gainNode.current = audioContext.current.createGain();

    setAudioBuffer(await audioContext.current.decodeAudioData(soundArrayBuffer));
    setPlaybackProgress(0);
  };

  useEffect(() => {
    // AudioContext is apparently unavailable in the node / jest environment.
    // So we bail out early, to prevent render test failure.
    if (!window.AudioContext) { return; }

    setupAudioContext(selectedSound);
  }, [selectedSound]);

  useEffect(() => {
    if (gainNode.current) {
      gainNode.current.gain.value = volume;
    }
  }, [volume]);

  const handleSoundChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const soundName = event.currentTarget.value as SoundName;
    setSelectedSound(soundName);
  };

  const handleDrawWaveLabelChange = () => {
    // -- commented out, but deliberately not removed, per: PT #180792001
    // setDrawWaveLabels(!drawWaveLabels);
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
  };

  const handlePlay = () => {
    setPlaying(!playing);
    // It needs to be updated immediately so #measureProgress works correctly.
    playingRef.current = !playing;

    // Audio playback needs to be initiated by user action like tap or click. It can't be done asynchronously
    // in `useEffect` callback. This was causing issues on iOS Safari.
    if (audioContext.current?.state === "suspended") {
      audioContext.current.resume();
    }
    if (playingRef.current && audioContext.current && gainNode.current && audioBuffer) {
      // > An AudioBufferSourceNode can only be played once; after each call to start(), you have to create a new node
      // > if you want to play the same sound again. Fortunately, these nodes are very inexpensive to create, and the
      // > actual AudioBuffers can be reused for multiple plays of the sound.
      // Source: https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode
      audioSource.current = audioContext.current.createBufferSource();
      audioSource.current.buffer = audioBuffer;
      audioSource.current.playbackRate.value = playbackRate;
      audioSource.current.onended = () => {
        measureProgress(); // one last call to measure progress to ensure that the current progress is saved precisely.
        setPlaying(false);
      };

      audioSource.current
        .connect(gainNode.current)
        .connect(audioContext.current.destination);

      // Offset lets us continue previously paused playback. When playbackProgress >= 1, we'll restart the playback.
      const offset = playbackProgress >= 1 ? 0 : audioBuffer.duration * playbackProgress;
      const startTime = audioContext.current.currentTime;
      audioSource.current?.start(0, offset);

      const measureProgress = () => {
        if (playingRef.current && audioContext.current && audioBuffer) {
          setPlaybackProgress(playbackRate * (audioContext.current.currentTime - startTime + offset) / audioBuffer.duration);
          requestAnimationFrame(measureProgress);
        }
      };
      measureProgress();
    } else {
      audioSource.current?.stop();
    }
  };

  const handleZoomIn = () => {
    setZoom(Math.min(2048, zoom * 2));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(2, zoom * 0.5));
  };

  const setPlaybackSpeedTo = (speed: number) => {
    const boundedSpeed = Math.max((1 / 128), Math.min(8, speed));
    setPlaybackRate(boundedSpeed);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeedTo(speed);
  };

  const handleProgressUpdate = (newProgress: number) =>
    setPlaybackProgress(newProgress);

  const speedMarks = {
    0.25: { style: null, label: "1/4" },
    0.5: { style: null, label: "1/2" },
    1: { style: null, label: "1" },
    2: { style: null, label: "2" },
    4: { style: null, label: "4" },
  };

  return (
    <div className="app">
      <AppHeader />
      <SoundPicker
        selectedSound={selectedSound}
        drawWaveLabels={drawWaveLabels}
        playing={playing}
        handleSoundChange={handleSoundChange}
        handleDrawWaveLabelChange={handleDrawWaveLabelChange}
        onRecordingCompleted={setupAudioContextFromRecording}
      />
      <div className="main-controls-and-waves-container">
        <div className="playback-and-volume-controls">
          <div className="play-pause button" onClick={handlePlay}>
            { playing ? <PauseIcon /> : <PlayIcon /> }
          </div>
          <div className="volume-controls">
            <div>
              <VolumeIcon className="volume-icon" />
            </div>
            <div className="volume-slider-container">
              <Slider
                className="volume-slider"
                // Keep min volume > 0 so it's always possible to calculate amplitude and wave length markers
                min={0.01} max={2} step={0.01}
                value={volume}
                onChange={handleVolumeChange}
              />
            </div>
          </div>
        </div>
        <div className="speed-controls">
          <div className={`speed-label${(playing) ? " disabled" : ""}`}>
            Speed
          </div>
          <div>
            <Slider
              className={playing ? "speed-slider disabled" : "speed-slider"}
              defaultValue={1}
              startPoint={1}
              value={playbackRate}
              min={0.25}
              max={4}
              step={null}
              marks={speedMarks}
              disabled={playing}
              onChange={handleSpeedChange}
            />
          </div>
        </div>
        <div className="sound-wave-container">
          <SoundWave
            width={graphWidth}
            height={SOUND_WAVE_GRAPH_HEIGHT}
            audioBuffer={audioBuffer}
            volume={volume}
            playbackProgress={playbackProgress}
            zoom={zoom}
            zoomedInView={true}
            shouldDrawProgressMarker={true}
            shouldDrawWaveCaptions={!playing && isPureTone(selectedSound) && drawWaveLabels}
            pureToneFrequency={pureToneFrequencyFromSoundName(selectedSound)}
          />
          <div className="zoomed-out-graph-container chosen-sound">
            <SoundWave
              width={graphWidth - ZOOM_BUTTONS_WIDTH}
              height={ZOOMED_OUT_GRAPH_HEIGHT}
              audioBuffer={audioBuffer}
              volume={volume}
              playbackProgress={playbackProgress}
              zoom={zoom}
              zoomedInView={false}
              interactive={!playing}
              onProgressUpdate={handleProgressUpdate}
            />
            <ZoomButtons handleZoomIn={handleZoomIn} handleZoomOut={handleZoomOut} />
          </div>
        </div>
      </div>
      <CarrierWave
        audioBuffer={audioBuffer}
        playbackProgress={playbackProgress}
        graphWidth={graphWidth}
        volume={volume}
        interactive={!playing}
        onProgressUpdate={handleProgressUpdate}
        shouldDrawWaveCaptions={isPureTone(selectedSound) && drawWaveLabels}
      />
    </div>
  );
};
