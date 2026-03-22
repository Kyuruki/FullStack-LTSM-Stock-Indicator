// frontend/src/pages/DashboardPage.jsx
import { useCallback } from 'react'
import { useLSTMApi } from '../hooks/useLSTMApi'
import { useWatchlist } from '../hooks/useWatchlist'
import TickerBar from '../components/TickerBar'
import TickerList from '../components/TickerList'
import SkeletonBlock from '../components/SkeletonBlock'
import ExportButton from '../components/ExportButton'
import TrainingStatus from '../components/TrainingStatus'
import MetricsRow from '../components/MetricsRow'
import PriceChart from '../components/PriceChart'
import ErrorChart from '../components/ErrorChart'
import ForecastChart from '../components/ForecastChart'

export default function DashboardPage() {
  const {
    data, status, progress, trainRmse, testRmse, apiError,
    currentTicker, loadTicker, trainTicker,
  } = useLSTMApi()

  const { items, addRecent, pin, unpin, remove } = useWatchlist()

  const handleLoad = useCallback(async (ticker) => {
    const ok = await loadTicker(ticker)
    if (ok) addRecent(ticker)
  }, [loadTicker, addRecent])

  const idle    = status === 'idle'
  const loading = status === 'loading'

  return (
    <div
      style={{
        minHeight:      '100vh',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     idle ? 'center' : 'stretch',
        justifyContent: idle ? 'center' : 'flex-start',
        padding:        idle ? '16px' : '96px 32px 64px',
        maxWidth:       idle ? 'none' : 1200,
        margin:         '0 auto',
      }}
    >
      {/* Ticker entry — centered when idle, top-aligned when active */}
      <div style={{ width: '100%', maxWidth: idle ? 280 : 'none' }}>
        <p
          className="label-caps"
          style={{
            marginBottom:  idle ? 32 : 24,
            textAlign:     idle ? 'center' : 'left',
            fontSize:      idle ? 22 : 13,
            letterSpacing: idle ? '0.2em' : '0.12em',
          }}
        >
          Stock Forecast
        </p>
        <TickerBar
          onLoad={handleLoad}
          onTrain={trainTicker}
          status={status}
          apiError={apiError}
          centered={idle}
        />
      </div>

      {/* Watchlist chips — below the constrained wrapper, visible in both states */}
      <TickerList
        items={items}
        onLoad={handleLoad}
        onPin={pin}
        onUnpin={unpin}
        onRemove={remove}
      />

      {/* Everything below only shows when not idle */}
      {!idle && (
        <>
          <TrainingStatus progress={progress} visible={status === 'training'} />

          {status === 'untrained' && (
            <p
              style={{
                color:         'var(--secondary)',
                fontSize:      12,
                letterSpacing: '0.04em',
                marginTop:     16,
              }}
            >
              No model found for this ticker —{' '}
              <strong style={{ color: 'var(--text)' }}>Train Model</strong> to get started.
              Training takes 1–3 minutes.
            </p>
          )}

          <MetricsRow
            trainRmse={trainRmse}
            testRmse={testRmse}
            visible={status === 'complete'}
          />

          {/* Loading skeletons */}
          {loading && (
            <>
              <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
                <SkeletonBlock width={160} height={72} />
                <SkeletonBlock width={160} height={72} />
              </div>
              <div style={{ marginBottom: 32 }}>
                <SkeletonBlock width="100%" height={300} />
              </div>
              <div style={{ marginBottom: 32 }}>
                <SkeletonBlock width="100%" height={200} />
              </div>
              <div style={{ marginBottom: 32 }}>
                <SkeletonBlock width="100%" height={300} />
              </div>
            </>
          )}

          {data && (
            <>
              {status === 'complete' && (
                <div style={{ marginBottom: 24 }}>
                  <ExportButton
                    ticker={currentTicker}
                    dates={data.dates}
                    actual={data.actual}
                    predicted={data.predicted}
                    residuals={data.error}
                    forecastDates={data.forecast_dates}
                    forecast={data.forecast}
                  />
                </div>
              )}
              <PriceChart
                dates={data.dates}
                actual={data.actual}
                predicted={data.predicted}
              />
              <ErrorChart
                dates={data.dates}
                error={data.error}
                testRmse={data.test_rmse}
              />
              <ForecastChart
                dates={data.dates}
                actual={data.actual}
                forecastDates={data.forecast_dates}
                forecast={data.forecast}
              />
            </>
          )}
        </>
      )}
    </div>
  )
}
