import { Signal } from "@preact/signals-core";
import { RNG } from "./rng";
import { SourceData } from "./sources";
import { DURATIONS, LayoutParams, PAUSES, TextLayout } from "./TextLayout";
import { Color } from "../utils/Color";
import { Keyframes } from "../utils/tween";
import { clamp, wrap } from "../utils/math";
import { LinkProps } from "./Char";
import { Rect } from "../utils/Rect";

interface StateParams {
  sources: SourceData[];
  layout: Omit<LayoutParams, "startTime">;
}

const BLACK: Color = [0, 0, 0, 1];
const WHITE: Color = [1, 1, 1, 1];
const TRANSPARENT_WHITE: Color = [1, 1, 1, 0];
const GREY: Color = [33 / 255, 34 / 255, 32 / 255, 1];

const BACKGROUND_FADE_DURATION = 4;
const PLAYER_START_DELAY = BACKGROUND_FADE_DURATION + 2;
const PLAYER_FADE_DURATION = 0.5;

const BACKGROUND_COLOR_KEYFRAMES = new Keyframes<Color>(BLACK).to(
  GREY,
  BACKGROUND_FADE_DURATION
);

const OVERLAY_COLOR_KEYFRAMES = new Keyframes<Color>(
  BLACK,
  PLAYER_START_DELAY - PLAYER_FADE_DURATION
)
  .to(WHITE, PLAYER_FADE_DURATION, "quintInOut")
  .to(WHITE, 1, "quintInOut")
  .to(TRANSPARENT_WHITE, 0);

interface SourceParams {
  seed: number;
  startTime: number;
  duration: number;
}

export class State {
  readonly sources: SourceData[];
  readonly textLayout: TextLayout;
  private readonly seed = Math.random() * 1_000_000;

  backgroundColor = BLACK;
  overlayColor = BLACK;
  currentClip: SourceData | null = null;
  preloadClips: SourceData[] = [];

  constructor(params: StateParams) {
    this.sources = params.sources;
    this.textLayout = new TextLayout({ startTime: 14, ...params.layout });
  }

  bodyRevealed = true;
  hoveredLink: LinkProps | null = null;
  setHoveredLink(link: LinkProps | null) {}

  private lastTime = 0;
  update(time: number) {
    const dT = this.lastTime ? clamp(time - this.lastTime, 0, 0.1) : 0;
    this.lastTime = time;

    this.backgroundColor = BACKGROUND_COLOR_KEYFRAMES.sample(time);
    this.overlayColor = OVERLAY_COLOR_KEYFRAMES.sample(time);

    const currentSource = this.getCurrentSource(time);
    this.currentClip = this.selectSource(currentSource);
    this.preloadClips = this.getPreloadSources(currentSource, 5)
      .map(source => this.selectSource(source))
      .filter((s): s is SourceData => s !== null);

    const chars = this.textLayout.lines.flat();

    const spaceIndexes: number[] = [];
    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      if (char.value === " " && !char.obscured) spaceIndexes.push(i);
    }

    const litIndexes: Set<number> = new Set();
    if (this.currentClip && time > 8) {
      const hash = RNG.hash(this.currentClip.url);
      litIndexes.add(RNG.sample(hash, spaceIndexes));
    }
    if (this.hoveredLink) {
      const clips = this.sources.filter(source =>
        source.url.includes(this.hoveredLink!.sourceFilter)
      );
      for (const clip of clips) {
        const hash = RNG.hash(clip.url);
        litIndexes.add(RNG.sample(hash, spaceIndexes));
      }
    }

    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];

      char.opacityProps.transitionIn = char.delay <= time;

      char.setLit(litIndexes.has(i));

      char.opacityProps.bodyReveal =
        this.bodyRevealed || char.type !== "body" || char.value === " ";

      char.opacityProps.hover =
        char.value === " " ||
        !this.hoveredLink ||
        char.link === this.hoveredLink;

      char.update(dT);
    }
  }

  updateObscuredChars(layout: {
    viewportRect: Rect;
    playerRect: Rect;
    textRect: Rect;
  }) {
    const ox = -layout.textRect.x;
    const oy = -layout.textRect.y;
    const textRelativePlayer = layout.playerRect.translate(ox, oy);
    const textRelativeViewport = layout.viewportRect.translate(ox, oy);
    for (const char of this.textLayout.lines.flat()) {
      char.obscured =
        !textRelativeViewport.intersects(char.rect) ||
        textRelativePlayer.intersects(char.rect);
    }
  }

  private getCurrentSource(time: number): SourceParams {
    if (time < this.textLayout.startTime) {
      const duration =
        DURATIONS.medium * this.textLayout.widthChars + PAUSES.short;
      const t = time - this.textLayout.startTime;
      const seed = Math.floor(t / duration);
      const startTime = seed * duration + this.textLayout.startTime;
      return { seed, duration, startTime };
    } else {
      const loops = Math.floor(
        (time - this.textLayout.startTime) / this.textLayout.duration
      );
      const loopedTime = wrap(
        time,
        this.textLayout.startTime,
        this.textLayout.endTime
      );
      const lineIndex = this.textLayout.lineIndexAtTime(loopedTime);
      const seed = loops * this.textLayout.heightChars + lineIndex;
      const startTime =
        this.textLayout.lineDelay(lineIndex) + loops * this.textLayout.duration;
      const duration = this.textLayout.lineDuration(lineIndex);
      return { seed, duration, startTime };
    }
  }

  private getNextSource(current: SourceParams): SourceParams {
    return this.getCurrentSource(current.startTime + current.duration);
  }

  private getPreloadSources(
    current: SourceParams,
    duration: number
  ): SourceParams[] {
    const sources: SourceParams[] = [current];
    let totalDuration = current.duration;
    while (totalDuration < duration) {
      const next = this.getNextSource(sources[sources.length - 1]);
      sources.push(next);
      totalDuration += next.duration;
    }
    return sources;
  }

  private selectSource({ seed, duration }: SourceParams): SourceData | null {
    const candidates = this.sources.filter(
      source => source.duration >= duration
    );
    if (candidates.length === 0) return null;
    return RNG.sample(this.seed + seed, candidates);
  }
}
