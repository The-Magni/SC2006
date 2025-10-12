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
    url = `/api/onemap/route?start=${startLat},${startLng}`
        + `&end=${endLat},${endLng}`
        + `&routeType=pt`
        + `&date=${date}`
        + `&time=${curtime}`
        + `&mode=TRANSIT`
        + `&maxWalkDistance=2000`
        + `&numItineraries=5`
  } else {
    url = `/api/onemap/route?start=${startLat},${startLng}`
        + `&end=${endLat},${endLng}`
        + `&routeType=${mode}`
  }

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Local API failed: ${res.status}`)

  return await res.json()
}
