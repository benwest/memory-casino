import { toRgbaString } from "@/utils/Color";
import { Dots } from "../Dots";
import { RandomPlayer } from "../RandomPlayer";
import { TextContainer, TextRenderer, useTextLayout } from "../Text";
import { Links } from "../Links";
import { State } from "@/state/State";
import { useTick } from "@/hooks/useTick";
import { twMerge } from "tailwind-merge";

export interface PreludeProps {
  running: boolean;
  setCurrentFilm: (film: string | null) => void;
}

export function Prelude({ running, setCurrentFilm }: PreludeProps) {
  const { state, canvasRef, textRef } = useTextLayout();
  useBackgroundColor(state);
  return (
    <>
      <RandomPlayer state={state} canvasRef={canvasRef} enabled={running} />
      <TextContainer className="-z-1">
        <Dots state={state} />
      </TextContainer>
      <TextContainer
        className={twMerge(
          "absolute top-0 l-0",
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
  useTick(() => {
    document.body.style.backgroundColor = toRgbaString(state.backgroundColor);
  });
}
