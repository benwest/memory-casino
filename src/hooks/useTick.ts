import { useEffect, useRef } from "react";

export function useTick(callback: (dt: number) => void) {
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  useEffect(() => {
    let frame: number;
    let lastTime: number | null = null;
    function tick(time: number) {
      if (lastTime !== null) {
        const dt = (time - lastTime) / 1000;
        callbackRef.current(dt);
      }
      lastTime = time;
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
    };
  }, []);
}
