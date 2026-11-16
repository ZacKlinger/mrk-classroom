export const GROWTH_SECONDS = 16;

// Illustration time, not a model of real plant growth.
export function advanceGrowth(progress, seconds, { water, lights, reducedMotion = false }) {
  if (!water || !lights) return progress;
  if (reducedMotion) return 1;
  return Math.min(1, progress + Math.max(0, seconds) / GROWTH_SECONDS);
}
