interface ClipTimelineParams {
  initialDelay: number;
  initialClips: number;
  initialClipDuration: number;
  loopDurations: number[];
}

export class ClipTimeline {
  initialDelay: number;
  initialClips: number;
  initialClipDuration: number;
  loopDurations: number[];

  constructor(params: ClipTimelineParams) {
    this.initialDelay = params.initialDelay;
    this.initialClips = params.initialClips;
    this.initialClipDuration = params.initialClipDuration;
    this.loopDurations = params.loopDurations;
  }

  private getDuration(index: number): number {
    if (index === -1) return this.initialDelay;
    if (index < this.initialClips) return this.initialClipDuration;
    const loopIndex = (index - this.initialClips) % this.loopDurations.length;
    return this.loopDurations[loopIndex];
  }

  private getStartTime(index: number): number {
    if (index === -1) return 0;

    if (index < this.initialClips) {
      return this.initialDelay + index * this.initialClipDuration;
    }

    const initialDuration = this.initialClips * this.initialClipDuration;
    const loopsCompleted = Math.floor(
      (index - this.initialClips) / this.loopDurations.length
    );
    const loopTotalDuration = this.loopDurations.reduce((sum, d) => sum + d, 0);
    const indexInLoop = (index - this.initialClips) % this.loopDurations.length;
    const partialLoopDuration = this.loopDurations
      .slice(0, indexInLoop)
      .reduce((sum, d) => sum + d, 0);

    return (
      this.initialDelay +
      initialDuration +
      loopsCompleted * loopTotalDuration +
      partialLoopDuration
    );
  }

  private getIndexAtTime(time: number) {
    if (time < this.initialDelay) return -1;

    const initialClipsDuration = this.initialClips * this.initialClipDuration;
    if (time < this.initialDelay + initialClipsDuration) {
      return Math.floor((time - this.initialDelay) / this.initialClipDuration);
    }

    const timeInLoops = time - (this.initialDelay + initialClipsDuration);
    const loopTotalDuration = this.loopDurations.reduce((sum, d) => sum + d, 0);
    const loopsCompleted = Math.floor(timeInLoops / loopTotalDuration);
    let timeInCurrentLoop = timeInLoops % loopTotalDuration;
    for (let i = 0; i < this.loopDurations.length; i++) {
      const clipDuration = this.loopDurations[i];
      if (timeInCurrentLoop < clipDuration) {
        return (
          this.initialClips + loopsCompleted * this.loopDurations.length + i
        );
      }
      timeInCurrentLoop -= clipDuration;
    }

    throw new Error("Unreachable");
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
