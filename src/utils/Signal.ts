export class Signal<T> {
  private listeners = new Set<(value: T) => void>();

  subscribe(listener: (data: T) => void) {
    this.listeners.add(listener);
    const unsubscribe = () => {
      this.listeners.delete(listener);
    };
    unsubscribe[Symbol.dispose] = unsubscribe;
    return unsubscribe;
  }

  emit(data: T) {
    for (const listener of this.listeners) listener(data);
  }

  next(): Promise<T> {
    return new Promise(resolve => {
      const unsubscribe = this.subscribe(data => {
        unsubscribe();
        resolve(data);
      });
    });
  }

  until(predicate: (value: T) => unknown): Promise<T> {
    return new Promise(resolve => {
      const unsubscribe = this.subscribe(value => {
        if (predicate(value)) {
          unsubscribe();
          resolve(value);
        }
      });
    });
  }
}
