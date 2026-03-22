export default function MetricsRow({ trainRmse, testRmse, visible }) {
  if (!visible || trainRmse == null || testRmse == null) return null

  const card = {
    border:   '1px solid var(--border)',
    padding:  '16px 24px',
    minWidth: 160,
  }

  return (
    <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
      <div style={card}>
        <div className="label-caps" style={{ marginBottom: 6, color: 'var(--secondary)' }}>
          Train RMSE
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>
          {trainRmse.toFixed(2)}
        </div>
      </div>
      <div style={card}>
        <div className="label-caps" style={{ marginBottom: 6, color: 'var(--secondary)' }}>
          Test RMSE
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>
          {testRmse.toFixed(2)}
        </div>
      </div>
    </div>
  )
}
