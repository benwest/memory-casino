import { useEffect, useMemo, useRef } from "react";
import { getCssVar } from "@/utils/cssVars";
import { Color, hexToRgba, lerpColors, toRgbaString } from "@/utils/Color";
import { State } from "@/state/State";
import { autorun, set } from "mobx";
import { useCssVar } from "@/hooks/useCssVar";

const YELLOW = hexToRgba(getCssVar("--color-yellow"));
const YELLOW_RGBA = toRgbaString(YELLOW);

interface TextRendererProps {
  state: State;
}

const lightRadius = 20;
const lightCanvas = createLightGradient(
  lightRadius,
  YELLOW,
  setAlpha(YELLOW, 0)
);

export function TextRenderer({ state }: TextRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    return autorun(() => renderText(ctx, state));
  }, [state]);

  return <canvas ref={canvasRef} />;
}

function renderText(ctx: CanvasRenderingContext2D, state: State) {
  const fontSans = `${getCssVar("--font-size-sans")} "Liberation Mono"`;
  const fontSerif = `${getCssVar("--font-size-serif")} "Selectric"`;
  const styles = {
    body: { font: fontSerif, color: YELLOW_RGBA },
    title: { font: fontSans, color: YELLOW_RGBA },
    link: { font: fontSans, color: "white" },
    "inactive-link": { font: fontSans, color: YELLOW_RGBA },
  };

  const canvas = ctx.canvas;

  const layout = state.textLayout;
  const margin = {
    x: Math.ceil(lightRadius - layout.charWidthPx / 2),
    y: Math.ceil(lightRadius - layout.lineHeightPx / 2),
  };
  const canvasSize = {
    width: layout.widthPx + margin.x * 2,
    height: layout.heightPx + margin.y * 2,
  };

  canvas.width = canvasSize.width * devicePixelRatio;
  canvas.height = canvasSize.height * devicePixelRatio;
  canvas.style.width = `${canvasSize.width}px`;
  canvas.style.height = `${canvasSize.height}px`;
  canvas.style.margin = `-${margin.y}px -${margin.x}px`;

  ctx.scale(devicePixelRatio, devicePixelRatio);
  ctx.translate(margin.x, margin.y);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.letterSpacing = "0px";
  const chars = layout.lines.flat();
  for (const char of chars) {
    const style = styles[char.type as keyof typeof styles];
    if (char.value !== " " && style && char.opacity > 0) {
      ctx.globalAlpha = char.opacity;
      ctx.font = style.font;
      ctx.fillStyle = style.color;
      ctx.fillText(char.value, char.rect.cx, char.rect.cy);
    }
    if (char.lightBrightness > 0) {
      ctx.globalAlpha = char.lightBrightness;
      ctx.drawImage(
        lightCanvas,
        char.rect.cx - lightCanvas.width / 2,
        char.rect.cy - lightCanvas.height / 2
      );
    }
  }
}

function createLightGradient(r: number, fromColor: Color, toColor: Color) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.width = canvas.height = lightRadius * 2;
  const gradient = ctx.createRadialGradient(r, r, 0, r, r, r);
  const numStops = 10;
  for (let i = 0; i <= numStops; i++) {
    const t = i / numStops;
    const g = gaussian(t);
    const color = lerpColors(fromColor, toColor, g);
    gradient.addColorStop(t, toRgbaString(color));
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
}

function setAlpha(color: Color, alpha: number): Color {
  return [color[0], color[1], color[2], alpha];
}

function gaussian(t: number, sigma = 0.5): number {
  const denom = 1 - Math.exp(-1 / (2 * sigma * sigma));
  return (1 - Math.exp((-t * t) / (2 * sigma * sigma))) / denom;
}
