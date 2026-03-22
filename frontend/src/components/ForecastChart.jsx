import { useEffect, useRef } from 'react'
import { createChart, ColorType, LineStyle, LineSeries } from 'lightweight-charts'
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

export default function ForecastChart({ dates, actual, forecastDates, forecast, animationSpeed = 30 }) {
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
      height: 300,
    })
    chartRef.current = chart

    const window60     = Math.min(60, dates.length)
    const recentDates  = dates.slice(-window60)
    const recentActual = actual.slice(-window60)

    const actualSeries = chart.addSeries(LineSeries, {
      color:     '#00d4ff',
      lineWidth: 2,
      title:     'Actual',
    })
    const forecastSeries = chart.addSeries(LineSeries, {
      color:     '#4a1dff',
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      title:     '7-Day Forecast',
    })

    const actualData = recentDates.map((d, i) => ({ time: d, value: recentActual[i] }))
    const bridgeDate  = recentDates[recentDates.length - 1]
    const bridgeValue = recentActual[recentActual.length - 1]
    const forecastData = [
      { time: bridgeDate, value: bridgeValue },
      ...forecastDates.map((d, i) => ({ time: d, value: forecast[i] })),
    ]

    // Actual animates first, then forecast draws, then fitContent
    const cancelActual = animateChartData(actualSeries, actualData, animationSpeed, () => {
      cancelForecast = animateChartData(forecastSeries, forecastData, animationSpeed, () => {
        chart.timeScale().fitContent()
      })
    })
    let cancelForecast = () => {}

    const ro = new ResizeObserver(() => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth })
    })
    ro.observe(containerRef.current)

    return () => {
      cancelActual()
      cancelForecast()
      ro.disconnect()
      chart.remove()
      chartRef.current = null
    }
  }, [dates, actual, forecastDates, forecast, animationSpeed])

  // Theme effect — recolors existing chart, no rebuild, no re-animation
  useEffect(() => {
    chartRef.current?.applyOptions(CHART_THEMES[theme])
  }, [theme])

  return (
    <div style={{ marginBottom: 32 }}>
      <h3 style={{ color: 'var(--text)', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
        7-Day Forecast
      </h3>
      <div ref={containerRef} />
    </div>
  )
}
