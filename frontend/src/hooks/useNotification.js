export function useNotification() {
  function requestPermission() {
    if (!('Notification' in window)) return
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  function notify(ticker) {
    if (!('Notification' in window)) return
    if (Notification.permission === 'granted' && document.hidden) {
      new Notification(`${ticker} model ready`, { body: 'Training complete.' })
    }
  }

  return { requestPermission, notify }
}
