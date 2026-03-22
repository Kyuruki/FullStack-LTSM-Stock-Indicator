import { useEffect, useRef } from 'react'
import { createChart, ColorType, LineStyle, LineSeries, AreaSeries } from 'lightweight-charts'
import { animateChartData } from '../utils/animateChartData'
import { useThemeValue } from '../hooks/useTheme'

const CHART_THEMES = {
  dark: {
    layout: {
      background: { type: ColorType.Solid, color: '#0e0e0e' },
      textColor: '#666666',
    },
    grid: {
      vertLines: { color: 'rgba(255,255,255,0.05)' },
      horzLines: { color: 'rgba(255,255,255,0.05)' },
    },
    rightPriceScale: { borderColor: '#333333' },
    timeScale: { borderColor: '#333333' },
  },
  light: {
    layout: {
      background: { type: ColorType.Solid, color: '#ffffff' },
      textColor: '#888888',
    },
    grid: {
      vertLines: { color: 'rgba(0,0,0,0.06)' },
      horzLines: { color: 'rgba(0,0,0,0.06)' },
    },
    rightPriceScale: { borderColor: '#000000' },
    timeScale: { borderColor: '#000000' },
  },
}

export default function ErrorChart({ dates, error, testRmse, animationSpeed = 30 }) {
  const containerRef = useRef(null)
  const chartRef     = useRef(null)
  const theme        = useThemeValue()
  const themeRef     = useRef(theme)
  themeRef.current   = theme

  // Data effect — rebuilds + animates only when data changes
  useEffect(() => {
    if (!containerRef.current || !dates?.length) return

    const chart = createChart(containerRef.current, {
      ...CHART_THEMES[themeRef.current],
      width:  containerRef.current.clientWidth,
      height: 200,
    })
    chartRef.current = chart

    const errorSeries = chart.addSeries(AreaSeries, {
      lineColor:   '#ff4d4d',
      topColor:    'rgba(255,77,77,0.6)',
      bottomColor: 'rgba(255,77,77,0.0)',
      lineWidth:   1,
      title:       'Error',
    })
    const rmseSeries = chart.addSeries(LineSeries, {
      color:     '#ff4d4d',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      title:     'RMSE',
    })

    const errorData = dates.map((d, i) => ({ time: d, value: error[i] }))
    const rmseData  = dates.map((d)    => ({ time: d, value: testRmse }))

    let done = 0
    function onSeriesDone() {
      if (++done === 2) chart.timeScale().fitContent()
    }

    const cancelError = animateChartData(errorSeries, errorData, animationSpeed, onSeriesDone)
    const cancelRmse  = animateChartData(rmseSeries,  rmseData,  animationSpeed, onSeriesDone)

    const ro = new ResizeObserver(() => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth })
    })
    ro.observe(containerRef.current)

    return () => {
      cancelError()
      cancelRmse()
      ro.disconnect()
      chart.remove()
      chartRef.current = null
    }
  }, [dates, error, testRmse, animationSpeed])

  // Theme effect — recolors existing chart, no rebuild, no re-animation
  useEffect(() => {
    chartRef.current?.applyOptions(CHART_THEMES[theme])
  }, [theme])

  return (
    <div style={{ marginBottom: 32 }}>
      <h3 style={{ color: 'var(--text)', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
        Prediction Error
      </h3>
      <div ref={containerRef} />
    </div>
  )
}
