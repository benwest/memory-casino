import { FilmContent } from "@/content";
import { lerpSmooth, moveTowards } from "@/utils/math";
import { Rect } from "@/utils/Rect";
import { observable, action } from "mobx";

const CHAR_FADE_IN_DURATION = 1 / 20;
const CHAR_FADE_OUT_DURATION = 1 / 500;
const LIGHT_FADE_IN_DURATION = 1 / 5;
const LIGHT_FADE_OUT_DURATION = 2;

export type CharType = "title" | "link" | "inactive-link" | "body" | "gap";

export interface CharParams {
  index: number;
  value: string;
  type: CharType;
  film?: FilmContent;
  rect?: Rect;
  transitionInDelay?: number;
}

export class Char {
  readonly index: number;
  readonly value: string;
  readonly type: CharType;
  readonly film?: FilmContent;
  readonly rect: Rect;
  readonly transitionInDelay: number;

  lit = false;
  @observable accessor lightBrightness = 0;
  @observable accessor opacity = 0;

  opacityProps = {
    transitionIn: false,
    transitionOut: false,
    light: false,
    hover: false,
    bodyReveal: true,
  };

  get targetOpacity() {
    const { transitionIn, transitionOut, light, hover, bodyReveal } =
      this.opacityProps;
    if (transitionOut) return 0;
    return light || (transitionIn && hover && bodyReveal) ? 1 : 0;
  }

  constructor({
    index,
    value = " ",
    type = "body",
    film,
    rect = new Rect(0, 0, 0, 0),
    transitionInDelay: delay = 0,
  }: CharParams) {
    this.index = index;
    this.value = value;
    this.type = type;
    this.film = film;
    this.rect = rect;
    this.transitionInDelay = delay;
  }

  @action update(dT: number) {
    if (this.targetOpacity === 0) {
      this.opacity = Math.min(this.opacity, 0.5);
      this.opacity = moveTowards(
        this.opacity,
        this.targetOpacity,
        dT / CHAR_FADE_OUT_DURATION
      );
    } else {
      this.opacity = moveTowards(
        this.opacity,
        this.targetOpacity,
        dT / CHAR_FADE_IN_DURATION
      );
    }
    if (this.lit) {
      this.lightBrightness = 1;
    } else {
      this.lightBrightness = lerpSmooth(this.lightBrightness, 0, dT, 0.1);
    }
  }

  setLit(lit: boolean) {
    this.lit = lit;
    if (lit) this.opacityProps.light = true;
  }
}
