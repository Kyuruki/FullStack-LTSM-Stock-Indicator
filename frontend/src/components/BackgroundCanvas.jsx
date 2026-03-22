import { useEffect, useRef } from 'react'

const COUNT      = 22
const SIDES_LIST = [3, 4, 5, 6, 8]
const MAX_SPEED  = 20   // px per second
const MAX_ROT    = 0.15 // radians per second

const THEME = {
  dark:  { bg: '#0e0e0e', stroke: 'rgba(255,255,255,' },
  light: { bg: '#ffffff', stroke: 'rgba(0,0,0,' },
}

function rand(min, max) { return min + Math.random() * (max - min) }

function spawnPolygon(W, H) {
  return {
    sides:    SIDES_LIST[Math.floor(Math.random() * SIDES_LIST.length)],
    radius:   rand(80, 250),
    x:        rand(0, W),
    y:        rand(0, H),
    rotation: rand(0, Math.PI * 2),
    vx:       rand(-MAX_SPEED, MAX_SPEED),
    vy:       rand(-MAX_SPEED, MAX_SPEED),
    rot:      rand(-MAX_ROT, MAX_ROT),
    opacity:  rand(0.6, 1.0),
  }
}

export default function BackgroundCanvas({ theme = 'dark' }) {
  const canvasRef  = useRef(null)
  const themeRef   = useRef(theme)

  // Keep themeRef in sync so the draw loop always has the latest theme
  themeRef.current = theme

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    if (!ctx) return
    let W = window.innerWidth
    let H = window.innerHeight
    canvas.width  = W
    canvas.height = H

    const polygons = Array.from({ length: COUNT }, () => spawnPolygon(W, H))

    let rafId
    let prev = performance.now()

    function draw(now) {
      rafId      = requestAnimationFrame(draw)
      const dt   = Math.min((now - prev) / 1000, 0.05)
      prev       = now

      const t = themeRef.current
      ctx.fillStyle = THEME[t]?.bg ?? THEME.dark.bg
      ctx.fillRect(0, 0, W, H)

      const strokeBase = THEME[t]?.stroke ?? THEME.dark.stroke

      for (const p of polygons) {
        // Move
        p.x        += p.vx  * dt
        p.y        += p.vy  * dt
        p.rotation += p.rot * dt

        // Wrap
        const pad = p.radius + 10
        if (p.x >  W + pad) p.x = -pad
        if (p.x < -pad)     p.x =  W + pad
        if (p.y >  H + pad) p.y = -pad
        if (p.y < -pad)     p.y =  H + pad

        // Draw polygon outline
        ctx.beginPath()
        for (let i = 0; i < p.sides; i++) {
          const a = (i / p.sides) * Math.PI * 2 + p.rotation
          const x = p.x + Math.cos(a) * p.radius
          const y = p.y + Math.sin(a) * p.radius
          if (i === 0) ctx.moveTo(x, y)
          else         ctx.lineTo(x, y)
        }
        ctx.closePath()
        ctx.strokeStyle = strokeBase + p.opacity + ')'
        ctx.lineWidth   = 1
        ctx.stroke()
      }
    }

    draw(performance.now())

    function onResize() {
      W = window.innerWidth
      H = window.innerHeight
      canvas.width  = W
      canvas.height = H
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset:    0,
        zIndex:   0,
        display:  'block',
      }}
    />
  )
}
