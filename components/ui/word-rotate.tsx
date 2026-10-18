"use client"

import React from "react"

import { cn } from "@/lib/utils"

/**
 * Props for the WordRotate component
 */
export interface WordRotateProps {
  /**
   * Array of words to rotate through
   */
  words: string[]
  /**
   * Duration in milliseconds for each word display before rotating to the next
   * @default 2000
   */
  duration?: number
  /**
   * Optional class name applied to the rotating word
   */
  className?: string
  /**
   * Optional custom container class name (e.g. for inline or compact navbar usage)
   */
  containerClassName?: string
  /**
   * Optional initial delay in milliseconds before the first rotation
   * @default 0
   */
  delay?: number
}

const SWAP_MS = 250
const OFFSET_PX = 35

/**
 * Rotates through words with a slide-out / slide-in transition.
 * Uses the Web Animations API instead of a motion library to keep the
 * navbar (rendered on every page) free of animation-runtime JS.
 */
export function WordRotate({
  words,
  className,
  containerClassName,
  duration = 2000,
  delay = 0,
}: WordRotateProps) {
  const [index, setIndex] = React.useState(0)
  const wordRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const el = wordRef.current
    if (!el || words.length < 2) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    let cancelled = false
    let timeoutId: ReturnType<typeof setTimeout>

    const rotate = async () => {
      if (cancelled) return
      // Skip work while the element is hidden (e.g. the off-breakpoint copy).
      if (el.offsetParent !== null && !document.hidden) {
        await el.animate(
          [
            { opacity: 1, transform: "translateY(0)" },
            { opacity: 0, transform: `translateY(-${OFFSET_PX}px)` },
          ],
          { duration: SWAP_MS, easing: "ease-in-out", fill: "forwards" }
        ).finished.catch(() => {})
        if (cancelled) return
        setIndex((prev) => (prev + 1) % words.length)
        el.animate(
          [
            { opacity: 0, transform: `translateY(${OFFSET_PX}px)` },
            { opacity: 1, transform: "translateY(0)" },
          ],
          { duration: SWAP_MS, easing: "ease-in-out", fill: "forwards" }
        )
      } else {
        setIndex((prev) => (prev + 1) % words.length)
      }
      timeoutId = setTimeout(rotate, duration + SWAP_MS)
    }

    timeoutId = setTimeout(rotate, duration + delay)
    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [words.length, duration, delay])

  return (
    <div className={cn("overflow-hidden p-2", containerClassName)}>
      <div ref={wordRef} className={cn(className)}>
        {words[index]}
      </div>
    </div>
  )
}
