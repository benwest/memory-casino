import { AnimatedValue, Curve, Easing, IAnimate } from "./tween";

export type CoroutineFunction = (
  co: CoroutineContext
) => Generator<void, void, void>;

export class Coroutine {
  private generator: Generator<void, void, void>;
  private context = new CoroutineContext();

  isDone = false;
  done: Promise<void>;
  private resolve: () => void;

  constructor(fn: CoroutineFunction) {
    this.generator = fn(this.context);
    const { promise, resolve } = Promise.withResolvers<void>();
    this.done = promise;
    this.resolve = resolve;
  }

  update(dT: number) {
    if (this.isDone) return;
    this.context.dT = dT;
    this.context.time += dT;
    const result = this.generator.next();
    if (result.done) {
      this.isDone = true;
      this.resolve();
    }
  }

  return() {
    this.generator.return();
    this.isDone = true;
    this.resolve();
  }

  tick() {
    let then = Date.now() / 1000;
    const next = () => {
      if (this.isDone) return;
      const now = Date.now() / 1000;
      const dT = now - then;
      then = now;
      this.update(dT);
      requestAnimationFrame(next);
    };
    requestAnimationFrame(next);
  }

  [Symbol.iterator]() {
    return this.generator;
  }

  static parallel(coroutines: Coroutine[]) {
    return new Coroutine(function* (ctx) {
      while (coroutines.some(co => !co.isDone)) {
        for (const co of coroutines) {
          if (!co.isDone) co.update(ctx.dT);
        }
        yield;
      }
    });
  }

  static fromAnimation<T>(animation: IAnimate<T>, update: (value: T) => void) {
    return new Coroutine(function* (ctx) {
      yield* ctx.tween(animation.duration, (_progress, time) => {
        const value = animation.sample(time);
        update(value);
      });
    });
  }
}

export class CoroutineContext {
  time = 0;
  dT = 0;

  *sleep(duration: number) {
    const endTime = this.time + duration;
    while (this.time < endTime) yield;
  }

  *tween(duration: number, update: (progress: number, time: number) => void) {
    const startTime = this.time;
    const endTime = startTime + duration;
    do {
      const elapsed = Math.min(this.time - startTime, duration);
      const progress = elapsed / duration;
      update(progress, elapsed);
      yield;
    } while (this.time < endTime);
  }

  *until(predicate: () => boolean) {
    while (!predicate()) yield;
  }

  *untilTime(time: number) {
    while (this.time < time) yield;
  }

  *sub(co: Coroutine) {
    while (!co.isDone) {
      co.update(this.dT);
      yield;
    }
  }
}

function getNumber<T, K extends keyof T>(
  object: T & { [key in K]: number },
  key: K
): number {
  return object[key];
}
