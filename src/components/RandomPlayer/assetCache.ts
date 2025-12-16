import { SourceData } from "@/state/sources";

type Asset = HTMLVideoElement | HTMLImageElement;
const cache = new Map<string, Asset | Promise<Asset>>();

let autoplayFailed = false;
class AutoplayError extends Error {}

async function loadVideo(url: string): Promise<HTMLVideoElement> {
  const video = document.createElement("video");
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.crossOrigin = "anonymous";
  video.src = url;
  try {
    await video.play();
  } catch (e) {
    throw new AutoplayError();
  }
  video.pause();
  video.currentTime = 0;
  return video;
}

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function loadAsset(source: SourceData): Promise<Asset> {
  if (autoplayFailed) return loadImage(source.image);
  try {
    return await loadVideo(source.url);
  } catch (e) {
    if (e instanceof AutoplayError) {
      autoplayFailed = true;
    } else {
      console.warn("Video load failed, falling back to image", source.url, e);
    }
    return loadImage(source.image);
  }
}

export function getAsset(url: string) {
  const cached = cache.get(url);
  if (cached instanceof Promise) return null;
  return cached ?? null;
}

export function preloadAssets(sources: SourceData[]) {
  for (const source of sources) {
    if (!cache.has(source.url)) {
      const promise = loadAsset(source);
      cache.set(source.url, promise);
      promise.then(asset => cache.set(source.url, asset));
    }
  }
  for (const url of cache.keys()) {
    if (!sources.some(source => source.url === url)) cache.delete(url);
  }
}
