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
