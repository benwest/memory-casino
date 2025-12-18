import { Color } from "@/utils/Color";
import { Keyframes } from "@/utils/tween";
import { State } from "./State";
import { BLACK, GREY, TRANSPARENT_WHITE, WHITE } from "./colors";
import { SourceData } from "./sources";
import { LinkProps } from "./Char";
import { remap, remapClamped } from "@/utils/math";

export interface Transition {
  update(time: number): void;
  refresh(): Transition;
}
export class TransitionIn implements Transition {
  private textStartDelay: number;
  private backgroundColorKeyframes: Keyframes<Color>;
  private overlayColorKeyframes: Keyframes<Color>;

  constructor(private state: State) {
    this.textStartDelay =
      state.clipTimeline.initialDelay +
      state.clipTimeline.initialClips * state.clipTimeline.initialClipDuration;

    const clipStartDelay = state.clipTimeline.initialDelay;

    this.backgroundColorKeyframes = new Keyframes<Color>(BLACK).to(
      GREY,
      clipStartDelay,
      "quadOut"
    );

    this.overlayColorKeyframes = new Keyframes<Color>(BLACK)
      .to(WHITE, clipStartDelay, "quadIn")
      .to(TRANSPARENT_WHITE, 0);
  }

  update(time: number) {
    const state = this.state;
    for (const char of state.textLayout.chars) {
      char.opacityProps.transitionIn =
        time - this.textStartDelay >= char.transitionInDelay;
      char.opacityProps.transitionOut = false;
    }
    state.linksEnabled = time >= this.textStartDelay;
    state.backgroundColor = this.backgroundColorKeyframes.sample(time);
    state.overlayColor = this.overlayColorKeyframes.sample(time);

    state.illuminateCurrentClips();
  }

  refresh() {
    return new TransitionIn(this.state);
  }
}

export class TransitionInFast implements Transition {
  private backgroundColorKeyframes: Keyframes<Color>;
  private overlayColorKeyframes: Keyframes<Color>;
  private charDelays: number[];

  constructor(private state: State) {
    this.backgroundColorKeyframes = new Keyframes<Color>(BLACK).to(
      GREY,
      2,
      "quadOut"
    );
    this.overlayColorKeyframes = new Keyframes<Color>(WHITE).to(
      TRANSPARENT_WHITE,
      2,
      "quadIn"
    );

    const charDelayVariance = 0.0;
    this.charDelays = this.state.textLayout.chars.map(
      (char, i) => i * 0.0002 + Math.random() * charDelayVariance
    );
  }

  update(time: number) {
    const state = this.state;
    state.linksEnabled = true;
    for (const char of state.textLayout.chars) {
      char.opacityProps.transitionIn = time >= this.charDelays[char.index];
      char.opacityProps.transitionOut = false;
    }
    state.backgroundColor = this.backgroundColorKeyframes.sample(time);
    state.overlayColor = this.overlayColorKeyframes.sample(time);
    state.illuminateCurrentClips();
  }

  refresh() {
    return new TransitionInFast(this.state);
  }
}

export class TransitionOut implements Transition {
  transitionOrder: SourceData[];
  backgroundColorKeyframes: Keyframes<Color>;
  overlayColorKeyframes: Keyframes<Color>;

  constructor(private state: State, private link: LinkProps) {
    this.transitionOrder = shuffle(state.clipsForLink(link));
    this.backgroundColorKeyframes = new Keyframes<Color>(GREY).to(
      BLACK,
      5,
      "quadIn"
    );
    this.overlayColorKeyframes = new Keyframes<Color>(WHITE).to(
      GREY,
      1,
      "quintOut"
    );
  }

  update(time: number) {
    const duration = 2;
    const numLights = remapClamped(
      time,
      0,
      duration,
      this.transitionOrder.length,
      0
    );
    this.state.illuminateClips(this.transitionOrder.slice(0, numLights));
    for (const char of this.state.textLayout.chars) {
      char.opacityProps.transitionOut = true;
    }
    this.state.backgroundColor = this.backgroundColorKeyframes.sample(time);
    this.state.overlayColor = this.overlayColorKeyframes.sample(time);
  }

  refresh() {
    return new TransitionOut(this.state, this.link);
  }
}

function shuffle<T>(array: T[]): T[] {
  const result = array.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
