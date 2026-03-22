// frontend/src/hooks/useLSTMApi.js
import { useState, useRef, useCallback, useEffect } from 'react'
import { useNotification } from './useNotification'

const BASE_URL = 'http://localhost:8000'
const POLL_INTERVAL = 2000

/**
 * Hook for all LSTM backend communication.
 *
 * Exposes:
 *   data         — full /predict payload or null
 *   status       — "idle" | "loading" | "untrained" | "training" | "complete" | "error"
 *   progress     — int 0–100
 *   trainRmse    — float or null
 *   testRmse     — float or null
 *   apiError     — string or null
 *   currentTicker — string or null (last ticker passed to loadTicker)
 *   loadTicker   — async (ticker) => bool (true = reached server, false = network error or 400)
 *   trainTicker  — async (ticker) => void
 */
export function useLSTMApi() {
  const [data,         setData]         = useState(null)
  const [status,       setStatus]       = useState('idle')
  const [progress,     setProgress]     = useState(0)
  const [trainRmse,    setTrainRmse]    = useState(null)
  const [testRmse,     setTestRmse]     = useState(null)
  const [apiError,     setApiError]     = useState(null)
  const [currentTicker, setCurrentTicker] = useState(null)

  const pollRef        = useRef(null)
  const wasTrainingRef = useRef(false)
  const { requestPermission, notify } = useNotification()

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  useEffect(() => () => stopPolling(), [])

  const loadTicker = useCallback(async (ticker) => {
    setApiError(null)
    setData(null)
    setStatus('loading')
    setProgress(0)
    setTrainRmse(null)
    setTestRmse(null)
    setCurrentTicker(ticker)

    try {
      const res = await fetch(
        `${BASE_URL}/predict?ticker=${encodeURIComponent(ticker)}`,
      )
      if (res.status === 400) {
        const err = await res.json()
        setApiError(err.detail || 'Invalid ticker')
        setStatus('error')
        return false
      }
      const json = await res.json()
      if (json.status === 'untrained') {
        setStatus('untrained')
      } else {
        setData(json)
        setTrainRmse(json.train_rmse)
        setTestRmse(json.test_rmse)
        setStatus('complete')
      }
      return true
    } catch {
      setApiError('Cannot reach backend. Is it running on port 8000?')
      setStatus('error')
      return false
    }
  }, [])

  const trainTicker = useCallback(
    async (ticker) => {
      requestPermission()
      setApiError(null)
      setData(null)
      setStatus('training')
      setProgress(0)
      setTrainRmse(null)
      setTestRmse(null)
      setCurrentTicker(ticker)
      stopPolling()

      try {
        await fetch(`${BASE_URL}/train?ticker=${encodeURIComponent(ticker)}`, {
          method: 'POST',
        })
      } catch {
        setApiError('Cannot reach backend. Is it running on port 8000?')
        setStatus('idle')
        return
      }

      pollRef.current = setInterval(async () => {
        try {
          const res  = await fetch(
            `${BASE_URL}/status?ticker=${encodeURIComponent(ticker)}`,
          )
          const json = await res.json()
          setTrainRmse(json.train_rmse)
          setTestRmse(json.test_rmse)

          if (json.status === 'training') {
            wasTrainingRef.current = true
            setProgress(json.progress ?? 0)
          }
          if (json.status === 'complete' && wasTrainingRef.current) {
            wasTrainingRef.current = false
            stopPolling()
            notify(ticker)
            loadTicker(ticker)
          } else if (json.status === 'error') {
            stopPolling()
            setStatus('error')
            setApiError(json.error_message || 'Training failed')
          }
        } catch {
          stopPolling()
          setApiError('Lost connection to backend during training')
          setStatus('error')
        }
      }, POLL_INTERVAL)
    },
    [loadTicker, requestPermission, notify],
  )

  return {
    data,
    status,
    progress,
    trainRmse,
    testRmse,
    apiError,
    currentTicker,
    loadTicker,
    trainTicker,
  }
}
