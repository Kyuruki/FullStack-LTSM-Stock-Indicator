import { useEffect, useRef } from 'react'
import { useThemeValue } from '../hooks/useTheme'

export default function CustomCursor() {
  const ringRef = useRef(null)
  const theme = useThemeValue()

  useEffect(() => {
    const ring = ringRef.current
    if (!ring) return

    let mouseX = -200, mouseY = -200
    let curX = -200, curY = -200
    let raf

    const onMove = (e) => {
      mouseX = e.clientX
      mouseY = e.clientY
    }

    const loop = () => {
      curX += (mouseX - curX) * 0.18
      curY += (mouseY - curY) * 0.18
      ring.style.transform = `translate(${curX}px, ${curY}px)`
      raf = requestAnimationFrame(loop)
    }

    window.addEventListener('mousemove', onMove)
    raf = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  const isDark = theme === 'dark'
  const color = isDark ? '255,255,255' : '0,0,0'

  return (
    <div
      ref={ringRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: 36,
        height: 36,
        marginLeft: -18,
        marginTop: -18,
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 99999,
        background: `rgba(${color}, 0.06)`,
        border: `1.5px solid rgba(${color}, 0.55)`,
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        willChange: 'transform',
      }}
    />
  )
}
