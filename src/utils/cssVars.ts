export function getCssVar(varName: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(varName);
}
