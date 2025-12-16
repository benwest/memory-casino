import { getCssVar } from "@/utils/cssVars";
import { useEffect, useState } from "react";

export function useCssVar(varName: string) {
  const [value, setValue] = useState<string>(() => getCssVar(varName));
  useEffect(() => {
    const onResize = () => setValue(getCssVar(varName));
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [varName]);
  return value;
}
