import { useState } from 'react'

export default function TickerBar({ onLoad, onTrain, status, apiError, centered = false }) {
  const [ticker, setTicker] = useState('')

  function handleLoad(e) {
    e.preventDefault()
    if (ticker.trim()) onLoad(ticker.trim().toUpperCase())
  }

  function handleTrain() {
    if (ticker.trim()) onTrain(ticker.trim().toUpperCase())
  }

  const isTraining  = status === 'training' || status === 'loading'
  const showTrain   = status === 'untrained' || status === 'error'
  const showRetrain = status === 'complete'

  const inlineBtn = {
    width:         'auto',
    padding:       '10px 20px',
    fontSize:      '9px',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    fontFamily:    'inherit',
    cursor:        'pointer',
    border:        'none',
  }

  return (
    <div style={{ marginBottom: centered ? 0 : 24 }}>
      <form
        onSubmit={handleLoad}
        style={centered
          ? { display: 'flex', flexDirection: 'column', gap: 12 }
          : { display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }
        }
      >
        <input
          type="text"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          placeholder="^GSPC"
          disabled={isTraining}
          className="input-editorial"
          style={centered ? {} : { maxWidth: 200 }}
        />
        <button
          type="submit"
          disabled={isTraining || !ticker.trim()}
          className="btn-primary"
          style={centered ? undefined : inlineBtn}
        >
          Load
        </button>

        {showTrain && (
          <button
            type="button"
            onClick={handleTrain}
            disabled={!ticker.trim()}
            className="btn-primary"
            style={inlineBtn}
          >
            Train Model
          </button>
        )}

        {showRetrain && (
          <button
            type="button"
            onClick={handleTrain}
            style={{
              ...inlineBtn,
              background:  'transparent',
              border:      '1px solid var(--text)',
              color:       'var(--text)',
              fontWeight:  600,
            }}
          >
            Retrain
          </button>
        )}
      </form>

      {apiError && (
        <p style={{ color: '#ff4d4d', fontSize: 11, letterSpacing: '0.04em', marginTop: 8, marginBottom: 0 }}>
          {apiError}
        </p>
      )}
    </div>
  )
}
