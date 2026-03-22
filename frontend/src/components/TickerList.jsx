export default function TickerList({ items, onLoad, onPin, onUnpin, onRemove }) {
  if (!items.length) return null

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
      {items.map(({ ticker, pinned }) => (
        <span
          key={ticker}
          style={{
            display:       'inline-flex',
            alignItems:    'center',
            gap:           6,
            padding:       '4px 8px',
            border:        '1px solid var(--border)',
            color:         'var(--text)',
            fontSize:      10,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          <button
            onClick={() => onLoad(ticker)}
            style={{
              background: 'none',
              border:     'none',
              cursor:     'pointer',
              color:      'var(--text)',
              fontSize:   10,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding:    0,
              fontFamily: 'inherit',
            }}
          >
            {ticker}
          </button>
          <button
            onClick={() => pinned ? onUnpin(ticker) : onPin(ticker)}
            style={{
              background: 'none',
              border:     'none',
              cursor:     'pointer',
              color:      'var(--secondary)',
              fontSize:   11,
              padding:    0,
              lineHeight: 1,
            }}
          >
            {pinned ? '★' : '☆'}
          </button>
          <button
            onClick={() => onRemove(ticker)}
            style={{
              background: 'none',
              border:     'none',
              cursor:     'pointer',
              color:      'var(--secondary)',
              fontSize:   11,
              padding:    0,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </span>
      ))}
    </div>
  )
}
