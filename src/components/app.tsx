import React, { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { SoundWave } from "./sound-wave";
import MiddleCSound from "../assets/middle-c.mp3";
import C2Sound from "../assets/c2.mp3";
import BabyCrySound from "../assets/baby-cry.mp3";
import BSCSLogo from "../assets/bscs-logo.svg";
import PlayIcon from "../assets/icons/play_circle_outline_black_48dp.svg";
import PauseIcon from "../assets/icons/pause_circle_outline_black_48dp.svg";
import VolumeIcon from "../assets/icons/volume_up_black_48dp.svg";
import MicIcon from "../assets/icons/mic_black_48dp.svg";
import LabelsIcon from "../assets/icons/sell_black_48dp.svg";
import PlusIcon from "../assets/icons/add_black_48dp.svg";
import MinusIcon from "../assets/icons/remove_black_48dp.svg";
import { useAutoWidth } from "../hooks/use-auto-width";
import Slider from "rc-slider";
import "./app.scss";
import "rc-slider/assets/index.css";

type SoundName = "middle-c" | "c2" | "baby-cry";

const sounds: Record<SoundName, string> = {
  "middle-c": MiddleCSound,
  "c2": C2Sound,
  "baby-cry": BabyCrySound
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
        audioSource.current?.start(0, 0);

      const startTime = audioContext.current.currentTime;

      const measureProgress = () => {
        if (playingRef.current && audioContext.current && audioBuffer) {
          setPlaybackProgress(playbackRate * (audioContext.current.currentTime - startTime) / audioBuffer.duration);
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
      <div className="header"><BSCSLogo /> Sounds are waves</div>
      <div>
        <select className="sound-picker" value={selectedSound} onChange={handleSoundChange}>
          <option value="middle-c">Middle C (261.65Hz)</option>
          <option value="c2">A (65.41 Hz)</option>
          <option value="baby-cry">Baby Cry</option>
        </select>
      </div>
      <div className="main-controls">
        <div className="playback">
          <div className="play-pause button" onClick={handlePlay}>{ playing ? <PauseIcon /> : <PlayIcon /> }</div>
          <VolumeIcon />
          <Slider
            className="volume-slider"
            min={0} max={2} step={0.01}
            value={volume}
            onChange={handleVolumeChange}
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
