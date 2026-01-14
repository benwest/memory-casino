import { toRgbaString } from "@/utils/Color";
import { Dots } from "../Dots";
import { RandomPlayer } from "../RandomPlayer";
import { TextContainer, TextRenderer } from "../Text";
import { Links } from "../Links";
import { State } from "@/state/State";
import { twMerge } from "tailwind-merge";
import { useEffect } from "react";
import { autorun } from "mobx";
import { FilmContent } from "@/content";

export interface PreludeProps {
  running: boolean;
  setCurrentFilm: (film: FilmContent | null) => void;
  textRef: React.RefObject<HTMLDivElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export function Prelude({
  running,
  setCurrentFilm,
  textRef,
  canvasRef,
}: PreludeProps) {
  const state = State.instance;
  useBackgroundColor(state);
  return (
    <>
      <RandomPlayer state={state} canvasRef={canvasRef} enabled={running} />
      <TextContainer className="-z-1">
        <Dots state={state} />
      </TextContainer>
      <TextContainer
        className={twMerge(
          "absolute top-0 l-0 z-200",
          !running && "pointer-events-none"
        )}
        onClick={() => state.skipForward()}
      >
        <div ref={textRef} className="relative">
          <TextRenderer state={state} />
          <Links state={state} onClick={setCurrentFilm} />
        </div>
      </TextContainer>
    </>
  );
}

function useBackgroundColor(state: State) {
  useEffect(() => {
    return autorun(() => {
      document.body.style.backgroundColor = toRgbaString(state.backgroundColor);
    });
  });
}
