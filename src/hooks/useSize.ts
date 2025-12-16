import { RefObject, useCallback, useEffect, useState } from "react";

export function useOnResize(
  ref: RefObject<HTMLElement | null>,
  callback: (entry: ResizeObserverEntry) => void
) {
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) callback(entry);
    });
    observer.observe(ref.current);
    return () => {
      observer.disconnect();
    };
  }, [callback, ref]);
}

export function useSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const updateSize = useCallback(
    (entry: ResizeObserverEntry) =>
      setSize(prev => {
        const { width, height } = entry.target.getBoundingClientRect();
        if (prev.width === width && prev.height === height) {
          return prev;
        }
        return { width, height };
      }),
    []
  );
  useOnResize(ref, updateSize);
  return size;
}
