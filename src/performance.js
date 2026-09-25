// Preserve the original 60 Hz simulation independently of display refresh rate.
export const FIXED_STEP = 1 / 60;
export const MAX_FRAME_TIME = 0.25;
export const LIGHT_PIXEL_RATIO = 0.65;
export const DEFAULT_LIGHT_MODE = true;

export function createFixedStepper(update) {
  let remainder = 0;
  return {
    advance(seconds) {
      remainder += Math.max(0, Math.min(seconds, MAX_FRAME_TIME));
      let steps = 0;
      while (remainder + 1e-10 >= FIXED_STEP) {
        update(FIXED_STEP);
        remainder -= FIXED_STEP;
        steps++;
      }
      return steps;
    },
    reset() { remainder = 0; }
  };
}

export function readLightMode(storage) {
  try {
    const saved = storage.getItem('fancy-light-mode');
    return saved === null ? DEFAULT_LIGHT_MODE : saved === 'true';
  } catch (_) { return DEFAULT_LIGHT_MODE; }
}
