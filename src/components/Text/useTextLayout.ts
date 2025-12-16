import { useEffect, useMemo, useRef } from "react";
import { useWindowSize } from "@/hooks/useWindowSize";
import { useTick } from "@/hooks/useTick";
import { useCssVar } from "@/hooks/useCssVar";
import { State } from "@/state/State";
import { useSize } from "@/hooks/useSize";
import { sources } from "@/state/sources";
import { Rect } from "@/utils/Rect";

export function useTextLayout() {
  const windowSize = useWindowSize();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const canvasSize = useSize(canvasRef);

  const margin = parseFloat(useCssVar("--page-margin"));
  const charWidth = parseFloat(useCssVar("--char-width"));
  const lineHeight = parseFloat(useCssVar("--line-height"));
  const state = useMemo(() => {
    return new State({
      sources,
      layout: {
        maxWidthPx: windowSize[0] - margin * 2,
        charWidthPx: charWidth,
        lineHeightPx: lineHeight,
        gutterWidthPx: canvasSize.width,
      },
    });
  }, [windowSize, margin, charWidth, lineHeight, canvasSize]);

  const timeRef = useRef(0);
  useTick((dT: number) => {
    timeRef.current += dT;
    state.update(timeRef.current);
  });

  useEffect(() => {
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

  useEffect(() => {
    const updateObscuredChars = () => {
      const canvas = canvasRef.current;
      const textDiv = textRef.current;
      if (!canvas || !textDiv) return;
      state.updateObscuredChars({
        viewportRect: new Rect(0, 0, window.innerWidth, window.innerHeight),
        playerRect: Rect.fromDOMRect(canvas.getBoundingClientRect()),
        textRect: Rect.fromDOMRect(textDiv.getBoundingClientRect()),
      });
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
  }, [state]);

  return { state, canvasRef, textRef };
}
