import { Color, hexToRgba } from "@/utils/Color";
import { getCssVar } from "@/utils/cssVars";

export const BLACK: Color = [0, 0, 0, 1];
export const WHITE: Color = [1, 1, 1, 1];
export const TRANSPARENT_WHITE: Color = [1, 1, 1, 0];
export const GREY = hexToRgba(getCssVar("--color-grey"));
export const YELLOW = hexToRgba(getCssVar("--color-yellow"));
