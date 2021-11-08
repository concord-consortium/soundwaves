import React, { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { ICarrierWaveProps, Frequency, Modulation, ISoundWavePropsWithDataAndCarrier, ISoundWaveProps, SIDE_MARGIN_PLUS_BORDER, ZOOM_BUTTONS_WIDTH, SOUND_WAVE_GRAPH_HEIGHT, ZOOMED_OUT_GRAPH_HEIGHT } from "../../types"
import { SoundWave } from "../sound-wave";
import { useAutoWidth } from "../../hooks/use-auto-width";
import { ZoomButtons } from "../zoom-buttons/zoom-buttons";

import "./carrier-wave.scss";


type CarrierWave = {modulation: Modulation, frequency: Frequency};

const carrierWaves: Record<string, CarrierWave> = {
  "Choose . . .":   {modulation: "", frequency:  0},
  "AM 540kHz":   {modulation: "AM", frequency:  540e3},
  "AM 600kHz":   {modulation: "AM", frequency:  600e3},
  "AM 1200kHz":  {modulation: "AM", frequency: 1200e3},
  "FM 89.7MHz":  {modulation: "FM", frequency:  897e5},
  "FM 101.9MHz": {modulation: "FM", frequency: 1019e5},
  "FM 108.1MHz": {modulation: "FM", frequency: 1081e5},
};

export const CarrierWave = (props: ICarrierWaveProps) => {
  const { audioBuffer, playbackProgress } = props;
console.log('Into CarrierWave ctor');
// console.log('audioBuffer', audioBuffer);

const [carrierWaveSelection, setCarrierWaveSelection] = useState<string>("Choose . . .");
  const [carrierWavelength, setCarrierWavelength] = useState<string>("");
  const [carrierFrequency, setCarrierFrequency] = useState<number>(0);
  const [timesHigherThanHuman, setTimesHigherThanHuman] = useState<string>("");
  const [modulation, setModulation] = useState<string>("");
  const [carrierBuffer, setCarrierBuffer] = useState<AudioBuffer>();
  const [graphWidth, setGraphWidth] = useState<number>(100);
  const [carrierZoom, setCarrierZoom] = useState<number>(16);
  const [previousAudioBuffer, setPreviousAudioBuffer] = useState<AudioBuffer>();

  const carrierContext = useRef<OfflineAudioContext>();

  // Attempt 'D'
  const renderCarrier = async () => {
    console.log('Into CarrierWave renderCarrier()');
    // console.log('audioBuffer', audioBuffer);

        const numChannels = 1;
        const carrierFrequency = 262; // TODO: set based on user selection (but SCALED???)
        const carrierSampleRate = 48000; // WebAudio API's (minimum required) maximum rate is 96kHz
        const carrierBufferLength = carrierSampleRate * 100; // 100 second(s)

        carrierContext.current =
          new OfflineAudioContext(numChannels, carrierBufferLength, carrierSampleRate);

        const carrierOscillator = carrierContext.current.createOscillator();
        carrierOscillator.type = "sine";
        carrierOscillator.frequency.setValueAtTime(
          carrierFrequency, carrierContext.current.currentTime);

        carrierOscillator.connect(carrierContext.current.destination);

    // const gainNode = new GainNode(carrierContext.current);
    // gainNode.gain.value = 0.2;
    // carrierOscillator.connect(gainNode);
    // gainNode.connect(carrierContext.current.destination);

        carrierOscillator.start();
        const carrierBuffer = await carrierContext.current.startRendering();
        setCarrierBuffer(carrierBuffer);
//  console.log(carrierBuffer);

        // OBSOLETE
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

// console.log('previousAudioBuffer', previousAudioBuffer);
// console.log('audioBuffer', audioBuffer);
// console.log('carrierBuffer', carrierBuffer);
  if (audioBuffer) {
console.log('audioBuffer defined:', audioBuffer);
console.log('carrierBuffer', carrierBuffer);
if (!previousAudioBuffer) {
console.log('previousAudioBuffer UN-defined');
      setPreviousAudioBuffer(audioBuffer);
      renderCarrier();
    } else {
console.log('previousAudioBuffer defined; length=', previousAudioBuffer.length);
      if (previousAudioBuffer.length !== audioBuffer.length) {
        setPreviousAudioBuffer(audioBuffer);
        renderCarrier();
      }
    }
  } else {
console.log('audioBuffer UN-defined');
  }

  // if (audioBuffer && !previousAudioBuffer) {
    // // if ( (!carrierBuffer) || (previousAudioBuffer !== audioBuffer) ) {
    //   setPreviousAudioBuffer(audioBuffer);
    // //   renderCarrier();
    // // }
    // } else {
    //   console.log('previousAudioBuffer', previousAudioBuffer);
    //   if (previousAudioBuffer?.length !== audioBuffer?.length) {
    //     setPreviousAudioBuffer(audioBuffer);
    //   }
    // }

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
  // };

  useAutoWidth({
    container: document.body,
    onWidthChange: useCallback(
      (newWidth) => {setGraphWidth(newWidth - (2 * SIDE_MARGIN_PLUS_BORDER))}
    , [])
  });

  useEffect( () => {
console.log('Into CarrierWave useEffect(); playbackProgress: ', playbackProgress);
    // renderCarrier();
  }, [playbackProgress]);

  const setupCarrierContext = async () => {
    console.log('setupCarrierContext() - carrierFrequency', carrierFrequency);
      };

  const handleCarrierChange = ( (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setCarrierWaveSelection(value);

    const newModulationValue = carrierWaves[value].modulation;
    setModulation(newModulationValue ? newModulationValue : "");

    const frequency = carrierWaves[value].frequency;
    setCarrierFrequency(frequency);
    const wavelengthInMilliSeconds = ((1 / frequency) * 1000).toPrecision(3);

    setTimesHigherThanHuman( (frequency !== 0)
      ? `${(frequency / 2e4).toString()}x` // Using 20kHz as upper range of human hearing
      : "");

    setCarrierWavelength( (frequency !== 0)
      ? `${wavelengthInMilliSeconds}ms`
      : "");

    // setupCarrierContext();
  });

  const handleZoomIn = () => {
    setCarrierZoom(Math.min(2048, carrierZoom * 2));
  };

  const handleZoomOut = () => {
    setCarrierZoom(Math.max(2, carrierZoom * 0.5));
  };

  const CarrierWaveOptions = (): any => {
    const carrierWaveKeys: string[] = [];
    for (const key in carrierWaves) {
      carrierWaveKeys.push(key);
    }
    const optionElements = carrierWaveKeys.map((key) =>
      <option key={key} value={key}>{key}</option>
    );
    return (optionElements);
  };

console.log('Into CarrierWave before returning JSX; carrierZoom=', carrierZoom);

  return (
    <div className="carrier-wave-container">
      <div className="carrier-picker-container">
        <div className="carrier-picker-caption">
          Radio Carrier Wave:&nbsp;
        </div>
        <div className="freq-mod-container">
          <select value={carrierWaveSelection} onChange={handleCarrierChange}>
            <CarrierWaveOptions />
          </select>
        </div>
      </div>
      <div className="carrier-wave-graph-container">
        <div className="zoomed-in-view">
          <SoundWave
            width={graphWidth}
            height={SOUND_WAVE_GRAPH_HEIGHT}
            audioBuffer={carrierBuffer}
            volume={1}
            playbackProgress={playbackProgress}
            zoom={carrierZoom}
            zoomedInView={true}
            shouldDrawProgressMarker={true}
            interactive={false}
            debug={false}
          />
        </div>
        <div className="zoomed-out-graph-container">
          <SoundWave
            width={graphWidth - ZOOM_BUTTONS_WIDTH}
            height={ZOOMED_OUT_GRAPH_HEIGHT}
            audioBuffer={carrierBuffer}
            volume={1}
            playbackProgress={playbackProgress}
            zoom={carrierZoom}
            zoomedInView={false}
            shouldDrawProgressMarker={false}
            interactive={false}
            debug={false}
          />
          <ZoomButtons handleZoomIn={handleZoomIn} handleZoomOut={handleZoomOut} />
        </div>
      </div>
      <div className="wavelength-mod-container">
        <div>
          Wavelength:&nbsp;<span className="value">{carrierWavelength}</span>
        </div>
        <div>
          &nbsp;Modulation:&nbsp;
          <span className="value">
            {
              modulation && ((modulation === "FM") ? "Frequency" : "Amplitude")
            }
          </span>
        </div>
      </div>

      <div className="times-higher-than-container">
        Higher than human hearing range by:&nbsp;
        <span className="value">{timesHigherThanHuman}</span>
      </div>
    </div>
  );
};
