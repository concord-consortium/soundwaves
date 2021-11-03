import React, { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import Slider from "rc-slider";

import { SoundName } from "../types";
import { SoundWave } from "./sound-wave";
import { CarrierWave, carrierWaves } from "./carrier-wave";
import { AppHeader } from "./application-header/application-header";
import { SoundPicker } from "./sound-picker/sound-picker";
import { useAutoWidth } from "../hooks/use-auto-width";

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
import PlusIcon from "../assets/icons/add_black_48dp.svg";
import MinusIcon from "../assets/icons/remove_black_48dp.svg";


const sounds: Record<SoundName, string> = {
  "middle-c": MiddleCSound,
  "c2": C2Sound,
  "baby-cry": BabyCrySound,
  "rock-and-knock-drum-loop": RockNKnockDrumLoopSound,
  "cut-beat": CutBeatSound,
  "cosmic-arp": CosmicArpSound,
  "hard-base": HardBaseSound,
  "scratch-sample": ScratchSampleSound
};

const GRAPH_MARGIN = 20; // px;
const ZOOM_BUTTONS_WIDTH = 130; // px, it should match width of zoom-buttons-container defined in CSS file

export const App = () => {
  const [selectedSound, setSelectedSound] = useState<SoundName>("middle-c");
  const [playing, setPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(16);
  const [carrierZoom, setCarrierZoom] = useState<number>(16);
  const [playbackProgress, setPlaybackProgress] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [graphWidth, setGraphWidth] = useState<number>(100);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer>();
  const [carrierWaveSelection, setCarrierWaveSelection] = useState<string>("Choose . . .");
  const [carrierWavelength, setCarrierWavelength] = useState<string>("");
  const [carrierFrequency, setCarrierFrequency] = useState<number>(0);
  const [timesHigherThanHuman, setTimesHigherThanHuman] = useState<string>("");
  const [modulation, setModulation] = useState<string>("");
  const [carrierBuffer, setCarrierBuffer] = useState<AudioBuffer>();

  const audioContext = useRef<AudioContext>();
  const carrierContext = useRef<OfflineAudioContext>();
  const audioSource = useRef<AudioBufferSourceNode>();
  const gainNode = useRef<GainNode>();
  const playingRef = useRef<boolean>();
  playingRef.current = playing;

  useAutoWidth({
    container: document.body,
    onWidthChange: useCallback((newWidth) => setGraphWidth(newWidth - 2 * GRAPH_MARGIN), [])
  });

  const setupAudioContext = async (soundName: SoundName) => {
    if (audioSource.current && audioContext.current) {
      audioSource.current.stop();
      await audioContext.current.close();
      setPlaying(false);
    }

    const response = await window.fetch(sounds[soundName]);
    const soundArrayBuffer = await response.arrayBuffer();
    audioContext.current = new AudioContext();
    gainNode.current = audioContext.current.createGain();

    setAudioBuffer(await audioContext.current.decodeAudioData(soundArrayBuffer));
    setPlaybackProgress(0);
  };

  const setupCarrierContext = async () => {
console.log('carrierFrequency', carrierFrequency);
  };

  useEffect(() => {
    // AudioContext is apparently unavailable in the node / jest environment.
    // So we bail out early, to prevent render test failure.
    if (!window.AudioContext) { return; }

    setupAudioContext(selectedSound);
    setupCarrierContext();
  }, [selectedSound, carrierFrequency]);

  useEffect(() => {
    if (gainNode.current) {
      gainNode.current.gain.value = volume;
    }
  }, [volume]);

  const handleSoundChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedSound(event.currentTarget.value as SoundName);
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

    if (audioBuffer) {
      renderCarrier(audioBuffer);
    }
  };

  // Attempt 'D'
  const renderCarrier = async (mainBuffer: AudioBuffer) => {
    console.log('length', mainBuffer.length);
    console.log('duration', mainBuffer.duration);
    console.log('sampleRate', mainBuffer.sampleRate);

    const numChannels = 1;
    const carrierFrequency = 262; // TODO: set based on user selection
    const carrierSampleRate = 480000; // mainBuffer.sampleRate;
    const carrierBufferLength = 480000; // Sixty seconds // mainBuffer.length;

    // Create a context for the carrier wave that matches the one used for main sound
    carrierContext.current = new OfflineAudioContext(
      numChannels,
      carrierBufferLength,
      carrierSampleRate);

    const carrierOscillator = carrierContext.current.createOscillator();
    carrierOscillator.type = "sine";
    carrierOscillator.frequency.setValueAtTime(
      carrierFrequency, carrierContext.current.currentTime);
    carrierOscillator.connect(carrierContext.current.destination);
    carrierOscillator.start();
    const carrierBuffer = await carrierContext.current.startRendering();
    setCarrierBuffer(carrierBuffer);

    // const carrierBuffer = carrierContext.current.createBuffer(
    //   numChannels, carrierBufferLength, carrierSampleRate);
    // setCarrierBuffer(carrierBuffer);

    // const myArrayBuffer =
    //   carrierContext.current.createBuffer(numChannels, carrierBufferLength, carrierSampleRate);
    // const data = myArrayBuffer.getChannelData(0);
    // const frameCount = carrierContext.current.sampleRate;
    // for (var i = 0; i < frameCount; i++) {
    //   // Math.random() is in [0; 1.0]
    //    // audio needs to be in [-1.0; 1.0]
    //   // data[i] = Math.random() * 2 - 1;
    //   data[i] = Math.sin(i);
    // }
    // const source = carrierContext.current.createBufferSource();
    // source.buffer = myArrayBuffer;
    // setCarrierBuffer(myArrayBuffer);
    // source.start();
  };

  // // Attempt 'C'
  // const renderCarrier = (audioBuffer: AudioBuffer): void => {
  //   console.log('length', audioBuffer.length);
  //   console.log('duration', audioBuffer.duration);

  //   const numChannels = 1;
  //   const sampleRate = 441000;
  //   const length = sampleRate * 2; // 2 seconds

  //   carrierContext.current = new OfflineAudioContext(numChannels, length, sampleRate);

  //   // const carrierOscillator = carrierContext.current.createOscillator();
  //   // carrierOscillator.type = "sine";
  //   // carrierOscillator.frequency.setValueAtTime(440, carrierContext.current.currentTime);
  //   // const carrierBuffer = carrierContext.current.createBuffer(numChannels, length, sampleRate)
  //   // setCarrierBuffer(carrierBuffer);
  //   // carrierOscillator.start();

  //   const myArrayBuffer =
  //     carrierContext.current.createBuffer(numChannels, length, sampleRate);
  //   const data = myArrayBuffer.getChannelData(0);
  //   const frameCount = carrierContext.current.sampleRate;
  //   for (var i = 0; i < frameCount; i++) {
  //     // Math.random() is in [0; 1.0]
  //      // audio needs to be in [-1.0; 1.0]
  //     // data[i] = Math.random() * 2 - 1;
  //     data[i] = Math.sin(i);
  //   }
  //   const source = carrierContext.current.createBufferSource();
  //   source.buffer = myArrayBuffer;
  //   setCarrierBuffer(myArrayBuffer);
  //   source.start();

  // };

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
    0.25: { style: null, label: "1/4"},
    0.5: { style: null, label: "1/2"},
    1: {style: null, label: "1"},
    2: {style: null, label: "2"},
  };

  const handleCarrierChange = ( (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setCarrierWaveSelection(value);

    const newModulationValue = carrierWaves[value].modulation;
    setModulation(newModulationValue ? newModulationValue : "");

    const frequency = carrierWaves[value].frequency;
    setCarrierFrequency(frequency);

    setTimesHigherThanHuman( (frequency !== 0)
      ? `${(frequency / 2e4).toString()}x` // Using 20kHz as upper range of human hearing
      : "");

    setCarrierWavelength( (frequency !== 0)
      ? `${Math.floor(3e8 / frequency)} (meters)`
      : "");

    setupCarrierContext();
  });

  return (
    <div className="app">
      <AppHeader/>
      <SoundPicker selectedSound={selectedSound} handleSoundChange={handleSoundChange} />

      <div className="main-controls-and-waves-container">
      <div className="main-controls">
        <div className="playback">
          <div className="play-pause button" onClick={handlePlay}>{ playing ? <PauseIcon /> : <PlayIcon /> }</div>
          {/* If changing the color of the VolumeIcon
            then may also need to change the $controls color, for consistency */}
          <VolumeIcon style={{fill: "#3377BD"}} />
          <Slider
            className="volume-slider"
            min={0} max={2} step={0.01}
            value={volume}
            onChange={handleVolumeChange}
          />
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
                max={2}
                step={null}
                marks={speedMarks}
                disabled={playing}
                onChange={handleSpeedChange}
                />
            </div>
          </div>
        </div>
      </div>
      <div className="sound-wave-container">
        <SoundWave
          width={graphWidth}
          height={180}
          audioBuffer={audioBuffer}
          volume={volume}
          playbackProgress={playbackProgress}
          zoom={zoom}
          zoomedInView={true}
          shouldDrawProgressMarker={true}
        />
        <div className="zoomed-out-graph-container">
          <SoundWave
            width={graphWidth - ZOOM_BUTTONS_WIDTH}
            height={40}
            audioBuffer={audioBuffer}
            volume={volume}
            playbackProgress={playbackProgress}
            zoom={zoom}
            zoomedInView={false}
            shouldDrawProgressMarker={false}
            interactive={!playing}
            onProgressUpdate={handleProgressUpdate}
          />
          <div className="zoom-buttons-container">
            <div className="zoom-button" onClick={handleZoomOut}><MinusIcon /></div>
            <div className="zoom-button" onClick={handleZoomIn}><PlusIcon /></div>
          </div>
        </div>
      </div>
      </div>
      <CarrierWave
        carrierWaveSelection={carrierWaveSelection}
        wavelength={carrierWavelength}
        timesHigherThanHuman={timesHigherThanHuman}
        modulation={modulation}
        handleCarrierChange={handleCarrierChange}
      />
      <div className="carrier-wave-graph-container">
        { (carrierFrequency !== 0) &&
        <SoundWave
          width={graphWidth}
          height={90}
          audioBuffer={carrierBuffer}
          volume={volume}
          playbackProgress={playbackProgress}
          zoom={carrierZoom}
          zoomedInView={true}
          shouldDrawProgressMarker={false}
          interactive={!playing}
          onProgressUpdate={handleProgressUpdate}
          debug={true}
        />}
      </div>
    </div>
  );
};
