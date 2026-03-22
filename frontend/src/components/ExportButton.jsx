// frontend/src/components/ExportButton.jsx
import { useState, useEffect, useRef } from 'react'

export default function ExportButton({
  ticker,
  dates,
  actual,
  predicted,
  residuals,
  forecastDates,
  forecast,
}) {
  const [open,           setOpen]           = useState(false)
  const [includePred,    setIncludePred]    = useState(true)
  const [includeForecast, setIncludeForecast] = useState(true)
  const wrapperRef = useRef(null)

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    function onClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('click', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('click', onClick)
    }
  }, [open])

  function buildCsv() {
    const rows = []
    if (includePred) {
      rows.push('date,actual,predicted,residual')
      dates.forEach((d, i) => {
        rows.push(`${d},${actual[i]},${predicted[i]},${residuals[i]}`)
      })
    }
    if (includeForecast) {
      if (includePred) {
        rows.push('')
        rows.push('# Forecast')
      } else {
        rows.push('forecast_date,forecast_price')
      }
      forecastDates.forEach((d, i) => {
        rows.push(`${d},${forecast[i]}`)
      })
    }
    return rows.join('\n')
  }

  function handleExport() {
    const csv  = buildCsv()
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${ticker}-export.csv`
    a.click()
    URL.revokeObjectURL(url)
    setOpen(false)
  }

  const canExport = includePred || includeForecast

  return (
    <div ref={wrapperRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          background:    'transparent',
          border:        '1px solid var(--text)',
          color:         'var(--text)',
          padding:       '6px 12px',
          fontSize:      10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          cursor:        'pointer',
          fontFamily:    'inherit',
        }}
      >
        Export ▾
      </button>

      {open && (
        <div
          style={{
            position:  'absolute',
            top:       '100%',
            left:      0,
            zIndex:    10,
            border:    '1px solid var(--border)',
            background: 'var(--bg)',
            padding:   16,
            minWidth:  200,
          }}
        >
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, cursor: 'pointer', fontSize: 11, color: 'var(--text)' }}>
            <input
              type="checkbox"
              checked={includePred}
              onChange={(e) => setIncludePred(e.target.checked)}
            />
            Predictions
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, cursor: 'pointer', fontSize: 11, color: 'var(--text)' }}>
            <input
              type="checkbox"
              checked={includeForecast}
              onChange={(e) => setIncludeForecast(e.target.checked)}
            />
            7-Day Forecast
          </label>
          <button
            onClick={handleExport}
            disabled={!canExport}
            className="btn-primary"
            style={{ padding: '8px 12px', fontSize: 10, letterSpacing: '0.1em' }}
          >
            Export
          </button>
        </div>
      )}
    </div>
  )
}
