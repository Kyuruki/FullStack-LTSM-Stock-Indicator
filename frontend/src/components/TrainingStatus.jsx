export default function TrainingStatus({ progress, visible }) {
  if (!visible) return null

  const epochs = Math.round((progress / 100) * 1000)

  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          display:        'flex',
          justifyContent: 'space-between',
          marginBottom:   8,
          fontSize:       10,
          letterSpacing:  '0.08em',
          textTransform:  'uppercase',
          color:          'var(--secondary)',
        }}
      >
        <span>Training model</span>
        <span>{epochs} / 1000 epochs ({progress}%)</span>
      </div>
      <div
        style={{
          height:     2,
          background: 'var(--border)',
        }}
      >
        <div
          style={{
            height:     '100%',
            width:      `${progress}%`,
            background: 'var(--text)',
            transition: 'width 300ms ease',
          }}
        />
      </div>
    </div>
  )
}
