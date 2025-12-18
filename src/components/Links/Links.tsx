import { useObservable } from "@/hooks/useObservable";
import { LinkProps } from "@/state/Char";
import { State } from "@/state/State";
import { Rect } from "@/utils/Rect";
import { useMemo, useSyncExternalStore } from "react";
import { twMerge } from "tailwind-merge";

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
      onMouseEnter={() => state.setParams({ hoveredLink: link })}
      onMouseLeave={() => state.setParams({ hoveredLink: null })}
      onClick={() => onClick?.(link)}
    />
  ));
}
