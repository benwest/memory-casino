import { lazy, Suspense } from "react";
import { Prelude } from "../Prelude";
import { State } from "@/state/State";
import { useUpdateState } from "../Prelude/useUpdateState";

const Player = lazy(() =>
  import("../Player").then(mod => ({ default: mod.Player }))
);

export function App() {
  const state = State.instance;
  const { textRef, canvasRef, currentFilm, setCurrentFilm } =
    useUpdateState(state);

  return (
    <>
      <Prelude
        textRef={textRef}
        canvasRef={canvasRef}
        setCurrentFilm={setCurrentFilm}
        running={currentFilm === null}
      />
      {currentFilm !== null && (
        <Suspense fallback={null}>
          <Player src={currentFilm.url} close={() => setCurrentFilm(null)} />
        </Suspense>
      )}
    </>
  );
}
