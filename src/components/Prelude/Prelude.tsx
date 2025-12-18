import { toRgbaString } from "@/utils/Color";
import { Dots } from "../Dots";
import { RandomPlayer } from "../RandomPlayer";
import { TextContainer, TextRenderer } from "../Text";
import { Links } from "../Links";
import { State } from "@/state/State";
import { useTick } from "@/hooks/useTick";
import { twMerge } from "tailwind-merge";
import { useEffect, useRef } from "react";
import { LinkProps } from "@/state/Char";
import { useUpdateState } from "./useUpdateState";
import { autorun } from "mobx";

export interface PreludeProps {
  running: boolean;
  currentFilm: LinkProps | null;
  setCurrentFilm: (film: LinkProps | null) => void;
}

export function Prelude({
  running,
  currentFilm,
  setCurrentFilm,
}: PreludeProps) {
  const state = State.instance;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  useUpdateState(state, canvasRef, textRef, currentFilm);
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
