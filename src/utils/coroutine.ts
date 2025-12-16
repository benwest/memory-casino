export interface CoroutineContext {
  time: number
  dT: number
  sleep: (duration: number) => Generator<void, void, void>
  tween: (
    duration: number,
    update: (progress: number, time: number) => void,
  ) => Generator<void, void, void>
  until: (predicate: () => boolean) => Generator<void, void, void>
}

export type CoroutineFunction<TReturn = void> = (
  context: CoroutineContext,
) => Generator<void, TReturn, void>

export function* coroutine<TReturn = void>(
  fn: CoroutineFunction<TReturn>,
): Generator<void, TReturn, number> {
  const context: CoroutineContext = {
    time: 0,
    dT: 0,
    sleep: function* (duration) {
      const endTime = context.time + duration
      while (context.time < endTime) {
        yield
      }
    },
    tween: function* (duration, update) {
      const startTime = context.time
      const endTime = startTime + duration
      do {
        const elapsed = Math.min(context.time - startTime, duration)
        const progress = elapsed / duration
        update(progress, elapsed)
        yield
      } while (context.time < endTime)
    },
    until: function* (predicate) {
      while (!predicate()) yield
    },
  }
  const generator = fn.call(context, context)
  let result = generator.next()
  while (!result.done) {
    result = generator.next()
    context.dT = yield
    context.time += context.dT
  }
  return result.value
}

coroutine.tick = function (fn: CoroutineFunction) {
  const generator = coroutine(fn)
  let then = Date.now() / 1000
  let stopped = false
  const next = () => {
    if (stopped) {
      generator.return()
      return
    }
    const now = Date.now() / 1000
    const dT = now - then
    then = now
    generator.next(dT)
    requestAnimationFrame(next)
  }
  requestAnimationFrame(next)
  return () => {
    stopped = true
  }
}
