import * as eases from "eases";
import { lerp } from "./math";

export type AnimatedValue = number | number[];
export type Easing = ((t: number) => number) | keyof typeof eases;
export type Interpolator<T> = (from: T, to: T, t: number) => T;

export interface CurveParams<T> {
  from: T;
  to: T;
  duration: number;
  delay?: number;
  easing?: Easing;
}

export class Curve<T extends AnimatedValue> {
  readonly from: T;
  readonly to: T;
  readonly duration: number;
  readonly easing: (t: number) => number;
  readonly delay: number;

  constructor(params: CurveParams<T>) {
    this.from = params.from;
    this.to = params.to;
    this.duration = params.duration;
    this.delay = params.delay ?? 0;
    this.easing =
      typeof params.easing === "string"
        ? eases[params.easing]
        : params.easing || (t => t);
  }

  interpolate(from: T, to: T, t: number): T {
    if (typeof from === "number" && typeof to === "number") {
      return lerp(from, to, t) as T;
    } else if (Array.isArray(from) && Array.isArray(to)) {
      const result: number[] = [];
      for (let i = 0; i < from.length; i++) {
        result.push(lerp(from[i], to[i], t));
      }
      return result as T;
    }
    throw new Error("Unsupported type for interpolation");
  }

  sample(time: number): T {
    if (time < this.delay) {
      return this.from;
    } else if (time >= this.delay + this.duration) {
      return this.to;
    } else {
      const t = (time - this.delay) / this.duration;
      const easedT = this.easing(t);
      return this.interpolate(this.from, this.to, easedT);
    }
  }
}

export class Keyframes<T extends AnimatedValue> {
  private curves: Curve<T>[] = [];

  private initialFrom: T;
  private initialDelay: number;

  constructor(from: T, delay: number = 0) {
    this.initialFrom = from;
    this.initialDelay = delay;
  }

  to(to: T, duration: number, easing?: Easing): Keyframes<T> {
    const from = this.endValue();
    const delay = this.endTime();
    const curve = new Curve<T>({ from, to, duration, delay, easing });
    this.curves.push(curve);
    return this;
  }

  sample(time: number): T {
    if (this.curves.length === 0) return this.initialFrom;
    if (time < this.initialDelay) return this.initialFrom;
    if (time >= this.endTime()) return this.endValue();
    for (const curve of this.curves) {
      if (time >= curve.delay && time < curve.delay + curve.duration)
        return curve.sample(time);
    }
    throw new Error("Time out of bounds");
  }

  endValue() {
    if (this.curves.length === 0) {
      return this.initialFrom;
    } else {
      return this.curves.at(-1)!.to;
    }
  }

  endTime() {
    if (this.curves.length === 0) {
      return this.initialDelay;
    } else {
      const last = this.curves.at(-1)!;
      return last.delay + last.duration;
    }
  }

  duration() {
    return this.endTime() - this.initialDelay;
  }
}
