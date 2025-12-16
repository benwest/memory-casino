import { useState } from "react";
import { Prelude } from "../Prelude";
import { Player } from "../Player";

export function App() {
  const [currentFilm, setCurrentFilm] = useState<string | null>(null);

  return (
    <>
      <Prelude setCurrentFilm={setCurrentFilm} running={currentFilm === null} />
      {currentFilm !== null && (
        <Player src={currentFilm} close={() => setCurrentFilm(null)} />
      )}
    </>
  );
}
