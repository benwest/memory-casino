import { FilmContent } from "@/content";
import { useObservable } from "@/hooks/useObservable";
import { State } from "@/state/State";
import { twMerge } from "tailwind-merge";

const isTouch = "ontouchstart" in window;

export interface LinksProps {
  state: State;
  onClick?: (film: FilmContent) => void;
}

export function Links({ state, onClick }: LinksProps) {
  const links = useObservable(() => state.textLayout.linkRects);
  const enabled = useObservable(() => state.linksEnabled);

  const outset = 5;

  return [...links.entries()].map(([film, rect]) => (
    <button
      key={film.longTitle}
      className={twMerge("cursor-pointer", !enabled && "pointer-events-none")}
      style={{
        position: "absolute",
        left: rect.x - outset,
        top: rect.y - outset,
        width: rect.width + outset * 2,
        height: rect.height + outset * 2,
      }}
      onMouseEnter={
        !isTouch ? () => state.setParams({ hoveredFilm: film }) : undefined
      }
      onMouseLeave={
        !isTouch ? () => state.setParams({ hoveredFilm: null }) : undefined
      }
      onClick={e => {
        e.stopPropagation();
        onClick?.(film);
      }}
    />
  ));
}
