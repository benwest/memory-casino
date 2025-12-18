import { useState } from "react";
import { Prelude } from "../Prelude";
import { Player } from "../Player";
import { LinkProps } from "@/state/Char";

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
