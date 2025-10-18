import { MapDisplayHandle } from "@/components/map-display"

export async function getRoute(
  start: [number, number],
  end: [number, number],
  mode: "pt" | "drive" | "walk" | "cycle" = "pt"
) {
  const [startLat, startLng] = start
  const [endLat, endLng] = end

  const now = new Date()
  const date = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-${now.getFullYear()}`
  const curtime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:00`

  let url = ""

  if (mode === "pt") {

    url =
      `/api/onemap/route?start=${startLat},${startLng}` +
      `&end=${endLat},${endLng}` +
      `&routeType=pt` +
      `&date=${date}` +
      `&time=${curtime}` +
      `&mode=TRANSIT` +
      `&maxWalkDistance=2000` +
      `&numItineraries=5`
  } else {

    url =
      `/api/onemap/route?start=${startLat},${startLng}` +
      `&end=${endLat},${endLng}` +
      `&routeType=${mode}` +
      `&numItineraries=5`

  }

  const res = await fetch(url)
  if (!res.ok) {
    const errText = await res.text()
    console.error(`OneMap API failed: ${res.status} →`, errText)
    throw new Error(`OneMap API failed (${res.status})`)
  }

  return await res.json()
}

export function drawPolylines(itineraries: any[], mapRef: React.RefObject<MapDisplayHandle>) {
  if (!mapRef.current) return
  const map = mapRef.current

  // clear previous layers
  map.eachLayer((layer) => {
    if ((layer as any).options && !(layer as any).options.attribution) {
      map.removeLayer(layer)
    }
  })

  itineraries.forEach((iti, index) => {
    const color = index === 0 ? "red" : "blue"
    const lines = iti.getAllPolylines()
    lines.forEach((poly: [number, number][]) => {
      L.polyline(poly, { color, weight: 4, opacity: 0.8 }).addTo(map)
    })
  })

  // auto-zoom to route
  const allPoints = itineraries.flatMap((iti) =>
    iti.getAllPolylines().flat()
  )
  if (allPoints.length > 0) {
    const bounds = L.latLngBounds(allPoints as any)
    map.fitBounds(bounds, { padding: [50, 50] })
  }
}