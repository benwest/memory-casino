import { useRef } from "react";
import { getCssVar } from "@/utils/cssVars";
import { useTick } from "@/hooks/useTick";
import { State } from "@/state/State";

interface DotsProps {
  state: State;
}

const YELLOW = getCssVar("--color-yellow");

export function Dots({ state }: DotsProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useTick(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const layout = state.textLayout;
    canvas.width = layout.widthPx * devicePixelRatio;
    canvas.height = layout.heightPx * devicePixelRatio;
    canvas.style.width = `${layout.widthPx}px`;
    canvas.style.height = `${layout.heightPx}px`;

    ctx.scale(devicePixelRatio, devicePixelRatio);

    ctx.fillStyle = YELLOW;
    const dotRadius = 0.8;

    const chars = layout.lines.flat();
    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      if (char.value !== " ") continue;
      if (char.opacity > 0) {
        ctx.globalAlpha = char.opacity;
        ctx.beginPath();
        ctx.arc(char.rect.cx, char.rect.cy, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });

  return <canvas ref={ref} />;
}
