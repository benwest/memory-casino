import { LinkProps } from "@/state/Char";
import { State } from "@/state/State";
import { Rect } from "@/utils/Rect";
import { useMemo, useSyncExternalStore } from "react";

export interface LinksProps {
  state: State;
  onClick?: (link: LinkProps) => void;
}

export function Links({ state, onClick }: LinksProps) {
  const links = useSyncExternalStore(
    update => state.onLayoutUpdated.subscribe(update),
    () => state.textLayout.linkRects
  );

  const outset = 5;

  return [...links.entries()].map(([link, rect]) => (
    <button
      key={link.url}
      className="cursor-pointer"
      style={{
        position: "absolute",
        left: rect.x - outset,
        top: rect.y - outset,
        width: rect.width + outset * 2,
        height: rect.height + outset * 2,
      }}
      onMouseEnter={() => (state.hoveredLink = link)}
      onMouseLeave={() => (state.hoveredLink = null)}
      onClick={() => onClick?.(link)}
    />
  ));
}
