export function remap(
  value: number,
  start1: number,
  stop1: number,
  start2: number,
  stop2: number
): number {
  return ((value - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function inverseLerp(a: number, b: number, t: number) {
  return (t - a) / (b - a);
}

export function clamp(value: number, min: number = 0, max: number = 1) {
  return Math.max(min, Math.min(max, value));
}

export function toIncrement(value: number, increment: number) {
  return Math.round(value / increment) * increment;
}

export function moveTowards(current: number, target: number, maxDelta: number) {
  if (Math.abs(target - current) <= maxDelta) return target;
  return current + Math.sign(target - current) * maxDelta;
}

export function smoothT(delta: number, h: number) {
  return 1 - Math.pow(2, -delta / h);
}

export function lerpSmooth(a: number, b: number, delta: number, h: number) {
  const t = smoothT(delta, h);
  return lerp(a, b, t);
}

export function wrap(value: number, min: number, max: number) {
  const range = max - min;
  return ((((value - min) % range) + range) % range) + min;
}
