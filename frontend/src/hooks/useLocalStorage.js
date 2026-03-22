import { useState } from 'react'

export function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw === null) return defaultValue
      return JSON.parse(raw)
    } catch {
      localStorage.setItem(key, JSON.stringify(defaultValue))
      return defaultValue
    }
  })

  function set(updater) {
    setValue((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      localStorage.setItem(key, JSON.stringify(next))
      return next
    })
  }

  return [value, set]
}
