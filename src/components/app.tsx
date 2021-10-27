import React, { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { SoundWave } from "./sound-wave";
import WavesLogo from "../assets/wavesLogo.png"
import { useAutoWidth } from "../hooks/use-auto-width";
import Slider from "rc-slider";

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
import MicIcon from "../assets/icons/mic_black_48dp.svg";
import LabelsIcon from "../assets/icons/sell_black_48dp.svg";
import PlusIcon from "../assets/icons/add_black_48dp.svg";
import MinusIcon from "../assets/icons/remove_black_48dp.svg";


type SoundName =
  "middle-c"
  | "c2"
  | "baby-cry"
  | "rock-and-knock-drum-loop"
  | "cut-beat"
  | "cosmic-arp"
  | "hard-base"
  | "scratch-sample";

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
    onWidthChange: useCallback((newWidth) => setGraphWidth(newWidth - 2 * GRAPH_MARGIN), [])
  });

  const setupAudioContext = async (soundName: SoundName) => {
    if (audioSource.current && audioContext.current) {
      audioSource.current.stop();
      await audioContext.current.close();
      setPlaying(false);
    }
    if (!window.fetch) {
      // Not implemented in node / jest env. Need to add mock if we ever want to test that.
    }
    const response = await window.fetch(sounds[soundName]);
    const soundArrayBuffer = await response.arrayBuffer();
    audioContext.current = new AudioContext();
    gainNode.current = audioContext.current.createGain();

    setAudioBuffer(await audioContext.current.decodeAudioData(soundArrayBuffer));
    setPlaybackProgress(0);
  };

  useEffect(() => {
    setupAudioContext(selectedSound);
  }, [selectedSound]);

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
  };

  const handleZoomIn = () => {
    setZoom(Math.min(2048, zoom * 2));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(2, zoom * 0.5));
  };


  const handleFasterPlayback = () => {
    setPlaybackRate(Math.min(8, playbackRate * 2));
  };

  const handleSlowerPlayback = () => {
    setPlaybackRate(Math.max(1 / 128, playbackRate * 0.5));
  };

  const handleProgressUpdate = (newProgress: number) => setPlaybackProgress(newProgress);

  return (
    <div className="app">
      <div className="header">
        <img src={WavesLogo} alt="Waves Logo" />
        &nbsp;&nbsp;Sounds are waves
      </div>
      <div>
        <select className="sound-picker" value={selectedSound} onChange={handleSoundChange}>
          <option value="middle-c">Middle C (261.65Hz)</option>
          <option value="c2">A (65.41 Hz)</option>
          <option value="baby-cry">Baby Cry</option>
          <option value="rock-and-knock-drum-loop">Rock & Knock</option>
          <option value="cut-beat">Cut Beat</option>
          <option value="cosmic-arp">Cosmic Arp</option>
          <option value="hard-base">Hard Base</option>
          <option value="scratch-sample">Scratch Sample</option>
        </select>
      </div>
      <div className="main-controls">
        <div className="playback">
          <div className="play-pause button" onClick={handlePlay}>{ playing ? <PauseIcon /> : <PlayIcon /> }</div>
          {/* If changing the color of the VolumeIcon or Slider
            then may also need to change the $controls color, for consistency */}
          <VolumeIcon style={{fill: "#3377BD"}} />
          <Slider
            className="volume-slider"
            min={0} max={2} step={0.01}
            value={volume}
            onChange={handleVolumeChange}
            trackStyle={{backgroundColor: "#3377BD"}}
            railStyle={{backgroundColor: "#3377BD"}}
            handleStyle={{backgroundColor: "#3377BD"}}
          />
          <MicIcon className="button disabled" />
        </div>
        <LabelsIcon className="button disabled" />
      </div>
      <div className="sound-wave-container">
        <SoundWave
          width={graphWidth} height={200}
          audioBuffer={audioBuffer}
          volume={volume}
          playbackProgress={playbackProgress}
          zoom={zoom}
          zoomedInView={true}
        />
        <div className="zoomed-out-graph">
          <SoundWave
            width={graphWidth - ZOOM_BUTTONS_WIDTH} height={60}
            audioBuffer={audioBuffer}
            volume={volume}
            playbackProgress={playbackProgress}
            zoom={zoom}
            zoomedInView={false}
            interactive={!playing}
            onProgressUpdate={handleProgressUpdate}
          />
          <div className="zoom-buttons-container">
            <div className="zoom-button" onClick={handleZoomOut}><MinusIcon /></div>
            <div className="zoom-button" onClick={handleZoomIn}><PlusIcon /></div>
          </div>
        </div>
      </div>
      <div className="debug-controls">
        Playback Rate: { playbackRate >= 1 ? playbackRate : `1/${Math.round(1/playbackRate)}` }x
        <button onClick={handleFasterPlayback}>Speed up</button>
        <button onClick={handleSlowerPlayback}>Slow down</button>
      </div>
    </div>
  );
};
