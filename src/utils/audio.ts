export const normalizeData = (data: Float32Array) => {
  let max = -Infinity;
  for (let i = 0; i < data.length; i += 1) {
    if (Math.abs(data[i]) > max) {
      max = Math.abs(data[i]);
    }
  }
  const multiplier = 1 / max;
  for (let i = 0; i < data.length; i += 1) {
    data[i] *= multiplier;
  }
  return data;
};

const MIN_SAMPLE_RATE = 3000; // limit defined by Web Audio API
export const downsampleAudioBuffer = async (audioBuffer: AudioBuffer, newSamplesCount: number) => {
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
    // It's not perfect, but most likely it'll never has to be used if the sound files are shorter than 6.6 seconds.
    // (6.6s * 3000 = 19800 samples and 198000 < 20000 that sound wave graphs uses as a limit of points).
    const step = Math.ceil(MIN_SAMPLE_RATE / newSampleRate);
    const finalData = new Float32Array(Math.round(data.length / step));
    for (let i = 0; i < finalData.length; i += 1) {
      finalData[i] = data[i * step];
    }
    return finalData;
  }
};
