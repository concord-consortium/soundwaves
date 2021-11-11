export const getMaxAmplitude = (data: Float32Array) => {
  let max = -Infinity;
  for (let i = 0; i < data.length; i += 1) {
    if (Math.abs(data[i]) > max) {
      max = Math.abs(data[i]);
    }
  }
  return max;
};

export const getMinValue = (data: Float32Array) => {
  let min = Infinity;
  for (let i = 0; i < data.length; i += 1) {
    if (data[i] < min) {
      min = data[i];
    }
  }
  return min;
};

export const normalizeData = (data: Float32Array) => {
  const max = getMaxAmplitude(data);
  const multiplier = 1 / max;
  for (let i = 0; i < data.length; i += 1) {
    data[i] *= multiplier;
  }
  return data;
};

const MIN_SAMPLE_RATE = 3000; // limit defined by Web Audio API
export const downsampleAudioBuffer = async (audioBuffer: AudioBuffer, newSamplesCount: number): Promise<Float32Array> => {
  const ratio = newSamplesCount / audioBuffer.length;
  // audioBuffer.sampleRate
  const newSampleRate = Math.round(ratio * audioBuffer.sampleRate);
  const validSampleRate = Math.max(MIN_SAMPLE_RATE, newSampleRate);

  const downsampleContext = new OfflineAudioContext(1, audioBuffer.duration * validSampleRate, validSampleRate);
  const audioSourceForDownsampling = new AudioBufferSourceNode(downsampleContext, { buffer: audioBuffer });
  audioSourceForDownsampling.connect(downsampleContext.destination);
  audioSourceForDownsampling.start(0);
  const downsampledAudioBuffer = await downsampleContext.startRendering();
  const data = downsampledAudioBuffer.getChannelData(0);

  if (newSampleRate >= MIN_SAMPLE_RATE) {
    // Nothing to do, the web browser downsampling is enough as the requested sample rate was > 3000.
    return data;
  } else {
    // Additional downsampling necessary. This is a naive version that takes every Nth sample.
    // It's not perfect, but most likely it'll never have to be used if the sound files are shorter than 6.6 seconds.
    // (6.6s * 3000 = 19800 samples and 198000 < 20000 that sound wave graphs uses as a limit of points).
    const step = Math.ceil(MIN_SAMPLE_RATE / newSampleRate);
    const finalData = new Float32Array(Math.round(data.length / step));
    for (let i = 0; i < finalData.length; i += 1) {
      finalData[i] = data[i * step];
    }
    return finalData;
  }
};

// WebAudio API's (minimum required) maximum rate is 96kHz.
// The bigger value let's us use higher frequencies for carrier wave.
const CARRIER_SAMPLE_RATE = 96e3;

// [0, 1]. For example, if it's 0.5 and the FM frequency is 5000Hz, the final signal will be within [2500Hz, 7500Hz] range.
// Real FM radio uses value around 0.02, but this wouldn't be noticeable by users.
const FREQUENCY_MODULATION_RANGE = 0.5;

export const getFMCarrierWave = async (sourceBuffer: AudioBuffer, carrierFrequency: number, volume: number): Promise<AudioBuffer> => {
  const bufferLengthInSeconds = sourceBuffer.length / sourceBuffer.sampleRate;
  const carrierBufferLength = CARRIER_SAMPLE_RATE * bufferLengthInSeconds;

  const offlineContext = new OfflineAudioContext(1, carrierBufferLength, CARRIER_SAMPLE_RATE);

  const carrierOscillator = offlineContext.createOscillator();
  carrierOscillator.type = "sine";
  carrierOscillator.frequency.setValueAtTime(carrierFrequency, 0);

  const gainNode = new GainNode(offlineContext);
  gainNode.gain.value = carrierFrequency * FREQUENCY_MODULATION_RANGE * volume;

  const audioSource = offlineContext.createBufferSource();
  audioSource.buffer = sourceBuffer;

  audioSource
    .connect(gainNode)
    .connect(carrierOscillator.frequency);
  carrierOscillator.connect(offlineContext.destination);

  audioSource.start();
  carrierOscillator.start();

  return await offlineContext.startRendering();
};

export const getAMCarrierWave = async (sourceBuffer: AudioBuffer, carrierFrequency: number, volume: number): Promise<AudioBuffer> => {
  const bufferLengthInSeconds = sourceBuffer.length / sourceBuffer.sampleRate;
  const carrierBufferLength = CARRIER_SAMPLE_RATE * bufferLengthInSeconds;

  const offlineContext = new OfflineAudioContext(1, carrierBufferLength, CARRIER_SAMPLE_RATE);

  const carrierOscillator = offlineContext.createOscillator();
  carrierOscillator.type = "sine";
  carrierOscillator.frequency.setValueAtTime(carrierFrequency, 0);

  const gainNode = new GainNode(offlineContext);
  // This will shift the source signal and ensure that all the values are positive.
  gainNode.gain.value = -1 * getMinValue(sourceBuffer.getChannelData(0));

  const audioSource = offlineContext.createBufferSource();
  audioSource.buffer = sourceBuffer;

  carrierOscillator
    .connect(gainNode)
    .connect(offlineContext.destination);
  audioSource.connect(gainNode.gain);

  audioSource.start();
  carrierOscillator.start();

  return await offlineContext.startRendering();
};
