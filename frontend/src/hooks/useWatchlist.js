import { useLocalStorage } from './useLocalStorage'

const DEFAULT = { pinned: [], recents: [] }

export function useWatchlist() {
  const [state, setState] = useLocalStorage('watchlist', DEFAULT)

  function addRecent(ticker) {
    setState((prev) => {
      if (prev.pinned.includes(ticker)) return prev
      const filtered = prev.recents.filter((t) => t !== ticker)
      const recents = [ticker, ...filtered].slice(0, 3)
      return { ...prev, recents }
    })
  }

  function pin(ticker) {
    setState((prev) => {
      if (prev.pinned.includes(ticker)) return prev
      return {
        pinned:  [ticker, ...prev.pinned],
        recents: prev.recents.filter((t) => t !== ticker),
      }
    })
  }

  function unpin(ticker) {
    setState((prev) => {
      const recents = [ticker, ...prev.recents].slice(0, 3)
      return {
        pinned:  prev.pinned.filter((t) => t !== ticker),
        recents,
      }
    })
  }

  function remove(ticker) {
    setState((prev) => ({
      pinned:  prev.pinned.filter((t) => t !== ticker),
      recents: prev.recents.filter((t) => t !== ticker),
    }))
  }

  const items = [
    ...state.pinned.map((ticker) => ({ ticker, pinned: true })),
    ...state.recents.map((ticker) => ({ ticker, pinned: false })),
  ]

  return { items, addRecent, pin, unpin, remove }
}
