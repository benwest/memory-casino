import { RefObject, useEffect, useImperativeHandle, useRef } from "react";
import { toRgbaString } from "../../utils/Color";
import { State } from "../../state/State";
import { useTick } from "../../hooks/useTick";
import { getAsset, preloadAssets } from "./assetCache";
import { remap } from "@/utils/math";
import { Rect } from "@/utils/Rect";
import { autorun } from "mobx";

const VIDEO_WIDTH = 128;
const VIDEO_HEIGHT = 128 * 3;
const EXPAND = 16;

export interface RandomPlayerProps {
  state: State;
  enabled?: boolean;
  canvasRef?: RefObject<HTMLCanvasElement | null>;
}

export function RandomPlayer({
  state,
  enabled = true,
  canvasRef: externalCanvasRef,
}: RandomPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useImperativeHandle(externalCanvasRef, () => canvasRef.current!);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    canvas.width = VIDEO_WIDTH + EXPAND * 2;
    canvas.height = VIDEO_HEIGHT + EXPAND * 2;

    const resizeObserver = new ResizeObserver(() => {
      const scale = Math.min(
        container.clientWidth / canvas.width,
        container.clientHeight / canvas.height
      );
      canvas.style.transform = `scale(${scale})`;
      state.setParams({
        playerRect: Rect.fromElement(canvas),
      });
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [state]);

  useEffect(() => {
    if (!enabled) return;
    const dispose = autorun(() => preloadAssets(state.preloadClips));
    return () => {
      preloadAssets([]);
      dispose();
    };
  }, [enabled, state]);

  useTick(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderVideo(state, canvas);
  });

  useEffect(() => {
    return () => {};
  }, []);

  return (
    <div
      className="fixed flex justify-center items-center pointer-events-none h-[90svh] lg:h-[96svh] top-[5svh] lg:top-[2svh] left-25 right-25"
      ref={containerRef}
    >
      <canvas ref={canvasRef} style={{ filter: `blur(7px)` }} />
    </div>
  );
}

const videoCanvas = document.createElement("canvas");
videoCanvas.width = VIDEO_WIDTH;
videoCanvas.height = VIDEO_HEIGHT;
const videoCtx = videoCanvas.getContext("2d", { colorSpace: "display-p3" })!;
videoCtx.beginPath();
videoCtx.roundRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT, 9999);
videoCtx.clip();
videoCtx.fillStyle = "black";
videoCtx.fillRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);

function renderVideo(state: State, canvas: HTMLCanvasElement) {
  const asset = getAsset(state.currentClip?.url || "");
  if (asset) {
    if (asset instanceof HTMLVideoElement) {
      asset.play().catch(() => {
        console.warn("Video play failed", asset.src);
      });
    }
    videoCtx.drawImage(asset, 0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
  }

  const ctx = canvas.getContext("2d", { colorSpace: "display-p3" })!;
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(videoCtx.canvas, EXPAND, EXPAND);
  ctx.globalCompositeOperation = "source-atop";
  ctx.fillStyle = toRgbaString(state.overlayColor);
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}
