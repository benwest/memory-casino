import { lazy, useState } from "react";
import { Prelude } from "../Prelude";
import { LinkProps } from "@/state/Char";

const Player = lazy(() =>
  import("../Player").then(mod => ({ default: mod.Player }))
);

export function App() {
  const [currentFilm, setCurrentFilm] = useState<LinkProps | null>(null);

  return (
    <>
      <Prelude
        currentFilm={currentFilm}
        setCurrentFilm={setCurrentFilm}
        running={currentFilm === null}
      />
      {currentFilm !== null && (
        <Player src={currentFilm.url} close={() => setCurrentFilm(null)} />
      )}
    </>
  );
}
