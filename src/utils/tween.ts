import * as eases from "eases";
import { lerp } from "./math";

export type AnimatedValue = number | number[];
export type Easing = ((t: number) => number) | keyof typeof eases;
export interface IAnimate<T> {
  duration: number;
  sample(time: number): T;
}

export interface CurveParams<T> {
  from: T;
  to: T;
  duration: number;
  easing?: Easing;
}

export class Curve<T extends AnimatedValue> implements IAnimate<T> {
  readonly from: T;
  readonly to: T;
  readonly duration: number;
  readonly easing: (t: number) => number;

  constructor(params: CurveParams<T>) {
    this.from = params.from;
    this.to = params.to;
    this.duration = params.duration;
    this.easing =
      typeof params.easing === "string"
        ? eases[params.easing]
        : params.easing || (t => t);
  }

  sample(time: number): T {
    if (time <= 0) {
      return this.from;
    } else if (time >= this.duration) {
      return this.to;
    } else {
      const t = time / this.duration;
      const easedT = this.easing(t);
      return Curve.interpolate(this.from, this.to, easedT);
    }
  }

  static interpolate<T>(from: T, to: T, t: number): T {
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
}

export class Keyframes<T extends AnimatedValue> implements IAnimate<T> {
  private curves: Curve<T>[] = [];
  private fromValue: T;
  duration = 0;

  constructor(from: T) {
    this.fromValue = from;
  }

  to(to: T, duration: number, easing?: Easing): Keyframes<T> {
    const curve = new Curve<T>({ from: this.fromValue, to, duration, easing });
    this.curves.push(curve);
    this.fromValue = to;
    this.duration += duration;
    return this;
  }

  wait(duration: number): Keyframes<T> {
    return this.to(this.fromValue, duration);
  }

  sample(time: number): T {
    if (this.curves.length === 0) return this.fromValue;
    let timeRemaining = time;
    for (const curve of this.curves) {
      if (timeRemaining < curve.duration) {
        return curve.sample(timeRemaining);
      }
      timeRemaining -= curve.duration;
    }
    return this.fromValue;
  }
}
