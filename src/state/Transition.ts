import { Color } from "@/utils/Color";
import { Keyframes } from "@/utils/tween";
import { State } from "./State";
import { BLACK, GREY, TRANSPARENT_WHITE, WHITE } from "./colors";
import { SourceData } from "./sources";
import { LinkProps } from "./Char";
import { remapClamped } from "@/utils/math";
import { computed } from "mobx";

export interface Transition {
  update(time: number): void;
}

export class TransitionIn implements Transition {
  @computed get textStartDelay() {
    return (
      this.state.clipTimeline.initialDelay +
      this.state.clipTimeline.initialClips *
        this.state.clipTimeline.initialClipDuration
    );
  }
  @computed get backgroundColorKeyframes() {
    return new Keyframes<Color>(BLACK).to(
      GREY,
      this.state.clipTimeline.initialDelay,
      "quadOut"
    );
  }
  @computed get overlayColorKeyframes() {
    return new Keyframes<Color>(BLACK)
      .to(WHITE, this.state.clipTimeline.initialDelay, "quadIn")
      .to(TRANSPARENT_WHITE, 0);
  }

  constructor(private state: State) {}

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
}

export class TransitionInFast implements Transition {
  backgroundColorKeyframes = new Keyframes<Color>(BLACK).to(GREY, 2, "quadOut");
  overlayColorKeyframes = new Keyframes<Color>(WHITE).to(
    TRANSPARENT_WHITE,
    2,
    "quadIn"
  );

  constructor(private state: State) {}

  update(time: number) {
    const state = this.state;
    state.linksEnabled = true;
    for (const char of state.textLayout.chars) {
      char.opacityProps.transitionIn = time >= char.index * 0.0002;
      char.opacityProps.transitionOut = false;
    }
    state.backgroundColor = this.backgroundColorKeyframes.sample(time);
    state.overlayColor = this.overlayColorKeyframes.sample(time);
    state.illuminateCurrentClips();
  }
}

export class TransitionOut implements Transition {
  transitionOrder: SourceData[];
  backgroundColorKeyframes = new Keyframes<Color>(GREY).to(BLACK, 1, "quadIn");
  overlayColorKeyframes = new Keyframes<Color>(WHITE).to(BLACK, 1, "quintOut");

  constructor(private state: State, link?: LinkProps) {
    this.transitionOrder = link ? state.clipsForLink(link) : [];
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
}

function shuffle<T>(array: T[]): T[] {
  const result = array.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
