import React, { ChangeEvent, useRef, useState } from "react";
import { ICarrierWaveProps, Frequency, Modulation, ISoundWavePropsWithDataAndCarrier, ISoundWaveProps } from "../types";

type CarrierWave = {modulation: Modulation, frequency: Frequency};

export const carrierWaves: Record<string, CarrierWave> = {
  "Choose . . .":   {modulation: "", frequency:  0},
  "AM 540kHz":   {modulation: "AM", frequency:  540e3},
  "AM 600kHz":   {modulation: "AM", frequency:  600e3},
  "AM 1200kHz":  {modulation: "AM", frequency: 1200e3},
  "FM 89.7MHz":  {modulation: "FM", frequency:  897e5},
  "FM 101.9MHz": {modulation: "FM", frequency: 1019e5},
  "FM 108.1MHz": {modulation: "FM", frequency: 1081e5},
};

// export const CarrierWave = (props: ISoundWaveProps) => {
export const CarrierWave = (props: ICarrierWaveProps) => {
  const {
    // carrierWaveSelection,
    // wavelength,
    // timesHigherThanHuman,
    // modulation,
    // handleCarrierChange,
  } = props;

  const [carrierWaveSelection, setCarrierWaveSelection] = useState<string>("Choose . . .");
  const [carrierWavelength, setCarrierWavelength] = useState<string>("");
  const [carrierFrequency, setCarrierFrequency] = useState<number>(0);
  const [timesHigherThanHuman, setTimesHigherThanHuman] = useState<string>("");
  const [modulation, setModulation] = useState<string>("");
  const [carrierBuffer, setCarrierBuffer] = useState<AudioBuffer>();
  const carrierContext = useRef<OfflineAudioContext>();

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


  const setupCarrierContext = async () => {
    console.log('carrierFrequency', carrierFrequency);
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

    // setupCarrierContext();
  });

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
        {/* { (carrierFrequency !== 0) &&
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
        />} */}
      </div>


      <div className="wavelength-mod-container">
        <div>
          Wavelength:&nbsp;<span className="value">{carrierWavelength}</span>
        </div>
        <div>
        &nbsp;&nbsp;Modulation:&nbsp;
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
