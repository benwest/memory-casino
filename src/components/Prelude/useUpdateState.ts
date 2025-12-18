import { useLayoutEffect, useRef } from "react";
import { useWindowSize } from "@/hooks/useWindowSize";
import { useTick } from "@/hooks/useTick";
import { useCssVar } from "@/hooks/useCssVar";
import { State } from "@/state/State";
import { Rect } from "@/utils/Rect";
import { useSize } from "@/hooks/useSize";
import { LinkProps } from "@/state/Char";

export type StateRef = React.RefObject<State | null>;

export function useUpdateState(
  state: State,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  textRef: React.RefObject<HTMLDivElement | null>,
  currentFilm: LinkProps | null = null
) {
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

  const isInitialTransition = useRef(currentFilm === null);
  useLayoutEffect(() => {
    if (currentFilm === null) {
      if (isInitialTransition.current) {
        isInitialTransition.current = false;
        state.transitionIn();
      } else {
        state.transitionInFast();
      }
    } else {
      state.transitionOut(currentFilm);
    }
  }, [state, currentFilm]);

  useTick((dT: number) => {
    state.update(dT);
  });

  useLayoutEffect(() => {
    if (windowSize[0] > 600) return;
    const onScroll = () => {
      state.setParams({ bodyRevealed: window.scrollY > 0 });
    };
    window.addEventListener("scroll", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      state.setParams({ bodyRevealed: true });
    };
  }, [state, windowSize]);

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

  return { canvasRef, textRef };
}
