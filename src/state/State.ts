import { RNG } from "@/utils/RNG";
import { SourceData, sources } from "./sources";
import { DURATIONS, LayoutParams, PAUSES, TextLayout } from "./TextLayout";
import { Char, LinkProps } from "./Char";
import { Rect } from "../utils/Rect";
import { Signal } from "@preact/signals-core";
import { ClipTimeline } from "./ClipTimeline";
import {
  Transition,
  TransitionIn,
  TransitionInFast,
  TransitionOut,
} from "./Transition";
import { BLACK } from "./colors";
import { content } from "@/content";

interface StateParams {
  sources: SourceData[];
  layout: LayoutParams;
}

export class State {
  readonly sources: SourceData[];
  viewportRect = new Rect();
  playerRect = new Rect();
  textRect = new Rect();

  textLayout!: TextLayout;
  clipTimeline!: ClipTimeline;
  transition!: Transition;
  transitionStartTime = 0;

  onLayoutUpdated = new Signal();
  private readonly seed = Math.random() * 1_000_000;

  backgroundColor = BLACK;
  overlayColor = BLACK;
  currentClip: SourceData | null = null;
  preloadClips: SourceData[] = [];

  constructor(params: StateParams) {
    this.sources = params.sources;
    this.layout(params.layout);
  }

  bodyRevealed = true;
  hoveredLink: LinkProps | null = null;
  linksEnabled = false;

  layout(params: LayoutParams) {
    this.textLayout = new TextLayout(params);

    this.clipTimeline = new ClipTimeline({
      initialDelay: 10,
      initialClips: 16,
      initialClipDuration:
        DURATIONS.fast * this.textLayout.widthChars + PAUSES.short,
      loopDurations: this.textLayout.lines.map((_, i) =>
        this.textLayout.lineDuration(i)
      ),
    });

    if (!this.transition) {
      this.transition = new TransitionIn(this);
    } else {
      this.transition = this.transition.refresh();
    }
  }

  transitionIn() {
    if (this.transition instanceof TransitionIn) return;
    this.transition = new TransitionIn(this);
    this.transitionStartTime = this.time;
  }

  transitionInFast() {
    if (this.transition instanceof TransitionInFast) return;
    this.transition = new TransitionInFast(this);
    this.transitionStartTime = this.time;
  }

  transitionOut(link: LinkProps) {
    if (this.transition instanceof TransitionOut) return;
    this.transition = new TransitionOut(this, link);
    this.transitionStartTime = this.time;
  }

  time = 0;
  update(dT: number) {
    this.time += dT;

    const nextClips = this.clipTimeline.sample(this.time, this.time + 5);

    this.preloadClips = nextClips
      .map(({ index, duration }) =>
        this.selectSource(index, duration, this.hoveredLink?.sourceFilter)
      )
      .filter((s): s is SourceData => s !== undefined);

    for (const film of content.films) {
      if (!film.link) continue;
      const thumbnail = this.getLinkThumbnailSource(film.link);
      if (thumbnail) this.preloadClips.push(thumbnail);
    }

    if (this.hoveredLink) {
      const thumbnail = this.getLinkThumbnailSource(this.hoveredLink);
      if (thumbnail) {
        this.currentClip = thumbnail;
      }
    } else {
      this.currentClip =
        nextClips[0]?.startTime <= this.time ? this.preloadClips[0] : null;
    }

    // this.updateLights();
    this.transition.update(this.time - this.transitionStartTime);

    // if (this.animation?.type === "transition-in") {
    //   const animationTime = this.time - this.animation.startTime;
    //   for (const char of this.textLayout.chars) {
    //     char.opacityProps.transitionIn =
    //       animationTime - this.textStartDelay >= char.transitionInDelay;
    //     char.opacityProps.transitionOut = false;
    //   }
    //   this.backgroundColor = BACKGROUND_COLOR_KEYFRAMES.sample(animationTime);
    //   this.overlayColor = OVERLAY_COLOR_KEYFRAMES.sample(animationTime);
    // } else if (this.animation?.type === "transition-in-fast") {
    //   const animationTime = this.time - this.animation.startTime;
    //   for (const char of chars) {
    //     char.opacityProps.transitionIn = true;
    //     char.opacityProps.transitionOut =
    //       animationTime <= char.transitionOutDelay;
    //   }
    // } else if (this.animation?.type === "transition-out") {
    //   const animationTime = this.time - this.animation.startTime;
    //   for (const char of chars) {
    //     char.opacityProps.transitionIn = true;
    //     char.opacityProps.transitionOut =
    //       animationTime >= char.transitionOutDelay;
    //   }
    // } else {
    //   for (const char of chars) {
    //     char.opacityProps.transitionIn = true;
    //     char.opacityProps.transitionOut = false;
    //   }
    // }

    for (const char of this.textLayout.chars) {
      char.opacityProps.hover =
        char.value === " " ||
        !this.hoveredLink ||
        char.link === this.hoveredLink;

      char.opacityProps.bodyReveal =
        this.bodyRevealed || char.type !== "body" || char.value === " ";

      char.update(dT);
    }
  }

  getVisibleChars() {
    const ox = -this.textRect.x;
    const oy = -this.textRect.y;
    const textRelativePlayer = this.playerRect.clone().translate(ox, oy);
    const textRelativeViewport = this.viewportRect.clone().translate(ox, oy);
    return this.textLayout.chars.filter(
      char =>
        textRelativeViewport.intersects(char.rect) &&
        !textRelativePlayer.intersects(char.rect)
    );
  }

  clipsForLink(link: LinkProps) {
    return this.sources.filter(source =>
      source.url.includes(link.sourceFilter)
    );
  }

  illuminateClips(clips: SourceData[]) {
    const visibleSpaces = this.getVisibleChars().filter(
      char => char.value === " "
    );

    const litSpaces = new Set<Char>();
    if (visibleSpaces.length) {
      for (const clip of clips) {
        const hash = RNG.hash(clip.url);
        litSpaces.add(RNG.sample(hash, visibleSpaces));
      }
    }

    for (const char of this.textLayout.chars) {
      char.setLit(litSpaces.has(char));
    }
  }

  illuminateCurrentClips() {
    const currentClips: SourceData[] = [];

    if (this.hoveredLink) {
      currentClips.push(...this.clipsForLink(this.hoveredLink));
    } else if (this.currentClip) {
      currentClips.push(this.currentClip);
    }

    this.illuminateClips(currentClips);
  }

  getLinkThumbnailSource(link: LinkProps) {
    return this.sources.find(source => source.url.includes(link.thumbnail));
  }

  private selectSource(seed: number, duration: number, filter?: string) {
    const candidates = this.sources.filter(
      source =>
        source.duration >= duration && (!filter || source.url.includes(filter))
    );
    if (candidates.length === 0) return null;
    return RNG.sample(this.seed + seed, candidates);
  }

  static instance = new State({
    sources,
    layout: {
      charWidthPx: 12,
      lineHeightPx: 18,
      maxWidthPx: 600,
      gutterWidthPx: 40,
    },
  });
}
