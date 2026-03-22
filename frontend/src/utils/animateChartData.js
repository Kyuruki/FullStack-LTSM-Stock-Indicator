/**
 * animateChartData — EKG-style left-to-right data streaming for Lightweight Charts.
 *
 * Streams data points into a series one at a time using setTimeout so the line
 * draws progressively from the leftmost timestamp to the rightmost, mimicking
 * an EKG monitor. Uses the chart's incremental .update() method — no full
 * re-renders on each tick.
 *
 * @param {ISeriesApi} series  - Lightweight Charts series instance (Line, Area, etc.)
 * @param {Array<{time: string, value: number}>} data - Full ordered data array
 * @param {number}     speed  - Milliseconds between each data point (default: 30)
 * @param {() => void} onComplete - Optional callback fired when last point is drawn
 * @returns {() => void} cancel - Call this to abort mid-animation (e.g. on unmount)
 */
export function animateChartData(series, data, speed = 30, onComplete) {
  let index = 0
  let timeoutId = null
  let cancelled = false

  function tick() {
    // Stop if cancelled (component unmounted or data changed)
    if (cancelled) return

    // All points drawn — fire completion callback if provided
    if (index >= data.length) {
      if (onComplete) onComplete()
      return
    }

    // Append the next data point incrementally.
    // .update() adds a new bar when the timestamp is newer than the last bar,
    // which is always the case here since data is chronologically ordered.
    series.update(data[index])
    index++

    // Schedule the next tick at the configured speed
    timeoutId = setTimeout(tick, speed)
  }

  // Kick off immediately — first point appears without delay
  tick()

  // Return a cancel handle for cleanup
  return () => {
    cancelled = true
    if (timeoutId !== null) clearTimeout(timeoutId)
  }
}
