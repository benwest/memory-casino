import { useState, useEffect } from "react"

export const useWindowSize = (): [number, number] => {
  const [windowSize, setWindowSize] = useState<[number, number]>(() => [
    window.innerWidth,
    window.innerHeight,
  ])
  useEffect(() => {
    const onResize = () =>
      setWindowSize([window.innerWidth, window.innerHeight])
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [setWindowSize])
  return windowSize
}
