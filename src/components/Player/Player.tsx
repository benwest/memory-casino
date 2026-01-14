import { useEffect, useRef, useState } from "react";
import styles from "./Player.module.css";
import {
  Controls,
  FullscreenButton,
  MediaPlayer,
  MediaPlayerInstance,
  MediaProvider,
  MediaProviderAdapter,
  TimeSlider,
  isHLSProvider,
} from "@vidstack/react";
import "@vidstack/react/player/styles/base.css";
import { twMerge } from "tailwind-merge";
import { content } from "@/content";

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

interface PlayerProps {
  title: string;
  src: string;
  close: () => void;
}
export function Player({ src, title, close }: PlayerProps) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const playerRef = useRef<MediaPlayerInstance>(null);
  const togglePlay = () => {
    if (!playerRef.current) return;
    if (playerRef.current.paused) {
      playerRef.current.play();
    } else {
      playerRef.current.pause();
    }
  };

  const [metadataLoaded, setMetadataLoaded] = useState(false);

  return (
    <div
      className={twMerge(
        styles.videoContainer,
        metadataLoaded && styles.animate
      )}
    >
      <MediaPlayer
        ref={playerRef}
        className={styles.mediaPlayer}
        src={src}
        autoPlay
        onFullscreenChange={isFullscreen => {
          // poor check for if we are playing fullscreen mobile-style instead of inline
          if (!isFullscreen && isMobile) close();
        }}
        onProviderChange={onProviderChange}
        onLoadedMetadata={() => setMetadataLoaded(true)}
      >
        <MediaProvider className={styles.mediaProvider} onClick={togglePlay} />
        <Controls.Root className={styles.controls}>
          <Controls.Group className={styles.controlsGroup}>
            <div>{content.title}</div>
            <div>{title}</div>
            <TimeSlider.Root className={styles.slider}>
              <TimeSlider.Track className={styles.track}>
                <TimeSlider.TrackFill
                  className={twMerge(styles.track, styles.trackFill)}
                />
              </TimeSlider.Track>
              <TimeSlider.Preview className={styles.preview}>
                <TimeSlider.Value className={styles.timeValue} />
              </TimeSlider.Preview>
            </TimeSlider.Root>
            <FullscreenButton className={styles.button}>
              Fullscreen
            </FullscreenButton>
            <button className={styles.button} onClick={close}>
              Return
            </button>
          </Controls.Group>
        </Controls.Root>
      </MediaPlayer>
    </div>
  );
}

function onProviderChange(provider: MediaProviderAdapter | null) {
  if (isHLSProvider(provider)) {
    provider.library = () => import("hls.js");
  }
}
