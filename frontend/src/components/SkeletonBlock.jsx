export default function SkeletonBlock({ width, height }) {
  return (
    <span
      style={{
        display:         'block',
        width:           width,
        height:          height,
        background:      'var(--border)',
        animation:       'skeleton-pulse 1.2s ease-in-out infinite',
      }}
    />
  )
}
