// Counts a tap on a car card's photo or name, once per car per browser
// session. Fire-and-forget: navigation never waits on the request, and a
// failure never reaches the visitor.
export function recordCardTap(carId: string) {
  try {
    const key = `pz-card-tap:${carId}`
    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
    } catch {
      // Storage blocked (some private modes): send the tap anyway.
    }

    const payload = JSON.stringify({ car_id: carId })
    const queued =
      typeof navigator.sendBeacon === 'function' &&
      navigator.sendBeacon('/api/card-tap', new Blob([payload], { type: 'application/json' }))
    if (!queued) {
      fetch('/api/card-tap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {})
    }
  } catch {
    // Recording is best effort.
  }
}
