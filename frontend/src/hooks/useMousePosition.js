import { useEffect } from 'react'

// Module-level singleton — shared across all consumers
const pos = { x: 0, y: 0 }
let listenerCount = 0

function handleMouseMove(e) {
  pos.x = e.clientX
  pos.y = e.clientY
}

/**
 * Returns the stable singleton `pos` object { x, y }.
 * Updated by a single shared mousemove listener.
 * Does NOT trigger re-renders — read pos inside rAF loops.
 */
export function useMousePosition() {
  useEffect(() => {
    if (listenerCount === 0) {
      window.addEventListener('mousemove', handleMouseMove)
    }
    listenerCount++

    return () => {
      listenerCount--
      if (listenerCount === 0) {
        window.removeEventListener('mousemove', handleMouseMove)
      }
    }
  }, [])

  return pos
}
