import React, { useCallback, useEffect, useRef, useState } from "react";
import Slider from "rc-slider";

import { SIDE_MARGIN_PLUS_BORDER, SoundName, ZOOMED_OUT_GRAPH_HEIGHT } from "../types";
import { SoundWave } from "./sound-wave";
import { CarrierWave } from "./carrier-wave/carrier-wave";
import { AppHeader } from "./application-header/application-header";
import { SoundPicker, pureToneFrequencyFromSoundName } from "./sound-picker/sound-picker";
import { useAutoWidth } from "../hooks/use-auto-width";
import { ButtonGroup } from "./button-group/button-group";

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
  "pick-sound": "pick-sound",
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

const setupAudioContext = async (
  audioSource: React.MutableRefObject<AudioBufferSourceNode | undefined>,
  audioContext: React.MutableRefObject<AudioContext | undefined>,
  setPlaying: React.Dispatch<React.SetStateAction<boolean>>,
  gainNode: React.MutableRefObject<GainNode | undefined>,
  setAudioBuffer: React.Dispatch<React.SetStateAction<AudioBuffer | undefined>>,
  recordingAudioBuffer: AudioBuffer | undefined,
  setPlaybackProgress: React.Dispatch<React.SetStateAction<number>>,
  soundName: SoundName
  ) => {
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
    audioContext.current = new AudioContext();
    gainNode.current = audioContext.current.createGain();
    setAudioBuffer(recordingAudioBuffer);
    setPlaybackProgress(0);
    return;
  }

  if (soundName === "pick-sound") {
    // This code path will be invoked on application start-up. Due to
    // browser audio privacy restrictions, we don't try to create an
    // audio context here; as a user needs to explicitly interact with
    // the application before that would be successful. See:
    // https://developer.chrome.com/blog/autoplay/#web-audio
    // Note: previously we had code here that attempted to create a new
    // AudioContext; that resulted in a run-time error in desktop Chrome on
    // macOS (see: https://www.pivotaltracker.com/story/show/180792030).
    const emptyAudioBuffer = new AudioBuffer({length: 1, sampleRate: 8000});
    setAudioBuffer(emptyAudioBuffer);
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


export const App = () => {
  const [selectedSound, setSelectedSound] = useState<SoundName>("pick-sound");
  const [playing, setPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(16);
  const [playbackProgress, setPlaybackProgress] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [graphWidth, setGraphWidth] = useState<number>(100);
  const [graphHeight, setGraphHeight] = useState<number>(105);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer>();
  const [recordingAudioBuffer, setRecordingAudioBuffer] = useState<AudioBuffer>();

  const audioContext = useRef<AudioContext>();
  const audioSource = useRef<AudioBufferSourceNode>();
  const gainNode = useRef<GainNode>();
  const playingRef = useRef<boolean>();
  playingRef.current = playing;

  useAutoWidth({
    container: document.body,
    onWidthChange: useCallback( (containerWidth) => {
        const newWidth = containerWidth - (2 * SIDE_MARGIN_PLUS_BORDER);
        setGraphWidth(newWidth);
        const graphContainer = document.querySelector(".main-controls-and-waves-container");
        if (graphContainer) {
          const graphContainerHeight = graphContainer.clientHeight;
          setGraphHeight(graphContainerHeight - ( (graphContainerHeight > 475) ? 155 : 115));
        }
      }
      , [])
  });

  const setupAudioContextFromRecording = (recordingBuffer: AudioBuffer) => {
    setAudioBuffer(recordingBuffer);
    setPlaybackProgress(0);
  };

  const setupAudioContextCallback = useCallback((
    soundName) => {
        setupAudioContext(audioSource, audioContext, setPlaying, gainNode, setAudioBuffer, recordingAudioBuffer, setPlaybackProgress, soundName);
    }, [recordingAudioBuffer]);

  useEffect(() => {
    // AudioContext is apparently unavailable in the node / jest environment.
    // So we bail out early, to prevent render test failure.
    if (!window.AudioContext) { return; }

    setupAudioContextCallback(selectedSound);
  },
    [selectedSound, setupAudioContextCallback]
  );

  useEffect(() => {
    if (gainNode.current) {
      gainNode.current.gain.value = volume;
    }
  }, [volume]);

  const handleVolumeChange = (value: number) => {
    setVolume(value);
  };

  const handlePlay = () => {
    // If user hasn't chosen a canned or recorded sound, then there's nothing to do here.
    if (selectedSound === "pick-sound") { return; }

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

  const handleSpeedButtonClicked = (index: number, value: string) => {
    let playbackSpeed = 1;

    if (value === "\u00BDx") {
      playbackSpeed = 0.5;
    } else if (value === "2x") {
      playbackSpeed = 2;
    }

    setPlaybackSpeedTo(playbackSpeed);
  };

  const speedLabelFromSpeed = (playbackSpeed: number): string => {
    if (playbackSpeed === 0.5) {
      return "\u00BDx";
    }

    if (playbackSpeed === 2) {
      return "2x";
    }

    return "1x";
  };

  const handleProgressUpdate = (newProgress: number) =>
    setPlaybackProgress(newProgress);


  return (
    <div className="app">
      <AppHeader />
      <div className="non-header-container">
      <SoundPicker
        selectedSound={selectedSound}
        setSelectedSound={setSelectedSound}
        recordingAudioBuffer={recordingAudioBuffer}
        setRecordingAudioBuffer={setRecordingAudioBuffer}
        playing={playing}
        onMyRecordingChosen={setupAudioContextFromRecording}
      />
      <div className="main-controls-and-waves-container">
        <div className="playback-and-volume-controls">
          <div
            className={`play-pause button${(selectedSound === "pick-sound") ? " disabled" : ""}`}
            onClick={handlePlay}
            >
            { playing
              ? <PauseIcon className="pause-play-icons" />
              : <PlayIcon className="pause-play-icons" />
            }
          </div>
          <div className="volume-controls">
            <div>
              <VolumeIcon className="volume-icon" />
            </div>
            <div className="volume-slider-container">
              <div className="volume-label">Volume</div>
              <div>
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
          <div className="speed-control">
            <div className={`speed-label${(playing) ? " disabled" : ""}`}>
              Speed
            </div>
            <div>
              <ButtonGroup
                disabled={playing}
                buttons={["\u00BDx", "1x", "2x"]}
                selectedButtonLabel={speedLabelFromSpeed(playbackRate)}
                onButtonClicked={handleSpeedButtonClicked}
                />
            </div>
          </div>
        </div>
        <div className="sound-wave-container">
          <SoundWave
            width={graphWidth}
            height={graphHeight}
            audioBuffer={audioBuffer}
            volume={volume}
            playbackProgress={playbackProgress}
            zoom={zoom}
            zoomedInView={true}
            shouldDrawProgressMarker={true}
            pureToneFrequency={pureToneFrequencyFromSoundName(selectedSound)}
            handleZoomIn={handleZoomIn}
            handleZoomOut={handleZoomOut}
        />
          <div className="zoomed-out-graph-container chosen-sound">
            <SoundWave
              width={graphWidth}
              height={ZOOMED_OUT_GRAPH_HEIGHT}
              audioBuffer={audioBuffer}
              volume={volume}
              playbackProgress={playbackProgress}
              zoom={zoom}
              zoomedInView={false}
              interactive={!playing}
              onProgressUpdate={handleProgressUpdate}
            />
          </div>
        </div>
      </div>
      <CarrierWave
        audioBuffer={audioBuffer}
        playbackProgress={playbackProgress}
        graphWidth={graphWidth}
        graphHeight={graphHeight}
        volume={volume}
        interactive={!playing}
        onProgressUpdate={handleProgressUpdate}
      />
      </div>
    </div>
  );
};
