import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import { SoundWave } from "./sound-wave";
import MiddleCSound from "../assets/middle-c.mp3";
import C2Sound from "../assets/c2.mp3";
import BabyCrySound from "../assets/baby-cry.mp3";
import BSCSLogo from "../assets/bscs-logo.svg";
import { normalizeData } from "../utils/audio";
import "./app.scss";

type SoundName = "middle-c" | "c2" | "baby-cry";

const sounds: Record<SoundName, string> = {
  "middle-c": MiddleCSound,
  "c2": C2Sound,
  "baby-cry": BabyCrySound
};

export const App = () => {
  const [selectedSound, setSelectedSound] = useState<SoundName>("middle-c");
  const [playing, setPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(16);
  const [playbackProgress, setPlaybackProgress] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [soundWaveData, setSoundWaveData] = useState<Float32Array>(new Float32Array(0));

  const audioContext = useRef<AudioContext>();
  const audioAnalyser = useRef<AnalyserNode>();
  const audioSource = useRef<AudioBufferSourceNode>();
  const audioBuffer = useRef<AudioBuffer>();
  const gainNode = useRef<GainNode>();
  const playingRef = useRef<boolean>();
  playingRef.current = playing;


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
    audioBuffer.current = await audioContext.current.decodeAudioData(soundArrayBuffer);
    audioAnalyser.current = audioContext.current.createAnalyser();
    gainNode.current = audioContext.current.createGain();

    setPlaybackProgress(0);
    setSoundWaveData(normalizeData(audioBuffer.current.getChannelData(0)));
  };

  useEffect(() => {
    setupAudioContext(selectedSound);
  }, [selectedSound]);

  useEffect(() => {
    if (gainNode.current) {
      gainNode.current.gain.value = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audioContext.current?.state === "suspended") {
      audioContext.current.resume();
    }
    if (playing && audioContext.current && audioBuffer.current && gainNode.current && audioAnalyser.current) {
      // > An AudioBufferSourceNode can only be played once; after each call to start(), you have to create a new node
      // > if you want to play the same sound again. Fortunately, these nodes are very inexpensive to create, and the
      // > actual AudioBuffers can be reused for multiple plays of the sound.
      // Source: https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode
      audioSource.current = audioContext.current.createBufferSource();
      audioSource.current.buffer = audioBuffer.current;
      audioSource.current.playbackRate.value = playbackRate;
      audioSource.current.onended = () => {
        measureProgress(); // one last call to measure progress to ensure that the current progress is saved precisely.
        setPlaying(false);
      };

      audioSource.current
        .connect(gainNode.current)
        .connect(audioAnalyser.current)
        .connect(audioContext.current.destination);
        audioSource.current?.start();

      const startTime = audioContext.current.currentTime;

      const measureProgress = () => {
        if (playingRef.current && audioContext.current && audioBuffer.current) {
          setPlaybackProgress(playbackRate * (audioContext.current.currentTime - startTime) / audioBuffer.current.duration);
          requestAnimationFrame(measureProgress);
        }
      };
      measureProgress();
    } else {
      audioSource.current?.stop();
    }
  }, [playing, playbackRate]);

  const handleSoundChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedSound(event.currentTarget.value as SoundName);
  };

  const handleVolumeChange = (event: ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(event.target.value));
  };

  const handlePlay = () => {
    setPlaying(!playing);
  };

  const handleZoomIn = () => {
    setZoom(Math.min(512, zoom * 2));
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
      <div className="playback">
        <button onClick={handlePlay}>{ playing ? "Pause" : "Play" }</button>
        <input type="range" min="0" max="2" step="0.01" value={volume} onChange={handleVolumeChange} />
      </div>
      <div className="sound-wave-container">
        <SoundWave
          width={600} height={200}
          data={soundWaveData}
          volume={volume}
          playbackProgress={playbackProgress}
          drawingStep={Math.max(1, 128 / zoom)} // draw every Nth data point, based on the current zoom level
          zoom={zoom}
          zoomedInView={true}
        />
        <SoundWave
          width={600} height={60}
          data={soundWaveData}
          volume={volume}
          playbackProgress={playbackProgress}
          drawingStep={64} // draw every 64th data point
          zoom={zoom}
          zoomedInView={false}
          interactive={!playing}
          onProgressUpdate={handleProgressUpdate}
        />
      </div>
      <div className="zoom-controls">
        Zoom: { zoom }
        <button onClick={handleZoomIn}>Zoom In</button>
        <button onClick={handleZoomOut}>Zoom Out</button>
      </div>
      <div className="zoom-controls">
        Playback Rate: { playbackRate >= 1 ? playbackRate : `1/${Math.round(1/playbackRate)}` }x
        <button onClick={handleFasterPlayback}>Speed up</button>
        <button onClick={handleSlowerPlayback}>Slow down</button>
      </div>
    </div>
  );
};
