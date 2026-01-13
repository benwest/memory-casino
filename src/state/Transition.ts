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
  @computed get backgroundColorKeyframes() {
    return new Keyframes<Color>(BLACK).to(
      GREY,
      this.state.clipTimeline.transitionInDuration,
      "quadOut"
    );
  }
  @computed get overlayColorKeyframes() {
    return new Keyframes<Color>(BLACK)
      .to(WHITE, this.state.clipTimeline.transitionInDuration, "quadIn")
      .to(TRANSPARENT_WHITE, 0);
  }

  constructor(private state: State) {}

  update(time: number) {
    const state = this.state;
    for (const char of state.textLayout.chars) {
      char.opacityProps.transitionIn =
        time - state.clipTimeline.getLoopStartTime(0) >= char.transitionInDelay;
      char.opacityProps.transitionOut = false;
    }
    state.linksEnabled = time >= state.clipTimeline.getLoopStartTime(0);
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
    console.log("transition out started");
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
