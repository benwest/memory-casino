import { useObservable } from "@/hooks/useObservable";
import { LinkProps } from "@/state/Char";
import { State } from "@/state/State";
import { twMerge } from "tailwind-merge";

const isTouch = "ontouchstart" in window;

export interface LinksProps {
  state: State;
  onClick?: (link: LinkProps) => void;
}

export function Links({ state, onClick }: LinksProps) {
  const links = useObservable(() => state.textLayout.linkRects);
  const enabled = useObservable(() => state.linksEnabled);

  const outset = 5;

  return [...links.entries()].map(([link, rect]) => (
    <button
      key={link.url}
      className={twMerge("cursor-pointer", !enabled && "pointer-events-none")}
      style={{
        position: "absolute",
        left: rect.x - outset,
        top: rect.y - outset,
        width: rect.width + outset * 2,
        height: rect.height + outset * 2,
      }}
      onMouseEnter={
        !isTouch ? () => state.setParams({ hoveredLink: link }) : undefined
      }
      onMouseLeave={
        !isTouch ? () => state.setParams({ hoveredLink: null }) : undefined
      }
      onClick={e => {
        e.stopPropagation();
        console.log("Link clicked:", link);
        onClick?.(link);
      }}
    />
  ));
}
