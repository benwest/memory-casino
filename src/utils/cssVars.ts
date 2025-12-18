let cachedStyle: CSSStyleDeclaration | null = null;

export function getCssVar(varName: string): string {
  if (!cachedStyle) {
    cachedStyle = getComputedStyle(document.documentElement);
  }
  return cachedStyle.getPropertyValue(varName);
}

window.addEventListener("resize", () => {
  cachedStyle = null;
});
