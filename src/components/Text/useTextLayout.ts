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
    state.layout({
      charWidthPx: charWidth,
      lineHeightPx: lineHeight,
      maxWidthPx: windowSize[0] - margin * 2,
      gutterWidthPx: canvasSize.width,
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
      state.bodyRevealed = window.scrollY > 0;
    };
    window.addEventListener("scroll", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      state.bodyRevealed = true;
    };
  }, [state, windowSize]);

  useLayoutEffect(() => {
    const updateObscuredChars = () => {
      const canvas = canvasRef.current;
      const textDiv = textRef.current;
      if (!canvas || !textDiv) return;
      state.viewportRect = new Rect(
        0,
        0,
        window.innerWidth,
        window.innerHeight
      );
      state.playerRect = Rect.fromDOMRect(canvas.getBoundingClientRect());
      state.textRect = Rect.fromDOMRect(textDiv.getBoundingClientRect());
    };
    const resizeObserver = new ResizeObserver(updateObscuredChars);
    resizeObserver.observe(document.body);
    resizeObserver.observe(textRef.current!);
    resizeObserver.observe(canvasRef.current!);
    window.addEventListener("scroll", updateObscuredChars);
    updateObscuredChars();
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("scroll", updateObscuredChars);
    };
  }, [canvasRef, state, textRef]);

  return { canvasRef, textRef };
}
