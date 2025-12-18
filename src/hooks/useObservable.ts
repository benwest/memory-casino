import { computed, reaction } from "mobx";
import { useMemo, useSyncExternalStore } from "react";

export function useObservable<T>(get: () => T): T {
  const comp = useMemo(() => computed(get), [get]);
  return useSyncExternalStore(onChange => reaction(get, onChange), get);
}
