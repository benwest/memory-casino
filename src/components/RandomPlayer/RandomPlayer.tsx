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
const BLUR_RADIUS = 16;

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
    canvas.width = VIDEO_WIDTH + BLUR_RADIUS * 2;
    canvas.height = VIDEO_HEIGHT + BLUR_RADIUS * 2;

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
      className="fixed flex justify-center items-center pointer-events-none top-5 bottom-5 left-25 right-25"
      ref={containerRef}
    >
      <canvas ref={canvasRef} />
    </div>
  );
}

const videoCanvas = document.createElement("canvas");
videoCanvas.width = VIDEO_WIDTH;
videoCanvas.height = VIDEO_HEIGHT;
const videoCtx = videoCanvas.getContext("2d", { colorSpace: "display-p3" })!;

function renderVideo(state: State, canvas: HTMLCanvasElement) {
  const asset = getAsset(state.currentClip?.url || "");
  if (asset) {
    videoCtx.save();
    videoCtx.beginPath();
    videoCtx.roundRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT, 9999);
    videoCtx.clip();
    videoCtx.fillStyle = "black";
    videoCtx.fillRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
    if (asset instanceof HTMLVideoElement) {
      asset.play().catch(() => {
        console.warn("Video play failed", asset.src);
      });
    }
    videoCtx.drawImage(asset, 0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
    videoCtx.restore();
  }

  const ctx = canvas.getContext("2d", { colorSpace: "display-p3" })!;
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const brightness = remap(state.overlayColor[3], 1, 0, 2, 1);
  ctx.filter = `blur(${
    BLUR_RADIUS / 3
  }px) contrast(1.25) brightness(${brightness})`;
  ctx.drawImage(videoCtx.canvas, BLUR_RADIUS, BLUR_RADIUS);
  ctx.globalCompositeOperation = "source-atop";
  ctx.fillStyle = toRgbaString(state.overlayColor);
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}
