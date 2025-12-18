import { RNG } from "@/utils/RNG";
import { SourceData, sources } from "./sources";
import { DURATIONS, TextLayoutParams, PAUSES, TextLayout } from "./TextLayout";
import { Char, LinkProps } from "./Char";
import { Rect } from "../utils/Rect";
import { ClipTimeline } from "./ClipTimeline";
import {
  Transition,
  TransitionIn,
  TransitionInFast,
  TransitionOut,
} from "./Transition";
import { BLACK } from "./colors";
import { content } from "@/content";
import { action, computed, observable, configure } from "mobx";

configure({ computedRequiresReaction: true });

interface Params {
  charWidthPx: number;
  lineHeightPx: number;
  maxWidthPx: number;
  viewportRect: Rect;
  playerRect: Rect;
  textRect: Rect;
  hoveredLink: LinkProps | null;
  bodyRevealed: boolean;
}

export class State {
  readonly sources: SourceData[] = sources;

  @observable.deep accessor params: Params = {
    charWidthPx: 12,
    lineHeightPx: 18,
    maxWidthPx: 600,
    viewportRect: new Rect(),
    playerRect: new Rect(),
    textRect: new Rect(),
    hoveredLink: null,
    bodyRevealed: true,
  };

  @computed get textLayout() {
    return new TextLayout({
      charWidthPx: this.params.charWidthPx,
      lineHeightPx: this.params.lineHeightPx,
      maxWidthPx: this.params.maxWidthPx,
      gutterWidthPx: this.params.playerRect.width,
    });
  }

  @computed get clipTimeline() {
    return new ClipTimeline({
      initialDelay: 10,
      initialClips: 16,
      initialClipDuration:
        DURATIONS.fast * this.textLayout.widthChars + PAUSES.short,
      loopDurations: this.textLayout.lines.map((_, i) =>
        this.textLayout.lineDuration(i)
      ),
    });
  }

  private transition: Transition = new TransitionIn(this);
  private transitionStartTime = 0;

  private readonly seed = Math.random() * 1_000_000;

  @observable accessor backgroundColor = BLACK;
  @observable accessor overlayColor = BLACK;
  @observable accessor currentClip: SourceData | null = null;
  @observable accessor preloadClips: SourceData[] = [];
  @observable accessor linksEnabled = false;

  @action setParams(params: Partial<Params>) {
    Object.assign(this.params, params);
  }

  private setTransition(transition: Transition) {
    this.transition = transition;
    this.transitionStartTime = this.time;
  }

  transitionIn() {
    if (this.transition instanceof TransitionIn) return;
    this.setTransition(new TransitionIn(this));
  }

  transitionInFast() {
    if (this.transition instanceof TransitionInFast) return;
    this.setTransition(new TransitionInFast(this));
  }

  transitionOut(link: LinkProps) {
    if (this.transition instanceof TransitionOut) return;
    this.setTransition(new TransitionOut(this, link));
  }

  private time = 100;
  @action update(dT: number) {
    this.time += dT;
    const { hoveredLink, bodyRevealed } = this.params;

    const nextClips = this.clipTimeline.sample(this.time, this.time + 5);

    this.preloadClips = nextClips
      .map(({ index, duration }) =>
        this.selectSource(index, duration, hoveredLink?.sourceFilter)
      )
      .filter((s): s is SourceData => s !== undefined);

    for (const film of content.films) {
      if (!film.link) continue;
      const thumbnail = this.getLinkThumbnailSource(film.link);
      if (thumbnail) this.preloadClips.push(thumbnail);
    }

    if (hoveredLink) {
      const thumbnail = this.getLinkThumbnailSource(hoveredLink);
      if (thumbnail) {
        this.currentClip = thumbnail;
      }
    } else {
      this.currentClip =
        nextClips[0]?.startTime <= this.time ? this.preloadClips[0] : null;
    }

    this.transition.update(this.time - this.transitionStartTime);

    for (const char of this.textLayout.chars) {
      char.opacityProps.hover =
        char.value === " " ||
        !hoveredLink ||
        char.link?.url === hoveredLink.url;

      char.opacityProps.bodyReveal =
        bodyRevealed || char.type !== "body" || char.value === " ";

      char.update(dT);
    }
  }

  @computed get visibleSpaces() {
    const { viewportRect, playerRect, textRect } = this.params;
    const ox = -textRect.x;
    const oy = -textRect.y;
    const textRelativePlayer = playerRect.clone().translate(ox, oy);
    const textRelativeViewport = viewportRect.clone().translate(ox, oy);
    return this.textLayout.chars.filter(
      char =>
        char.value === " " &&
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
    const litSpaces = new Set<Char>();
    if (this.visibleSpaces.length) {
      for (const clip of clips) {
        const hash = RNG.hash(clip.url);
        litSpaces.add(RNG.sample(hash, this.visibleSpaces));
      }
    }

    for (const char of this.textLayout.chars) {
      char.setLit(litSpaces.has(char));
    }
  }

  illuminateCurrentClips() {
    const currentClips: SourceData[] = [];

    if (this.params.hoveredLink) {
      currentClips.push(...this.clipsForLink(this.params.hoveredLink));
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

  static instance = new State();
}
