import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useWindowSize } from "@/hooks/useWindowSize";
import { useTick } from "@/hooks/useTick";
import { useCssVar } from "@/hooks/useCssVar";
import { State } from "@/state/State";
import { Rect } from "@/utils/Rect";
import { useSize } from "@/hooks/useSize";
import { FilmContent } from "@/content";

const isTouch = "ontouchstart" in window;

export type StateRef = React.RefObject<State | null>;

export function useUpdateState(state: State) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  const windowSize = useWindowSize();
  const margin = parseFloat(useCssVar("--page-margin"));
  const charWidth = parseFloat(useCssVar("--char-width"));
  const lineHeight = parseFloat(useCssVar("--line-height"));
  const canvasSize = useSize(canvasRef);

  useLayoutEffect(() => {
    state.setParams({
      charWidthPx: charWidth,
      lineHeightPx: lineHeight,
      maxWidthPx: windowSize[0] - margin * 2,
    });
  }, [charWidth, lineHeight, margin, state, windowSize, canvasSize]);

  const [currentFilm, _setCurrentFilm] = useState<FilmContent | null>(null);
  const isInitialTransition = useRef(currentFilm === null);
  const setCurrentFilm = useCallback(
    (film: FilmContent | null) => {
      console.log("Setting current film to", film);
      if (film === null) {
        if (isInitialTransition.current) {
          isInitialTransition.current = false;
          state.transitionIn();
        } else {
          state.transitionInFast();
        }
      } else {
        state.transitionOut(isTouch ? undefined : film);
      }
      _setCurrentFilm(film);
    },
    [_setCurrentFilm, state]
  );

  useTick((dT: number) => {
    state.update(dT);
  });

  const revealBodyOnScroll = windowSize[0] <= 600;
  useLayoutEffect(() => {
    if (!revealBodyOnScroll) return;
    const onScroll = () => {
      state.setParams({ bodyRevealed: window.scrollY > 0 });
    };
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      state.setParams({ bodyRevealed: true });
    };
  }, [state, revealBodyOnScroll]);

  useLayoutEffect(() => {
    state.setParams({
      viewportRect: new Rect(0, 0, windowSize[0], windowSize[1]),
    });
  }, [state, windowSize]);

  useLayoutEffect(() => {
    const update = () => {
      const textDiv = textRef.current;
      if (!textDiv) return;
      state.setParams({
        textRect: Rect.fromElement(textDiv),
      });
    };
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(textRef.current!);
    window.addEventListener("scroll", update);
    update();
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("scroll", update);
    };
  }, [canvasRef, state, textRef]);

  return { canvasRef, textRef, currentFilm, setCurrentFilm };
}
