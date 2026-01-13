interface ClipTimelineParams {
  transitionInDuration: number;
  initialClips: number;
  initialClipDuration: number;
  loopDurations: number[];
}

export class ClipTimeline {
  readonly transitionInDuration: number;
  readonly initialClips: number;
  readonly initialClipDuration: number;
  readonly loopDelays: readonly number[];
  readonly loopDurations: readonly number[];
  readonly totalLoopDuration: number;

  constructor(params: ClipTimelineParams) {
    this.transitionInDuration = params.transitionInDuration;
    this.initialClips = params.initialClips;
    this.initialClipDuration = params.initialClipDuration;
    const loopDelays = [0];
    for (const duration of params.loopDurations) {
      loopDelays.push(loopDelays.at(-1)! + duration);
    }
    this.loopDelays = loopDelays;
    this.loopDurations = params.loopDurations;
    this.totalLoopDuration = this.loopDurations.reduce((sum, d) => sum + d, 0);
  }

  private getDuration(index: number): number {
    if (index === -1) return this.transitionInDuration;
    if (index < this.initialClips) return this.initialClipDuration;
    const loopIndex = (index - this.initialClips) % this.loopDurations.length;
    return this.loopDurations[loopIndex];
  }

  private getStartTime(index: number): number {
    if (index === -1) return 0;

    if (index < this.initialClips) {
      return this.transitionInDuration + index * this.initialClipDuration;
    }

    const initialDuration = this.initialClips * this.initialClipDuration;
    const loopsCompleted = Math.floor(
      (index - this.initialClips) / this.loopDurations.length
    );
    const indexInLoop = (index - this.initialClips) % this.loopDurations.length;
    const partialLoopDuration = this.loopDelays[indexInLoop];

    return (
      this.transitionInDuration +
      initialDuration +
      loopsCompleted * this.totalLoopDuration +
      partialLoopDuration
    );
  }

  private getIndexAtTime(time: number) {
    if (time < this.transitionInDuration) return -1;

    const initialClipsDuration = this.initialClips * this.initialClipDuration;
    if (time < this.transitionInDuration + initialClipsDuration) {
      return Math.floor(
        (time - this.transitionInDuration) / this.initialClipDuration
      );
    }

    const timeInLoops =
      time - (this.transitionInDuration + initialClipsDuration);
    const loopTotalDuration = this.loopDurations.reduce((sum, d) => sum + d, 0);
    const loopsCompleted = Math.floor(timeInLoops / loopTotalDuration);
    const timeInCurrentLoop = timeInLoops % loopTotalDuration;
    for (let i = this.loopDelays.length - 1; i >= 0; i--) {
      if (timeInCurrentLoop >= this.loopDelays[i]) {
        return (
          this.initialClips + loopsCompleted * this.loopDurations.length + i
        );
      }
    }

    throw new Error("Unreachable");
  }

  getLoopStartTime(index: number): number {
    return (
      this.transitionInDuration +
      this.initialClips * this.initialClipDuration +
      this.totalLoopDuration * index
    );
  }

  sample(fromTime: number, toTime: number) {
    const clips: { index: number; duration: number; startTime: number }[] = [];

    let currentIndex = this.getIndexAtTime(fromTime);

    while (true) {
      const startTime = this.getStartTime(currentIndex);
      if (startTime >= toTime) break;
      if (currentIndex !== -1) {
        clips.push({
          index: currentIndex,
          duration: this.getDuration(currentIndex),
          startTime: startTime,
        });
      }
      currentIndex++;
    }

    return clips;
  }
}
