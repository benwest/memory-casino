import { RNG } from "@/utils/RNG";
import { SourceData, sources } from "./sources";
import { DURATIONS, PAUSES, TextLayout } from "./TextLayout";
import { Char } from "./Char";
import { Rect } from "../utils/Rect";
import { ClipTimeline } from "./ClipTimeline";
import {
  Transition,
  TransitionIn,
  TransitionInFast,
  TransitionOut,
} from "./Transition";
import { BLACK } from "./colors";
import { content, FilmContent } from "@/content";
import { action, computed, observable } from "mobx";

interface Params {
  charWidthPx: number;
  lineHeightPx: number;
  maxWidthPx: number;
  viewportRect: Rect;
  playerRect: Rect;
  textRect: Rect;
  hoveredFilm: FilmContent | null;
  bodyRevealed: boolean;
}

export class State {
  readonly sources: SourceData[] = sources;

  @observable accessor params: Params = {
    charWidthPx: 12,
    lineHeightPx: 18,
    maxWidthPx: 600,
    viewportRect: new Rect(),
    playerRect: new Rect(),
    textRect: new Rect(),
    hoveredFilm: null,
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
      transitionInDuration: 10,
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

  @observable.ref accessor backgroundColor = BLACK;
  @observable.ref accessor overlayColor = BLACK;
  @observable.struct accessor currentClip: SourceData | null = null;
  @observable accessor isNewClip = false;
  @observable.struct accessor preloadClips: SourceData[] = [];
  @observable accessor linksEnabled = false;
  @observable.ref accessor currentFilm: FilmContent | null = null;

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

  transitionOut(toFilm?: FilmContent) {
    if (this.transition instanceof TransitionOut) return;
    this.setTransition(new TransitionOut(this, toFilm));
  }

  private time = 0;
  @action update(dT: number) {
    this.time += dT;
    const { hoveredFilm, bodyRevealed } = this.params;

    const nextClips = this.clipTimeline.sample(this.time, this.time + 5);

    this.preloadClips = nextClips
      .map(({ index, duration }) =>
        this.selectSource(index, duration, hoveredFilm?.link?.sourceFilter)
      )
      .filter((s): s is SourceData => s !== undefined);

    for (const film of content.films) {
      if (!film.link) continue;
      const thumbnail = this.getFilmThumbnailSource(film);
      if (thumbnail) this.preloadClips.push(thumbnail);
    }

    const prevClip = this.currentClip;
    if (hoveredFilm?.link) {
      const thumbnail = this.getFilmThumbnailSource(hoveredFilm);
      if (thumbnail) {
        this.currentClip = thumbnail;
      }
    } else {
      this.currentClip =
        nextClips[0]?.startTime <= this.time ? this.preloadClips[0] : null;
    }
    this.isNewClip = this.currentClip !== prevClip;

    this.transition.update(this.time - this.transitionStartTime);

    for (const char of this.textLayout.chars) {
      char.opacityProps.hover =
        char.value === " " ||
        !hoveredFilm ||
        char.film?.link?.url === hoveredFilm?.link?.url;

      char.opacityProps.bodyReveal =
        bodyRevealed || char.type !== "body" || char.value === " ";

      char.update(dT);
    }
  }

  skipForward() {
    let toTime: number;
    const loop0 = this.clipTimeline.getLoopStartTime(0);
    const loop1 = this.clipTimeline.getLoopStartTime(1);
    if (this.time < loop0) {
      toTime = loop0;
    } else if (this.time < loop1) {
      toTime = loop1;
    } else {
      return;
    }
    if (toTime > this.time) {
      this.update(toTime - this.time);
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

  clipsForFilm(film: FilmContent) {
    return this.sources.filter(source =>
      source.url.includes(film.link?.sourceFilter ?? "")
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

    if (this.params.hoveredFilm) {
      currentClips.push(...this.clipsForFilm(this.params.hoveredFilm));
    } else if (this.currentClip) {
      currentClips.push(this.currentClip);
    }

    this.illuminateClips(currentClips);
  }

  getFilmThumbnailSource(film: FilmContent) {
    const link = film.link;
    if (!link) return undefined;
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
