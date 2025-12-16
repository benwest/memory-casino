import { signal, computed, effect, Signal } from "@preact/signals-core";
import {
  useRef,
  useMemo,
  useEffect,
  useSyncExternalStore,
  useCallback,
  SetStateAction,
} from "react";

export function useSignal<T>(initialValue: T) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => signal<T>(initialValue), []);
}

export function useComputed<T>(compute: () => T) {
  const $compute = useRef(compute);
  $compute.current = compute;
  return useMemo(() => computed<T>(() => $compute.current()), []);
}

export function useSignalEffect(cb: () => void | (() => void)) {
  const callback = useRef(cb);
  callback.current = cb;
  useEffect(() => {
    return effect(() => callback.current());
  }, []);
}

export function useSignalValue<T>(signal: Signal<T>) {
  return useSyncExternalStore(
    fn => signal.subscribe(fn),
    () => signal.value,
    () => signal.value
  );
}

export function useSignalState<T>(signal: Signal<T>) {
  const value = useSignalValue(signal);
  const setValue = useCallback(
    (newValue: SetStateAction<T>) => {
      signal.value =
        typeof newValue === "function"
          ? (newValue as (prevValue: T) => T)(signal.value)
          : newValue;
    },
    [signal]
  );
  return [value, setValue] as const;
}

export function useComputedValue<T>(compute: () => T) {
  return useSignalValue(useComputed(compute));
}

export function unwrapSignal<T>(value: T | Signal<T>) {
  return value instanceof Signal ? value.value : value;
}
