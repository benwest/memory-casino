import { lerpSmooth, moveTowards } from "@/utils/math";
import { Rect } from "@/utils/Rect";

const CHAR_FADE_IN_DURATION = 1 / 20;
const CHAR_FADE_OUT_DURATION = 1 / 500;
const LIGHT_FADE_IN_DURATION = 1 / 5;
const LIGHT_FADE_OUT_DURATION = 2;

export type CharType = "title" | "link" | "inactive-link" | "body" | "gap";

export interface LinkProps {
  url: string;
  sourceFilter: string;
}

export interface CharParams {
  value?: string;
  type?: CharType;
  link?: LinkProps;
  rect?: Rect;
  delay?: number;
}

export class Char {
  value: string;
  type: CharType;
  link?: LinkProps;
  rect: Rect;
  delay: number;

  lit = false;
  lightBrightness = 0;
  obscured = false;

  opacityProps = {
    transitionIn: false,
    light: false,
    hover: false,
    bodyReveal: true,
  };

  opacity = 0;

  get targetOpacity() {
    const { transitionIn, light, hover, bodyReveal } = this.opacityProps;
    return light || (transitionIn && hover && bodyReveal) ? 1 : 0;
  }

  constructor({
    value = " ",
    type = "body",
    link,
    rect = new Rect(0, 0, 0, 0),
    delay = 0,
  }: CharParams) {
    this.value = value;
    this.type = type;
    this.link = link;
    this.rect = rect;
    this.delay = delay;
  }

  update(dT: number) {
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
      this.lightBrightness = moveTowards(
        this.lightBrightness,
        1,
        dT / LIGHT_FADE_IN_DURATION
      );
    } else {
      this.lightBrightness = lerpSmooth(this.lightBrightness, 0, dT, 0.1);
    }
  }

  setLit(lit: boolean) {
    this.lit = lit;
    if (lit) this.opacityProps.light = true;
  }
}
