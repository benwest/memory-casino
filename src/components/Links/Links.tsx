import { LinkProps } from "@/state/Char";
import { State } from "@/state/State";
import { Rect } from "@/utils/Rect";
import { useMemo } from "react";

export interface LinksProps {
  state: State;
  onClick?: (url: string) => void;
}

export function Links({ state, onClick }: LinksProps) {
  const links = useMemo(() => {
    const links = new Map<LinkProps, Rect>();
    for (const char of state.textLayout.lines.flat()) {
      if (!char.link) continue;
      if (!links.has(char.link)) {
        links.set(char.link, char.rect.clone());
      } else {
        links.get(char.link)!.expand(char.rect);
      }
    }
    return links;
  }, [state]);

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
      onClick={() => onClick?.(link.url)}
    />
  ));
}
